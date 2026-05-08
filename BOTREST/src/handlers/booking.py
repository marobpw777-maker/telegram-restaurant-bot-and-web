# src/handlers/booking.py
import logging
import re
from datetime import datetime, date, time
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, ReplyKeyboardRemove
from aiogram.fsm.state import StatesGroup, State
from aiogram.fsm.context import FSMContext

from src.keyboards.booking_kb import (
    make_dates_kb, make_times_kb, make_duration_kb, make_guests_kb,
    make_confirm_kb, make_wishes_kb, phone_request_keyboard,
)
from src.keyboards.preferences_kb import save_preferences_keyboard
from src.utils.datetime_utils import get_next_n_days, generate_time_slots
from src.core.database import AsyncSessionLocal
from src.services.booking_service import BookingService
from src.services.scheduler import schedule_reminders
from src.bot_instance import bot
from src import config, texts
from src.utils.message_tools import replace_message_content

logger = logging.getLogger(__name__)
router = Router()


class BookingStates(StatesGroup):
    choosing_date = State()
    choosing_time = State()
    choosing_duration = State()
    entering_guests = State()
    entering_name = State()
    entering_phone = State()
    entering_wishes = State()
    saving_preferences = State()
    confirming = State()


@router.message(Command("book"))
@router.callback_query(F.data == "start_booking")
async def start_booking(event, state: FSMContext):
    # Проверка на блокировку (ban)
    user_id = event.from_user.id
    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        user = await svc.get_user_by_telegram_id(user_id)
        
        if not user or not user.agreed_to_policy:
            msg_text = "Пожалуйста, введите /start и примите Политику конфиденциальности (152-ФЗ), чтобы продолжить."
            if isinstance(event, Message):
                await event.answer(msg_text)
            else:
                await event.answer(msg_text, show_alert=True)
            return
            
        if user.is_banned:
            msg_text = "⛔ К сожалению, мы временно не можем принимать от вас онлайн-бронирования (замечены частые неявки). Пожалуйста, позвоните менеджеру ресторана."
            if isinstance(event, Message):
                await event.answer(msg_text)
            else:
                await event.answer(msg_text, show_alert=True)
            return

    days = get_next_n_days(14)
    kb = make_dates_kb(days)
    await state.clear()

    msg_text = texts.BOOK_DATE + "\n(Вы в любой момент можете прервать бронирование командой /cancel)"
    if isinstance(event, Message):
        await event.answer(msg_text, reply_markup=kb)
    else:
        await replace_message_content(event.message, msg_text, reply_markup=kb)
        await event.answer()

    await state.set_state(BookingStates.choosing_date)

@router.message(Command("cancel"))
async def cancel_command(message: Message, state: FSMContext):
    current_state = await state.get_state()
    if current_state is None:
        return
    await state.clear()
    await message.answer(texts.BOOK_CANCELLED, reply_markup=ReplyKeyboardRemove())


@router.callback_query(lambda c: c.data and c.data.startswith("date:"))
async def date_chosen(cb: CallbackQuery, state: FSMContext):
    _, iso = cb.data.split(":", 1)
    sel_date = date.fromisoformat(iso)
    await state.update_data(date=iso)

    slots = generate_time_slots(sel_date, config.WORK_HOURS_START, config.WORK_HOURS_END, config.BOOKING_INTERVAL)
    if not slots:
        await cb.answer("На эту дату нет доступного времени", show_alert=True)
        return

    kb = make_times_kb(slots)
    await replace_message_content(
        cb.message,
        f"{texts.BOOK_TIME}\n\nДата: {sel_date.strftime('%d.%m.%Y')}",
        reply_markup=kb,
    )
    await state.set_state(BookingStates.choosing_time)
    await cb.answer()


@router.callback_query(lambda c: c.data and c.data.startswith("time:"))
async def time_chosen(cb: CallbackQuery, state: FSMContext):
    _, timestr = cb.data.split(":", 1)
    await state.update_data(time=timestr)
    kb = make_duration_kb()
    await replace_message_content(cb.message, texts.BOOK_DURATION, reply_markup=kb)
    await state.set_state(BookingStates.choosing_duration)
    await cb.answer()


