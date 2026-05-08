# src/handlers/start.py
import logging
from pathlib import Path
from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, CallbackQuery, FSInputFile
from sqlalchemy import select

from src.core.database import AsyncSessionLocal
from src.models.user import User
from src.keyboards.menu_kb import main_menu_kb, policy_agreement_kb
from src import texts, config

router = Router()
logger = logging.getLogger(__name__)

START_PHOTO_PATH = Path(config.BASE_DIR) / "photo" / "start.jpg"

@router.message(CommandStart())
async def start_handler(message: Message):
    """Приветственное сообщение и проверка согласия на обработку ПД."""
    try:
        async with AsyncSessionLocal() as session:
            # Получаем или создаем пользователя
            result = await session.execute(select(User).where(User.telegram_id == message.from_user.id))
            user = result.scalar_one_or_none()
            
            if not user:
                user = User(
                    telegram_id=message.from_user.id,
                    name=message.from_user.full_name,
                    agreed_to_policy=False
                )
                session.add(user)
                await session.commit()
            
            # Проверка согласия 152-ФЗ
            if not user.agreed_to_policy:
                # Отправляем текст политики с кнопкой согласия
                await message.answer(f"{texts.POLICY_AGREEMENT_REQ}\n\n{texts.POLICY_TEXT}", 
                                     reply_markup=policy_agreement_kb(), 
                                     parse_mode="HTML")
                return

            # Если согласие уже есть, показываем главное меню
            await _show_main_menu(message)

    except Exception as e:
        logger.error(f"Ошибка в start_handler: {e}")
        await _show_main_menu(message)

@router.callback_query(F.data == "accept_policy")
async def accept_policy_handler(call: CallbackQuery):
    """Обработчик нажатия на кнопку принятия политики ПД."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.telegram_id == call.from_user.id))
            user = result.scalar_one_or_none()
            if user:
                user.agreed_to_policy = True
                await session.commit()
        
        await call.message.delete()
        await _show_main_menu(call.message)
    except Exception as e:
        logger.error(f"Ошибка в accept_policy_handler: {e}")
        await call.answer("Произошла ошибка, попробуйте позже.", show_alert=True)
        
async def _show_main_menu(message_or_call_message: Message):
    try:
        if START_PHOTO_PATH.exists():
            await message_or_call_message.answer_photo(
                photo=FSInputFile(START_PHOTO_PATH),
                caption=texts.WELCOME,
                reply_markup=main_menu_kb(),
                parse_mode="HTML",
            )
        else:
            await message_or_call_message.answer(
                texts.WELCOME,
                reply_markup=main_menu_kb(),
                parse_mode="HTML",
            )
    except Exception as e:
        logger.error(f"Ошибка отправки главного меню: {e}")
        await message_or_call_message.answer(texts.WELCOME, reply_markup=main_menu_kb(), parse_mode="HTML")
