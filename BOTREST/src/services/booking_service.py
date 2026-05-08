# src/services/booking_service.py
import json
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from src.models.booking import Booking, BookingStatus
from src.models.user import User
from src import config


class BookingService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ── Бронирования ────────────────────────────────────────

    async def create_booking(
        self,
        telegram_id: Optional[int],
        start_at: datetime,
        duration_minutes: int,
        guests_count: int,
        customer_name: str,
        phone: str,
        notes: str = "",
        source: str = "telegram",
    ) -> Booking:
        booking = Booking(
            telegram_id=telegram_id,
            start_at=start_at,
            duration_minutes=duration_minutes,
            guests_count=guests_count,
            customer_name=customer_name,
            phone=phone,
            notes=notes,
            status=BookingStatus.pending.value,
            source=source,
        )
        self.session.add(booking)
        await self.session.commit()
        await self.session.refresh(booking)
        return booking

    async def get_booking(self, booking_id: int) -> Optional[Booking]:
        return await self.session.get(Booking, booking_id)

    async def update_status(
        self, booking_id: int, status: str, admin_comment: str = None, spent_amount: float = 0.0
    ) -> Optional[Booking]:
        booking = await self.get_booking(booking_id)
        if not booking:
            return None
            
        booking.status = status
        if admin_comment:
            booking.admin_comment = admin_comment
            
        # Учет LTV и CRM 
        if booking.telegram_id:
            user = await self.get_user_by_telegram_id(booking.telegram_id)
            if user:
                if status == BookingStatus.no_show.value:
                    user.no_show_count += 1
                    if user.no_show_count >= 2:
                        user.is_banned = True
                elif status == BookingStatus.completed.value:
                    user.visits_count += 1
                    if spent_amount > 0:
                        user.total_spent += spent_amount
                    
        booking.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(booking)
        return booking

    async def list_bookings(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Booking]:
        stmt = select(Booking).order_by(Booking.start_at.desc())

        if start_date:
            stmt = stmt.where(Booking.start_at >= datetime.fromisoformat(start_date))
        if end_date:
            stmt = stmt.where(Booking.start_at <= datetime.fromisoformat(end_date))
        if status and status != "all":
            stmt = stmt.where(Booking.status == status)

        stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_bookings_by_date(self, date_str: str) -> List[Booking]:
        """Получить все бронирования на конкретную дату (для проверки доступности)."""
        day_start = datetime.fromisoformat(f"{date_str}T00:00:00")
        day_end = datetime.fromisoformat(f"{date_str}T23:59:59")
        stmt = select(Booking).where(
            and_(
                Booking.start_at >= day_start,
                Booking.start_at <= day_end,
                Booking.status.in_([BookingStatus.pending.value, BookingStatus.confirmed.value]),
            )
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_upcoming_confirmed(self, from_dt: datetime, to_dt: datetime) -> List[Booking]:
        stmt = select(Booking).where(
            and_(
                Booking.status == BookingStatus.confirmed.value,
                Booking.start_at >= from_dt,
                Booking.start_at <= to_dt,
            )
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_bookings_for_reminder(self, hours_before: int) -> List[Booking]:
        now = datetime.now()
        target_from = now + timedelta(hours=hours_before - 0.5)
        target_to = now + timedelta(hours=hours_before + 0.5)
        bookings = await self.get_upcoming_confirmed(target_from, target_to)
        if hours_before == 24:
            return [b for b in bookings if not b.reminder_24h_sent]
        elif hours_before == config.REMINDER_HOURS_2:
            # Историческое имя поля сохранено без миграции.
            return [b for b in bookings if not b.reminder_3h_sent]
        return []

    async def mark_reminder_sent(self, booking_id: int, hours_before: int):
        booking = await self.get_booking(booking_id)
        if booking:
            if hours_before == 24:
                booking.reminder_24h_sent = True
            elif hours_before == config.REMINDER_HOURS_2:
                # Историческое имя поля сохранено без миграции.
                booking.reminder_3h_sent = True
            await self.session.commit()

    # ── Пользователи ────────────────────────────────────────

    async def get_user_by_telegram_id(self, telegram_id: int) -> Optional[User]:
        stmt = select(User).where(User.telegram_id == telegram_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_or_update_user(
        self, telegram_id: int, full_name: str, phone: str = None
    ) -> User:
        user = await self.get_user_by_telegram_id(telegram_id)
        if user:
            if full_name:
                user.name = full_name
            if phone:
                user.phone = phone
        else:
            user = User(telegram_id=telegram_id, name=full_name, phone=phone)
            self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_user_preferences(self, telegram_id: int, preferences: dict) -> Optional[User]:
        user = await self.get_user_by_telegram_id(telegram_id)
        if user:
            user.preferences = preferences
            await self.session.commit()
            await self.session.refresh(user)
        return user

    async def get_user_preferences(self, telegram_id: int) -> dict:
        user = await self.get_user_by_telegram_id(telegram_id)
        if user and user.preferences:
            return user.preferences
        return {}

    # ✅ НОВОЕ: Администраторские функции
    async def unban_user(self, telegram_id: int) -> Optional[User]:
        """✅ Разбанить пользователя и сбросить счётчик no-shows."""
        user = await self.get_user_by_telegram_id(telegram_id)
        if user:
            user.is_banned = False
            user.no_show_count = 0  # Сбрасываем счётчик штрафов
            await self.session.commit()
            await self.session.refresh(user)
        return user
