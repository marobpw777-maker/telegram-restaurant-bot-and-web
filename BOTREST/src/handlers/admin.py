import logging
from datetime import datetime

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

from src import config, texts
from src.core.database import AsyncSessionLocal
from src.models.booking import BookingStatus
from src.services.booking_service import BookingService
from src.utils.message_tools import replace_message_content

router = Router()
logger = logging.getLogger(__name__)


def _build_admin_webapp_url() -> str | None:
    """Собирает ссылку на админ-роут внутри HashRouter."""
    base_url = (config.WEB_APP_URL or "").strip().rstrip("/")
    if not base_url:
        return None
    if "#/" in base_url:
        return f"{base_url.rstrip('/')}/admin"
    return f"{base_url}/#/admin"


@router.message(Command("admin"))
async def admin_dashboard_command(message: Message):
    """Сводка для администратора."""
    if message.from_user.id not in config.ADMIN_IDS:
        return

    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        all_bookings = await svc.list_bookings(limit=500)
        today_str = datetime.now().strftime("%Y-%m-%d")

        pending = [b for b in all_bookings if b.status == BookingStatus.pending.value]
        today = [b for b in all_bookings if b.start_at.strftime("%Y-%m-%d") == today_str]

        admin_url = _build_admin_webapp_url()
        text = (
            "📊 <b>АДМИН-ПАНЕЛЬ БОТА</b>\n"
            "─────────────────────\n"
            f"⏳ Новых заявок: <b>{len(pending)}</b>\n"
            f"📅 Всего на сегодня: <b>{len(today)}</b>\n"
            "─────────────────────\n"
            + (f"🔗 <b>Веб-админка:</b> <code>{admin_url}</code>\n" if admin_url else "🔗 <b>Веб-админка:</b> не настроена\n")
            + "<i>Используйте логин/пароль из .env</i>"
        )

        kb = InlineKeyboardBuilder()
        if admin_url:
            kb.button(text="Открыть веб-админку", web_app=WebAppInfo(url=admin_url))
            kb.adjust(1)

        await message.answer(text, parse_mode="HTML", reply_markup=kb.as_markup() if admin_url else None)


@router.callback_query(F.data.startswith("admin_confirm:"))
async def admin_confirm_booking(cb: CallbackQuery):
    """Админ подтверждает бронь."""
    if cb.from_user.id not in config.ADMIN_IDS:
        await cb.answer("Нет доступа", show_alert=True)
        return

    booking_id = int(cb.data.split(":")[1])
    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        booking = await svc.update_status(booking_id, "confirmed")

        if booking:
            if booking.telegram_id:
                try:
                    await cb.bot.send_message(
                        booking.telegram_id,
                        texts.BOOK_CONFIRMED.format(
                            name=booking.customer_name,
                            date=booking.start_at.strftime("%d.%m.%Y"),
                            time=booking.start_at.strftime("%H:%M"),
                        ),
                    )
                except Exception as e:
                    logger.error(f"Не удалось уведомить гостя {booking.telegram_id}: {e}")

            await replace_message_content(cb.message, (cb.message.text or cb.message.caption or "") + "\n\n✅ ПОДТВЕРЖДЕНО")
        else:
            await cb.answer("Бронь не найдена", show_alert=True)
    await cb.answer()


@router.callback_query(F.data.startswith("admin_reject:"))
async def admin_reject_booking(cb: CallbackQuery):
    """Админ отклоняет бронь."""
    if cb.from_user.id not in config.ADMIN_IDS:
        await cb.answer("Нет доступа", show_alert=True)
        return

    booking_id = int(cb.data.split(":")[1])
    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        booking = await svc.update_status(booking_id, "rejected")
        if booking and booking.telegram_id:
            try:
                await cb.bot.send_message(
                    booking.telegram_id,
                    texts.BOOK_REJECTED.format(phone=booking.phone),
                )
            except Exception:
                logger.exception(f"Не удалось уведомить гостя {booking.id}")
            await replace_message_content(cb.message, (cb.message.text or cb.message.caption or "") + "\n\n❌ ОТКЛОНЕНО")
    await cb.answer()


@router.callback_query(F.data.startswith("reminder_confirm:"))
async def reminder_confirm(cb: CallbackQuery):
    """Гость подтвердил визит из напоминания."""
    booking_id = int(cb.data.split(":")[1])
    await replace_message_content(cb.message, (cb.message.text or cb.message.caption or "") + "\n\n✅ Вы подтвердили визит. Ждём вас!")
    await cb.answer("Спасибо!")

    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        booking = await svc.get_booking(booking_id)
        if booking:
            for admin_id in config.ADMIN_IDS:
                try:
                    await cb.bot.send_message(
                        admin_id,
                        f"✅ Гость {booking.customer_name} подтвердил визит "
                        f"на {booking.start_at.strftime('%d.%m в %H:%M')}",
                    )
                except:
                    pass


@router.callback_query(F.data.startswith("reminder_cancel:"))
async def reminder_cancel(cb: CallbackQuery):
    """Гость отменил визит из напоминания."""
    booking_id = int(cb.data.split(":")[1])

    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        booking = await svc.update_status(booking_id, "cancelled")

        if booking:
            await replace_message_content(cb.message, texts.REMINDER_CANCELLED)

            for admin_id in config.ADMIN_IDS:
                try:
                    await cb.bot.send_message(
                        admin_id,
                        texts.REMINDER_ADMIN_CANCEL.format(
                            name=booking.customer_name,
                            phone=booking.phone,
                            date=booking.start_at.strftime("%d.%m.%Y"),
                            time=booking.start_at.strftime("%H:%M"),
                        ),
                    )
                except:
                    pass

    await cb.answer()
