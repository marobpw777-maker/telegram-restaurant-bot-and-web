# src/handlers/profile.py
import logging
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from sqlalchemy import select

from src.core.database import AsyncSessionLocal
from src.models.user import User
from src.bot_instance import bot
from src import texts

router = Router()
logger = logging.getLogger(__name__)

def get_loyalty_status(visits: int, spent: float) -> str:
    if visits > 5 or spent > 50000:
        return "💎 VIP Гость"
    elif visits > 2 or spent > 15000:
        return "🥇 Постоянный Гость"
    elif visits > 0 or spent > 0:
        return "🥈 Гость"
    return "🆕 Новый Гость"

def get_profile_text(user: User) -> str:
    status = get_loyalty_status(user.visits_count, user.total_spent)
    
    # Расчет до следующего уровня (упрощенно)
    next_level_hint = ""
    if user.visits_count <= 2:
        next_level_hint = f"\nДо статуса Постоянный гость: {3 - user.visits_count} визитов"
    elif user.visits_count <= 5:
        next_level_hint = f"\nДо статуса VIP: {6 - user.visits_count} визитов"

    return (
        f"🌟 <b>ЛИЧНЫЙ КАБИНЕТ ГОСТЯ</b>\n"
        f"─────────────────────\n"
        f"👤 <b>Имя:</b> {user.name or 'Не указано'}\n"
        f"🎖 <b>Статус:</b> {status}\n"
        f"─────────────────────\n"
        f"📊 <b>ВАША АКТИВНОСТЬ:</b>\n"
        f"▫️ Выполнено визитов: <b>{user.visits_count}</b>\n"
        f"▫️ Сумма покупок: <b>{user.total_spent:,.0f} ₽</b>\n"
        f"▫️ Пропусков: {user.no_show_count}\n"
        f"{next_level_hint}\n"
        f"─────────────────────\n"
        f"<i>Благодарим вас за то, что выбираете нас! Накапливайте визиты, чтобы получать персональные привилегии.</i>"
    )

@router.message(Command("profile"))
@router.callback_query(F.data == "show_profile")
async def show_profile(event):
    user_id = event.from_user.id
    
    async with AsyncSessionLocal() as session:
        user = await session.execute(select(User).where(User.telegram_id == user_id))
        user = user.scalar_one_or_none()
        
        if not user or not user.agreed_to_policy:
            msg_text = "Чтобы посмотреть профиль, пожалуйста, сначала примите Политику через /start."
            if isinstance(event, Message):
                await event.answer(msg_text)
            else:
                await event.answer(msg_text, show_alert=True)
            return
            
        text = get_profile_text(user)
        
        if isinstance(event, Message):
            await event.answer(text, parse_mode="HTML")
        else:
            await event.message.answer(text, parse_mode="HTML")
            await event.answer()
