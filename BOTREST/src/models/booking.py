# src/models/booking.py
from datetime import datetime
from enum import Enum
from sqlalchemy import BigInteger, DateTime, String, Integer, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"


class BookingSource(str, Enum):
    telegram = "telegram"
    website = "website"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    # telegram_id гостя — для отправки сообщений. Может быть NULL (бронь через сайт)
    telegram_id: Mapped[int] = mapped_column(BigInteger, nullable=True, index=True)
    # Данные визита
    start_at: Mapped[datetime] = mapped_column(DateTime)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=90)
    guests_count: Mapped[int] = mapped_column(Integer)
    # Контакты гостя
    customer_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(30))
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    # Статус
    status: Mapped[str] = mapped_column(String(20), default=BookingStatus.pending.value)
    attended: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(20), default=BookingSource.telegram.value)
    admin_comment: Mapped[str] = mapped_column(Text, nullable=True)
    # Флаги напоминаний
    reminder_24h_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_3h_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    survey_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    # Метки времени
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)
