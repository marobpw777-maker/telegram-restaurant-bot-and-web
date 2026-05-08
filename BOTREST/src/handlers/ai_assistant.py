# src/handlers/ai_assistant.py
"""ИИ-ассистент: обрабатывает текстовые вопросы гостей, содержит Сомелье и Консьержа."""
import logging
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from sqlalchemy import select
from src.core.database import AsyncSessionLocal
from src.models.menu import MenuItem
from src.models.user import User
from src.services.ai_service import get_sommelier_response, get_concierge_response, detect_intent, wants_sommelier, wants_concierge
from src import texts

router = Router()
logger = logging.getLogger(__name__)

class AIStates(StatesGroup):
    chatting_sommelier = State()
    chatting_concierge = State()
    waiting_for_dish_question = State()

def get_ai_exit_kb() -> ReplyKeyboardMarkup:
    """Клавиатура для выхода из режима AI-чата"""
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="🚪 Завершить диалог")]],
        resize_keyboard=True,
        is_persistent=True
    )

# ═══════════════════════════════════════════════════════════
# УПРАВЛЕНИЕ ДИАЛОГОМ (Выход и Переключение)
# ═══════════════════════════════════════════════════════════

@router.message(F.text == "🚪 Завершить диалог")
@router.message(Command("cancel", "stop"))
async def exit_ai_chat(message: Message, state: FSMContext):
    """Выход из AI-состояний"""
    current_state = await state.get_state()
    if current_state in (AIStates.chatting_sommelier.state, AIStates.chatting_concierge.state, AIStates.waiting_for_dish_question.state):
        await state.clear()
        await message.answer(
            "Диалог завершён. Если я понадоблюсь — используйте кнопки в меню или просто напишите мне!",
            reply_markup=ReplyKeyboardRemove()
        )
    else:
        # Не в состоянии чата
        pass

@router.callback_query(F.data == "call_sommelier")
async def cb_start_sommelier(cb: CallbackQuery, state: FSMContext):
    await state.set_state(AIStates.chatting_sommelier)
    await state.update_data(chat_history=[])
    await cb.message.answer(texts.AI_SOMMELIER_WELCOME, reply_markup=get_ai_exit_kb())
    await cb.answer()

@router.callback_query(F.data == "call_concierge")
async def cb_start_concierge(cb: CallbackQuery, state: FSMContext):
    await state.set_state(AIStates.chatting_concierge)
    await state.update_data(chat_history=[])
    await cb.message.answer(texts.AI_CONCIERGE_WELCOME, reply_markup=get_ai_exit_kb())
    await cb.answer()

@router.message(Command("sommelier"))
async def cmd_start_sommelier(message: Message, state: FSMContext):
    await state.set_state(AIStates.chatting_sommelier)
    await state.update_data(chat_history=[])
    await message.answer(texts.AI_SOMMELIER_WELCOME, reply_markup=get_ai_exit_kb())

@router.message(Command("concierge"))
async def cmd_start_concierge(message: Message, state: FSMContext):
    await state.set_state(AIStates.chatting_concierge)
    await state.update_data(chat_history=[])
    await message.answer(texts.AI_CONCIERGE_WELCOME, reply_markup=get_ai_exit_kb())

# ═══════════════════════════════════════════════════════════
# ВОПРОСЫ О БЛЮДЕ (Унаследовано из старого функционала)
# ═══════════════════════════════════════════════════════════

@router.callback_query(F.data.startswith("ask:dish:"))
async def ask_about_dish_start(cb: CallbackQuery, state: FSMContext):
    dish_id = int(cb.data.split(":")[2])
    async with AsyncSessionLocal() as session:
        dish = await session.get(MenuItem, dish_id)
        if not dish:
            await cb.answer("Блюдо не найдено", show_alert=True)
            return
            
        dish_context = f"Блюдо: {dish.name}. Описание: {dish.description}. Состав: {dish.composition}. Аллергены: {dish.allergens}. Цена: {dish.price} руб."
        
        # Инъекцируем вопрос о блюде в историю консьержа и запускаем его
        history = [{"role": "system", "content": f"Гость спрашивает про блюдо. Контекст: {dish_context}"}]
        await state.update_data(chat_history=history, current_dish=dish.name)
        await state.set_state(AIStates.chatting_concierge)
        
    await cb.message.answer(
        texts.AI_DISH_QUESTION.format(name=dish.name),
        reply_markup=get_ai_exit_kb(),
        parse_mode="Markdown"
    )
    await cb.answer()

