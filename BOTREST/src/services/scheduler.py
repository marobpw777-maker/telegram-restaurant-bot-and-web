# src/services/scheduler.py
"""Планировщик задач: напоминания и опросы."""
import logging
from datetime import datetime, timedelta
from src.bot_instance import bot, scheduler
from src.core.database import AsyncSessionLocal
from src.services.booking_service import BookingService
from src import texts, config

logger = logging.getLogger(__name__)


async def send_reminder(booking_id: int, hours_before: int):
    """Отправляет напоминание гостю в Telegram."""
    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        booking = await svc.get_booking(booking_id)

        if not booking or booking.status != "confirmed":
            return
        if not booking.telegram_id:
            logger.info(f"Booking #{booking_id}: нет telegram_id, пропускаем напоминание")
            return

        text = texts.REMINDER_24H if hours_before == config.REMINDER_HOURS_1 else texts.REMINDER_1H
        from src.keyboards.booking_kb import reminder_keyboard

        try:
            await bot.send_message(
                booking.telegram_id,
                text.format(name=booking.customer_name, time=booking.start_at.strftime("%H:%M")),
                reply_markup=reminder_keyboard(booking_id),
                parse_mode="HTML"
            )
            await svc.mark_reminder_sent(booking_id, hours_before)
            logger.info(f"✅ Напоминание {hours_before}ч отправлено для брони #{booking_id}")
        except Exception:
            logger.exception(f"❌ Не удалось отправить напоминание для {booking.telegram_id}")


async def schedule_reminders(booking_id: int, booking_dt: datetime):
    """Планирует напоминания за 24ч и 1ч до визита."""
    # Первое напоминание (24ч)
    rem1_time = booking_dt - timedelta(hours=config.REMINDER_HOURS_1)
    if rem1_time > datetime.now():
        scheduler.add_job(
            send_reminder, "date", run_date=rem1_time,
            args=[booking_id, config.REMINDER_HOURS_1], id=f"rem_h1_{booking_id}", replace_existing=True,
        )

    # Второе напоминание (1ч)
    rem2_time = booking_dt - timedelta(hours=config.REMINDER_HOURS_2)
    if rem2_time > datetime.now():
        scheduler.add_job(
            send_reminder, "date", run_date=rem2_time,
            args=[booking_id, config.REMINDER_HOURS_2], id=f"rem_h2_{booking_id}", replace_existing=True,
        )
