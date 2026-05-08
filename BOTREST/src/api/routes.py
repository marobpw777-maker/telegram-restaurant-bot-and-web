# src/api/routes.py
"""REST API для веб-интерфейса: защищенный, типизированный, с Pydantic."""
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from src.core.database import AsyncSessionLocal
from src.models.booking import Booking
from src.models.menu import Category, MenuItem
from src.models.user import User
from src.services.booking_service import BookingService
from src.services.unit_economics_service import UnitEconomicsService
from src.api.auth import AdminLoginRequest, require_admin, verify_admin_credentials, get_current_admin_login
from src.api import schemas
from src import config

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

# ── Auth ───────────────────────────────────────────────

@router.get("/auth/me")
async def auth_me(request: Request):
    if request.session.get("admin_authenticated") is True:
        return {"authenticated": True, "login": request.session.get("admin_login", config.ADMIN_LOGIN)}
    return {"authenticated": False}

@router.post("/auth/login")
async def auth_login(request: Request, data: AdminLoginRequest):
    if not config.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ADMIN_PASSWORD не задан в BOTREST/.env",
        )
    if not verify_admin_credentials(data.username, data.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")
    request.session.clear()
    request.session["admin_authenticated"] = True
    request.session["admin_login"] = data.username
    return {"ok": True, "login": data.username}

@router.post("/auth/logout")
async def auth_logout(request: Request):
    request.session.clear()
    return {"ok": True}


# ── Dependency ──────────────────────────────────────────

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# ── Бронирования ────────────────────────────────────────

@router.get("/bookings", response_model=List[schemas.BookingRead])
async def list_bookings(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)  # Требуем ключ
):
    svc = BookingService(db)
    bookings = await svc.list_bookings(start_date, end_date, status)
    
    # Оптимизированное получение данных CRM
    tg_ids = [b.telegram_id for b in bookings if b.telegram_id]
    users_map = {}
    if tg_ids:
        user_result = await db.execute(select(User).where(User.telegram_id.in_(tg_ids)))
        users_map = {u.telegram_id: u for u in user_result.scalars().all()}
        
    return [
        _map_booking_to_schema(b, users_map.get(b.telegram_id)) 
        for b in bookings
    ]

