# src/keyboards/booking_kb.py
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.types import InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardButton
from src import texts
from datetime import date

def make_dates_kb(days: list) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for d in days:
        builder.button(text=d.strftime("%d.%m (%a)"), callback_data=f"date:{d.isoformat()}")
    builder.adjust(2)
    builder.row(InlineKeyboardButton(text=texts.BTN_BACK, callback_data="cancel_booking"))
    return builder.as_markup()

def make_times_kb(slots: list) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for s in slots:
        builder.button(text=s, callback_data=f"time:{s}")
    builder.adjust(4)
    builder.row(InlineKeyboardButton(text=texts.BTN_BACK, callback_data="back_step_to_date"))
    return builder.as_markup()

def make_duration_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=texts.BOOK_DURATION_FULL, callback_data="duration:180")
    builder.button(text=texts.BOOK_DURATION_ALACARTE, callback_data="duration:60")
    builder.button(text=texts.BOOK_DURATION_UNDECIDED, callback_data="duration:120")
    builder.adjust(1)
    builder.row(InlineKeyboardButton(text=texts.BTN_BACK, callback_data="back_step_to_time"))
    return builder.as_markup()

def make_guests_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for i in range(1, 9):
        builder.button(text=str(i), callback_data=f"guests:{i}")
    builder.adjust(4)
    builder.row(InlineKeyboardButton(text=texts.BTN_BACK, callback_data="back_step_to_duration"))
    return builder.as_markup()

def make_wishes_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=texts.BTN_SKIP, callback_data="wishes_skip")
    builder.row(InlineKeyboardButton(text=texts.BTN_BACK, callback_data="back_step_to_guests"))
    return builder.as_markup()

def make_confirm_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    # Mock Deposit Simulation for SaaS
    builder.button(text="💳 Оплатить депозит (500₽)", callback_data="mock_deposit_pay")
    builder.button(text=texts.BTN_CANCEL, callback_data="cancel_booking")
    builder.row(InlineKeyboardButton(text=texts.BTN_BACK, callback_data="back_step_to_wishes"))
    builder.adjust(1)
    return builder.as_markup()

def phone_request_keyboard() -> ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.button(text="📱 Отправить номер", request_contact=True)
    return builder.as_markup(resize_keyboard=True, one_time_keyboard=True)

def reminder_keyboard(booking_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=texts.REMINDER_CONFIRM, callback_data=f"reminder_confirm:{booking_id}")
    builder.button(text=texts.REMINDER_CANCEL, callback_data=f"reminder_cancel:{booking_id}")
    builder.adjust(1)
    return builder.as_markup()
