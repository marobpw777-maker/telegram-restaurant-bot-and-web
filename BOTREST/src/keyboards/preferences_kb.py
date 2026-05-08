# src/keyboards/preferences_kb.py
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardMarkup
from src import texts

def save_preferences_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Сохранить пожелания", callback_data="pref_save")
    builder.button(text="➡️ Просто продолжить", callback_data="pref_skip")
    builder.adjust(1)
    return builder.as_markup()
