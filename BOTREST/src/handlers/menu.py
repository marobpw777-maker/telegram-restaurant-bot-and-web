# src/handlers/menu.py
"""Обработчики навигации по меню из Telegram-бота."""
import json
import logging
from pathlib import Path
from aiogram import Router, F
from aiogram.types import CallbackQuery, FSInputFile
from aiogram.exceptions import TelegramBadRequest
from sqlalchemy import select

from src.keyboards.menu_kb import (
    main_menu_kb, categories_kb, items_kb, item_detail_kb, pdf_menu_kb,
)
from src.utils.breadcrumbs import render_breadcrumbs
from src.utils.render_dish import render_dish_text
from src.core.database import AsyncSessionLocal
from src.models.menu import Category, MenuItem
from src import config, texts
from src.utils.message_tools import replace_message_content

router = Router()
logger = logging.getLogger(__name__)

BASE_DIR = Path(config.BASE_DIR)
PHOTO_DIR = BASE_DIR / "photo"


async def _get_categories() -> list[dict]:
    """Загрузить категории из БД."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Category).order_by(Category.sort_order))
        cats = result.scalars().all()
        return [{"id": c.id, "name": c.name} for c in cats]


async def _get_dishes_by_category(cat_id: int) -> list[dict]:
    """Загрузить блюда категории из БД."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(MenuItem).where(MenuItem.category_id == cat_id, MenuItem.is_available == True)
        )
        items = result.scalars().all()
        return [
            {
                "id": i.id, "name": i.name, "price": i.price,
                "description": i.description, "composition": i.composition,
                "weight": i.weight, "allergens": i.allergens,
                "is_signature": i.is_hit, "is_new": i.is_new,
                "category_id": i.category_id,
                "photo": f"dish_{i.id}.jpg",
            }
            for i in items
        ]


async def _get_dish(dish_id: int) -> dict | None:
    """Загрузить конкретное блюдо из БД."""
    async with AsyncSessionLocal() as session:
        item = await session.get(MenuItem, dish_id)
        if not item:
            return None
        return {
            "id": item.id, "name": item.name, "price": item.price,
            "description": item.description, "composition": item.composition,
            "weight": item.weight, "allergens": item.allergens,
            "is_signature": item.is_hit, "is_new": item.is_new,
            "category_id": item.category_id,
            "photo": f"dish_{item.id}.jpg",
        }


@router.callback_query(F.data == "menu_main")
async def menu_main(callback: CallbackQuery):
    categories = await _get_categories()
    text = texts.MENU_CATEGORIES
    kb = categories_kb(categories)
    try:
        await replace_message_content(callback.message, text, reply_markup=kb)
    except Exception as e:
        logger.warning(f"Error editing message: {e}")
        await callback.message.answer(text, reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data.startswith("category:"))
async def show_category(callback: CallbackQuery):
    cat_id = int(callback.data.split(":")[1])
    categories = await _get_categories()
    cat_name = next((c["name"] for c in categories if c["id"] == cat_id), "Меню")
    items = await _get_dishes_by_category(cat_id)

    if not items:
        await callback.answer("В этом разделе пока нет позиций", show_alert=True)
        return

    total_pages = (len(items) + 4) // 5
    kb = items_kb(items, cat_id, 0, total_pages, "dish")
    bread = render_breadcrumbs(["Главная", "Меню", cat_name])
    text = f"{bread}\n\n🍽 <b>{cat_name}</b>"

    await replace_message_content(callback.message, text, reply_markup=kb, parse_mode="HTML")
    await callback.answer()


@router.callback_query(F.data.startswith("dish:"))
async def show_dish(callback: CallbackQuery):
    dish_id = int(callback.data.split(":")[1])
    dish = await _get_dish(dish_id)
    if not dish:
        await callback.answer("Не найдено", show_alert=True)
        return

    categories = await _get_categories()
    cat_name = next((c["name"] for c in categories if c["id"] == dish["category_id"]), "Меню")
    bread = render_breadcrumbs(["Главная", "Меню", cat_name, dish["name"]])
    text = render_dish_text(dish)
    full_text = f"{bread}\n\n{text}"

    kb = item_detail_kb(dish_id, dish["category_id"], "dish", False)
    photo_path = PHOTO_DIR / dish.get("photo", f"dish_{dish_id}.jpg")

    if photo_path.exists():
        await callback.message.answer_photo(
            photo=FSInputFile(photo_path),
            caption=full_text, parse_mode="HTML", reply_markup=kb,
        )
    else:
        await callback.message.answer(full_text, parse_mode="HTML", reply_markup=kb)

    try:
        await callback.message.delete()
    except Exception as e:
        logger.warning(f"Failed to delete message: {e}")
    await callback.answer()

@router.callback_query(F.data.startswith("page:"))
async def category_page(callback: CallbackQuery):
    parts = callback.data.split(":")
    item_type = parts[1]
    cat_id = int(parts[2])
    page = int(parts[3])
    
    items = await _get_dishes_by_category(cat_id)
    total_pages = (len(items) + 4) // 5
    
    kb = items_kb(items, cat_id, page, total_pages, item_type)
    try:
        await callback.message.edit_reply_markup(reply_markup=kb)
    except Exception as e:
        logger.warning(f"Failed to update pagination: {e}")
    await callback.answer()

@router.callback_query(F.data.startswith("back_to_items:"))
async def back_to_items(callback: CallbackQuery):
    parts = callback.data.split(":")
    cat_id = int(parts[1])
    item_type = parts[2]
    
    categories = await _get_categories()
    cat_name = next((c["name"] for c in categories if c["id"] == cat_id), "Меню")
    items = await _get_dishes_by_category(cat_id)
    
    total_pages = (len(items) + 4) // 5
    kb = items_kb(items, cat_id, 0, total_pages, item_type)
    
    bread = render_breadcrumbs(["Главная", "Меню", cat_name])
    text = f"{bread}\n\n🍽 <b>{cat_name}</b>"
    
    # Message might be a photo or text
    try:
        await callback.message.delete()
        await callback.message.answer(text, reply_markup=kb, parse_mode="HTML")
    except Exception as e:
        logger.warning(f"Error in back_to_items: {e}")
    await callback.answer()


@router.callback_query(F.data == "pdf_menu")
async def pdf_menu(callback: CallbackQuery):
    await replace_message_content(callback.message, texts.PDF_CHOOSE, reply_markup=pdf_menu_kb())
    await callback.answer()


@router.callback_query(F.data.startswith("pdf:"))
async def send_pdf(callback: CallbackQuery):
    section = callback.data.split(":")[1]
    pdf_path = BASE_DIR / "files" / f"menu_{section}.pdf"

    if pdf_path.exists():
        await callback.message.answer_document(
            FSInputFile(pdf_path),
            caption=texts.PDF_SENT.format(section=section.capitalize()),
        )
        await callback.answer()
    else:
        await callback.answer(texts.PDF_NOT_FOUND, show_alert=True)


@router.callback_query(F.data == "back_to_main")
async def back_to_main(callback: CallbackQuery):
    from src.handlers.start import start_handler
    await callback.message.delete()
    await start_handler(callback.message)
    await callback.answer()


@router.callback_query(F.data == "contacts")
async def contacts(callback: CallbackQuery):
    text = texts.CONTACTS.format(
        address=config.RESTAURANT_ADDRESS,
        phone=config.RESTAURANT_PHONE,
        hours=config.RESTAURANT_HOURS,
    )
    await replace_message_content(callback.message, text, parse_mode="HTML", reply_markup=main_menu_kb())
    await callback.answer()