@router.post("/bookings", response_model=schemas.BookingRead)
async def create_booking(
    data: schemas.BookingCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Публичный эндпоинт для создания брони с сайта."""
    svc = BookingService(db)
    try:
        booking = await svc.create_booking(
            telegram_id=None,
            start_at=data.start_at,
            duration_minutes=data.duration_minutes,
            guests_count=data.guests_count,
            customer_name=data.customer_name,
            phone=data.phone,
            notes=data.notes,
            source="website",
        )
        
        # Уведомление через бот
        await _notify_admins_of_web_booking(booking)
        
        return _map_booking_to_schema(booking)
    except Exception as e:
        logger.exception("Ошибка при создании брони с сайта")
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/bookings/{booking_id}", response_model=schemas.BookingRead)
async def update_booking(
    booking_id: int, 
    data: schemas.BookingUpdate, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    svc = BookingService(db)
    booking = await svc.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if data.status:
        booking = await svc.update_status(
            booking_id, 
            data.status, 
            data.admin_comment,
            spent_amount=data.spent_amount
        )
    else:
        # Частичное обновление полей
        for key, value in data.dict(exclude_unset=True).items():
            if hasattr(booking, key):
                setattr(booking, key, value)
        booking.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(booking)

    user = None
    if booking.telegram_id:
        user_result = await db.execute(select(User).where(User.telegram_id == booking.telegram_id))
        user = user_result.scalar_one_or_none()

    return _map_booking_to_schema(booking, user)

@router.get("/availability")
async def check_availability(
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),  # ✅ Валидация формата даты
    duration: int = Query(90, ge=15, le=480),  # ✅ Валидация длительности
    db: AsyncSession = Depends(get_db),
):
    """Публичный эндпоинт проверки свободных столиков. Безопасен от SQL-injection."""
    try:
        svc = BookingService(db)
        existing = await svc.get_bookings_by_date(date)
        slots = []
        start_h, end_h = config.WORK_HOURS_START, config.WORK_HOURS_END
        now = datetime.now()
        sel_date = datetime.fromisoformat(f"{date}T00:00:00")
        
        # ✅ Дополнительная валидация: нельзя запрашивать прошлые даты
        if sel_date < now.replace(hour=0, minute=0, second=0, microsecond=0):
            raise HTTPException(status_code=400, detail="Дата не может быть в прошлом")

        for hour in range(start_h, end_h):
            for minute in range(0, 60, 30):
                slot_dt = sel_date.replace(hour=hour, minute=minute)
                if slot_dt <= now: 
                    continue
                
                slot_end = slot_dt + timedelta(minutes=duration)
                has_conflict = any(
                    slot_dt < (b.start_at + timedelta(minutes=b.duration_minutes)) 
                    and slot_end > b.start_at 
                    for b in existing
                )
                slots.append({"time": slot_dt.strftime("%H:%M"), "available": not has_conflict})
        return slots
    except ValueError as e:
        logger.warning(f"Invalid date format or value in /availability: {e}")
        raise HTTPException(status_code=400, detail="Некорректная дата")

# ── Категории меню ──────────────────────────────────────

@router.get("/categories", response_model=List[schemas.CategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.sort_order))
    return result.scalars().all()

@router.post("/categories", response_model=schemas.CategoryRead)
async def create_category(
    data: schemas.CategoryCreate, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    cat = Category(**data.dict())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.patch("/categories/{cat_id}", response_model=schemas.CategoryRead)
async def update_category(
    cat_id: int,
    data: schemas.CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    cat = await db.get(Category, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in data.dict(exclude_unset=True).items():
        if hasattr(cat, key):
            setattr(cat, key, value)
    cat.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(cat)
    return cat

@router.delete("/categories/{cat_id}")
async def delete_category(
    cat_id: int, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    cat = await db.get(Category, cat_id)
    if not cat: raise HTTPException(status_code=404)
    await db.delete(cat)
    await db.commit()
    return {"ok": True}

# ── Блюда меню ──────────────────────────────────────────

@router.get("/menu-items", response_model=List[schemas.MenuItemRead])
async def list_menu_items(
    category_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MenuItem).order_by(MenuItem.created_at.desc())
    if category_id:
        stmt = stmt.where(MenuItem.category_id == category_id)
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    # Подтягиваем категории
    cats_result = await db.execute(select(Category))
    cats_map = {c.id: c for c in cats_result.scalars().all()}
    
    for item in items:
        item.category = cats_map.get(item.category_id)
    return items

@router.post("/menu-items", response_model=schemas.MenuItemRead)
async def create_menu_item(
    data: schemas.MenuItemCreate, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    item = MenuItem(**data.dict())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.patch("/menu-items/{item_id}", response_model=schemas.MenuItemRead)
async def update_menu_item(
    item_id: int, 
    data: schemas.MenuItemUpdate, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    item = await db.get(MenuItem, item_id)
    if not item: raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in data.dict(exclude_unset=True).items():
        if hasattr(item, key):
            setattr(item, key, value)
            
    item.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    
    # Подтягиваем категорию
    if item.category_id:
        item.category = await db.get(Category, item.category_id)
        
    return item

@router.delete("/menu-items/{item_id}")
async def delete_menu_item(
    item_id: int, 
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    item = await db.get(MenuItem, item_id)
    if not item: raise HTTPException(status_code=404)
    await db.delete(item)
    await db.commit()
    return {"ok": True}

# ── AI Чат ──────────────────────────────────────────────

class AIChatRequest(BaseModel):
    message: str
    persona: str = "sommelier"

class AIChatResponse(BaseModel):
    response: str

@router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat(
    data: AIChatRequest,
    # В реальном приложении здесь может быть rate limiting
    # _ = Depends(require_admin) # Оставляем открытым для сайта или защищаем
):
    from src.services.ai_service import get_ai_response
    response_text = await get_ai_response(data.message, persona=data.persona)
    return AIChatResponse(response=response_text)

# ── Маркетинг ───────────────────────────────────────────

@router.post("/marketing/broadcast")
async def send_marketing_broadcast(
    data: schemas.BroadcastRequest, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    """Защищенная рассылка."""
    try:
        result = await db.execute(
            select(User).where(
                User.telegram_id.isnot(None),
                or_(User.agreed_to_policy == True, User.marketing_consent == True),
            )
        )
        users = result.scalars().all()
        background_tasks.add_task(_run_broadcast_task, data.text, users)
        return {"ok": True, "estimated_audience": len(users)}
    except Exception as e:
        logger.exception("Ошибка при запуске рассылки")
        raise HTTPException(status_code=500, detail="Internal server error")



# ── Unit economics ─────────────────────────────────────

@router.get("/unit-economics/settings", response_model=schemas.UnitEconomicsSettings)
async def get_unit_economics_settings(
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin),
):
    svc = UnitEconomicsService(db)
    return await svc.get_settings()


@router.put("/unit-economics/settings", response_model=schemas.UnitEconomicsSettings)
async def update_unit_economics_settings(
    data: schemas.UnitEconomicsSettings,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin),
):
    svc = UnitEconomicsService(db)
    return await svc.update_settings(data.model_dump())


@router.get("/unit-economics/report", response_model=schemas.UnitEconomicsReport)
async def get_unit_economics_report(
    months: int = Query(6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin),
):
    svc = UnitEconomicsService(db)
    return await svc.build_report(months=months)

# ── CRM & Администрирование ────────────────────────────

@router.post("/admin/users/{telegram_id}/unban")
async def unban_user(
    telegram_id: int,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_admin)
):
    """✅ НОВОЕ: Администратор может разбанить пользователя и сбросить счётчик no-shows."""
    svc = BookingService(db)
    user = await svc.unban_user(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    logger.info(f"✅ Пользователь {telegram_id} разбанен администратором")
    return {"ok": True, "user_id": user.id, "message": "Пользователь разбанен"}

# ── Вспомогательные функции ──────────────────────────────

async def _run_broadcast_task(text: str, users: list):
    """✅ Улучшено: Логирует ошибки вместо молчаливого их скрывания."""
    from src.bot_instance import bot
    success = 0
    failed = 0
    for u in users:
        try:
            await bot.send_message(u.telegram_id, text, parse_mode="HTML")
            success += 1
        except Exception as e:
            logger.warning(f"⚠️ Не удалось отправить рассылку пользователю {u.telegram_id}: {e}")
            failed += 1
    logger.info(f"✅ Рассылка завершена: {success}/{len(users)} успешно, {failed} ошибок")

async def _notify_admins_of_web_booking(booking: Booking):
    """✅ Улучшено: Логирует ошибки вместо молчаливого их скрывания."""
    from src.bot_instance import bot
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    kb = InlineKeyboardBuilder()
    kb.button(text="✅ Подтвердить", callback_data=f"admin_confirm:{booking.id}")
    kb.button(text="❌ Отклонить", callback_data=f"admin_reject:{booking.id}")
    notes_line = f"\n💬 {booking.notes}" if booking.notes else ""
    text = (
        f"🌐 <b>Новая бронь #{booking.id} (сайт)</b>\n"
        f"👤 {booking.customer_name}\n📞 {booking.phone}\n"
        f"📅 {booking.start_at.strftime('%d.%m.%Y в %H:%M')}"
        f"{notes_line}"
    )
    for admin_id in config.ADMIN_IDS:
        try:
            await bot.send_message(admin_id, text, parse_mode="HTML", reply_markup=kb.as_markup())
        except Exception as e:
            logger.warning(f"⚠️ Не удалось отправить уведомление админу {admin_id}: {e}")

def _map_booking_to_schema(b: Booking, user: User = None) -> schemas.BookingRead:
    """Маппинг модели БД в схему Pydantic с CRM данными."""
    crm = {
        "no_show_count": user.no_show_count if user else 0,
        "is_banned": user.is_banned if user else False,
        "visits_count": user.visits_count if user else 0,
        "total_spent": user.total_spent if user else 0.0,
    }
    return schemas.BookingRead(
        **b.__dict__,
        crm=schemas.UserCRM(**crm)
    )
