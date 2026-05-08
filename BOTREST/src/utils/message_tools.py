# src/utils/message_tools.py
"""Безопасные операции с сообщениями Telegram."""
from __future__ import annotations

from typing import Any

from aiogram.exceptions import TelegramBadRequest
from aiogram.types import Message


async def replace_message_content(
    message: Message,
    text: str,
    reply_markup: Any = None,
    parse_mode: str | None = None,
):
    """
    Заменяет содержимое сообщения безопасно:
    - edit_text для обычного текста;
    - edit_caption для фото/медиа с подписью;
    - answer, если редактировать нечего.
    """
    try:
        if message.text is not None:
            return await message.edit_text(text, reply_markup=reply_markup, parse_mode=parse_mode)
        if message.caption is not None:
            return await message.edit_caption(caption=text, reply_markup=reply_markup, parse_mode=parse_mode)
    except TelegramBadRequest as exc:
        msg = str(exc).lower()
        if "there is no text in the message to edit" not in msg and \
           "there is no caption in the message to edit" not in msg and \
           "message is not modified" not in msg:
            raise

    return await message.answer(text, reply_markup=reply_markup, parse_mode=parse_mode)