@router.callback_query(lambda c: c.data and c.data.startswith("duration:"))
async def duration_chosen(cb: CallbackQuery, state: FSMContext):
    duration = int(cb.data.split(":", 1)[1])
    await state.update_data(duration=duration)
    kb = make_guests_kb()
    await replace_message_content(cb.message, texts.BOOK_GUESTS, reply_markup=kb)
    await state.set_state(BookingStates.entering_guests)
    await cb.answer()


@router.callback_query(lambda c: c.data and c.data.startswith("guests:"))
async def guests_chosen(cb: CallbackQuery, state: FSMContext):
    guests = int(cb.data.split(":", 1)[1])
    await state.update_data(guests=guests)
    
    # Можно перейти назад из ввода имени, для этого используем стейт
    await replace_message_content(cb.message, texts.BOOK_NAME)
    await state.set_state(BookingStates.entering_name)
    await cb.answer()

# --- Навигация Назад ---
@router.callback_query(lambda c: c.data and c.data.startswith("back_step_to_"))
async def go_back(cb: CallbackQuery, state: FSMContext):
    step = cb.data.replace("back_step_to_", "")
    
    if step == "date":
        await start_booking(cb, state)
    elif step == "time":
        # Имитируем выбор даты
        data = await state.get_data()
        cb.data = f"date:{data.get('date')}"
        await date_chosen(cb, state)
    elif step == "duration":
        # Имитируем выбор времени
        data = await state.get_data()
        cb.data = f"time:{data.get('time')}"
        await time_chosen(cb, state)
    elif step == "guests":
        # Имитируем выбор длительности
        data = await state.get_data()
        cb.data = f"duration:{data.get('duration')}"
        await duration_chosen(cb, state)
    elif step == "wishes":
        kb = make_wishes_kb()
        await replace_message_content(cb.message, texts.BOOK_WISHES, reply_markup=kb)
        await state.set_state(BookingStates.entering_wishes)
        await cb.answer()
# -----------------------


@router.message(BookingStates.entering_name)
async def enter_name(message: Message, state: FSMContext):
    await state.update_data(name=message.text.strip())
    await message.answer(texts.BOOK_PHONE, reply_markup=phone_request_keyboard())
    await state.set_state(BookingStates.entering_phone)


@router.message(F.contact, BookingStates.entering_phone)
@router.message(BookingStates.entering_phone, F.text)
async def handle_phone(message: Message, state: FSMContext):
    phone = ""
    if message.contact:
        phone = message.contact.phone_number
    else:
        phone = message.text.strip()
        phone = re.sub(r"[\s\-\(\)]", "", phone)
        if not re.match(r"^(\+7|8|7)?[0-9]{10}$", phone):
            await message.answer("Введите корректный номер (напр. +7 999 123-45-67)")
            return

    await state.update_data(phone=phone)
    await message.answer(f"Номер {phone} получен.", reply_markup=ReplyKeyboardRemove())

    kb = make_wishes_kb()
    await message.answer(texts.BOOK_WISHES, reply_markup=kb)
    await state.set_state(BookingStates.entering_wishes)


@router.message(BookingStates.entering_wishes)
@router.callback_query(F.data == "wishes_skip")
async def handle_wishes(event, state: FSMContext):
    wishes = ""
    if isinstance(event, Message):
        wishes = event.text.strip()
        if wishes.lower() in ["пропустить", "нет"]:
            wishes = ""
    else:
        await event.answer()

    await state.update_data(wishes=wishes)

    msg_text = "Хотите сохранить эти данные для будущих бронирований?"
    kb = save_preferences_keyboard()

    if isinstance(event, Message):
        await event.answer(msg_text, reply_markup=kb)
    else:
        await event.message.answer(msg_text, reply_markup=kb)

    await state.set_state(BookingStates.saving_preferences)