# ═══════════════════════════════════════════════════════════
# ОБРАБОТКА В АКТИВНЫХ СОСТОЯНИЯХ ДИАЛОГА
# ═══════════════════════════════════════════════════════════

async def _verify_user_access(user_id: int) -> bool:
    """Проверка согласия на БД и бана"""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.telegram_id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.agreed_to_policy:
            return False, "Для общения с ассистентом введите команду /start и примите Политику конфиденциальности (152-ФЗ)."
        if user.is_banned:
            return False, "⛔ К сожалению, ваш доступ к системе приостановлен. Пожалуйста, позвоните администратору."
        return True, ""

@router.message(AIStates.chatting_sommelier, F.text)
async def handle_sommelier_chat(message: Message, state: FSMContext):
    ok, error_msg = await _verify_user_access(message.from_user.id)
    if not ok:
        await message.answer(error_msg)
        return

    text = message.text
    # Проверка на переключение к консьержу
    if wants_concierge(text):
        await message.answer("Переключаю вас на цифрового консьержа Александра... 🤵")
        await state.set_state(AIStates.chatting_concierge)
        # Очищаем историю, так как контекст другой персоны
        await state.update_data(chat_history=[])
        await message.answer(texts.AI_CONCIERGE_WELCOME)
        return

    # Загрузка истории и вызов API
    data = await state.get_data()
    history = data.get("chat_history", [])
    
    response = await get_sommelier_response(text, history)
    
    # Сохранение новой истории
    history.append({"role": "user", "content": text})
    history.append({"role": "assistant", "content": response})
    await state.update_data(chat_history=history[-10:])  # храним только 10 сообщений
    
    await message.answer(response)

@router.message(AIStates.chatting_concierge, F.text)
async def handle_concierge_chat(message: Message, state: FSMContext):
    ok, error_msg = await _verify_user_access(message.from_user.id)
    if not ok:
        await message.answer(error_msg)
        return

    text = message.text
    # Проверка на переключение к сомелье
    if wants_sommelier(text):
        await message.answer("Переключаю вас на нашего шеф-сомелье Марко... 🍷")
        await state.set_state(AIStates.chatting_sommelier)
        # Очищаем историю
        await state.update_data(chat_history=[])
        await message.answer(texts.AI_SOMMELIER_WELCOME)
        return

    # Загрузка истории и вызов API
    data = await state.get_data()
    history = data.get("chat_history", [])
    
    response = await get_concierge_response(text, history)
    
    # Сохранение новой истории
    history.append({"role": "user", "content": text})
    history.append({"role": "assistant", "content": response})
    await state.update_data(chat_history=history[-10:])
    
    await message.answer(response)

# ═══════════════════════════════════════════════════════════
# CATCH-ALL ТЕКСТА (Отлов свободных фраз)
# ═══════════════════════════════════════════════════════════

@router.message(F.text)
async def catch_all_text(message: Message, state: FSMContext):
    """
    Отлавливает любой текст, если юзер НЕ в состоянии FSM и это НЕ команда.
    Должен регистрироваться последним в корневом роутере.
    В зависимости от контекста, переключает в нужный State и делает запрос.
    """
    current_state = await state.get_state()
    if current_state is not None:
        return

    if message.text.startswith("/"):
        return

    ok, error_msg = await _verify_user_access(message.from_user.id)
    if not ok:
        await message.answer(error_msg)
        return

    text = message.text
    intent = detect_intent(text)

    if intent == "sommelier" or wants_sommelier(text):
        await state.set_state(AIStates.chatting_sommelier)
        response = await get_sommelier_response(text, [])
        await state.update_data(chat_history=[
            {"role": "user", "content": text},
            {"role": "assistant", "content": response}
        ])
    else:
        # По умолчанию - консьерж
        await state.set_state(AIStates.chatting_concierge)
        response = await get_concierge_response(text, [])
        await state.update_data(chat_history=[
            {"role": "user", "content": text},
            {"role": "assistant", "content": response}
        ])

    await message.answer(response, reply_markup=get_ai_exit_kb())

# Голосовые
@router.message(F.voice)
async def handle_voice_message(message: Message, state: FSMContext):
    current_state = await state.get_state()
    if current_state not in (None, AIStates.chatting_sommelier.state, AIStates.chatting_concierge.state, AIStates.waiting_for_dish_question.state):
        return
    await message.answer(
        "🎙 <b>Сообщение получено</b>\n\n"
        "Голосовое ядро сейчас настраивается (Требуется STT-модуль). "
        "Пожалуйста, задайте ваш вопрос текстом!",
        parse_mode="HTML"
    )