@router.callback_query(BookingStates.saving_preferences, F.data.in_(["pref_save", "pref_skip"]))
async def handle_preferences(cb: CallbackQuery, state: FSMContext):
    ans_done = False
    if cb.data == "pref_save":
        data = await state.get_data()
        wishes = data.get("wishes", "")
        if wishes:
            async with AsyncSessionLocal() as session:
                svc = BookingService(session)
                await svc.update_user_preferences(cb.from_user.id, {"general": wishes})
            await cb.answer("✅ Предпочтения сохранены")
            ans_done = True

    if not ans_done:
        await cb.answer()
    await show_confirmation(cb.message, state)


async def show_confirmation(message: Message, state: FSMContext):
    data = await state.get_data()
    details = (
        f"📅 Дата: {data['date']}\n"
        f"⏰ Время: {data['time']}\n"
        f"⏳ Длительность: {data.get('duration', 90)} мин\n"
        f"👥 Гостей: {data['guests']}\n"
        f"👤 Имя: {data['name']}\n"
        f"📞 Телефон: {data['phone']}\n"
        f"💬 Пожелания: {data.get('wishes') or 'нет'}"
    )
    text = texts.BOOK_CONFIRM.format(details=details)
    await message.answer(text, reply_markup=make_confirm_kb(), parse_mode="HTML")
    await state.set_state(BookingStates.confirming)


@router.callback_query(F.data == "mock_deposit_pay")
async def process_mock_deposit(cb: CallbackQuery, state: FSMContext):
    # Симуляция окна оплаты
    await replace_message_content(cb.message, "🔄 Ожидание оплаты 500₽ (Симуляция для SaaS-демо)...\nПожалуйста, подождите.", reply_markup=None)
    
    import asyncio
    await asyncio.sleep(2)
    
    # После "успешной оплаты" продолжаем подтверждение
    data = await state.get_data()

    # Формируем datetime
    sel_date = date.fromisoformat(data["date"])
    sel_time = datetime.strptime(data["time"], "%H:%M").time()
    start_at = datetime.combine(sel_date, sel_time)
    duration = data.get("duration", 90)

    # Сохранение в БД
    async with AsyncSessionLocal() as session:
        svc = BookingService(session)
        await svc.create_or_update_user(cb.from_user.id, data["name"], data["phone"])
        booking = await svc.create_booking(
            telegram_id=cb.from_user.id,
            start_at=start_at,
            duration_minutes=duration,
            guests_count=data["guests"],
            customer_name=data["name"],
            phone=data["phone"],
            notes=data.get("wishes", ""),
            source="telegram",
        )

    # Планируем напоминания
    await schedule_reminders(booking.id, start_at)

    # Уведомляем админов
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    admin_kb = InlineKeyboardBuilder()
    admin_kb.button(text="✅ Подтвердить", callback_data=f"admin_confirm:{booking.id}")
    admin_kb.button(text="❌ Отклонить", callback_data=f"admin_reject:{booking.id}")
    admin_kb.adjust(2)

    admin_text = (
        f"🆕 <b>Новая бронь #{booking.id}</b>\n"
        f"👤 {data['name']}\n📞 {data['phone']}\n"
        f"📅 {data['date']} в {data['time']}\n"
        f"⏳ {duration} мин\n👥 Гостей: {data['guests']}\n"
        f"💬 {data.get('wishes') or '—'}\n"
        f"📱 Источник: Telegram"
    )
    for admin_id in config.ADMIN_IDS:
        try:
            await bot.send_message(admin_id, admin_text, parse_mode="HTML", reply_markup=admin_kb.as_markup())
        except Exception as e:
            logger.error(f"Не удалось отправить админу {admin_id}: {e}")

    await replace_message_content(cb.message, texts.BOOK_SENT.format(name=data["name"], phone=config.RESTAURANT_PHONE))
    await state.clear()
    await cb.answer()


@router.callback_query(F.data == "cancel_booking")
async def cancel_booking(cb: CallbackQuery, state: FSMContext):
    await state.clear()
    await replace_message_content(cb.message, texts.BOOK_CANCELLED)
    await cb.answer()
