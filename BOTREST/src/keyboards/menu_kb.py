# src/keyboards/menu_kb.py
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.types import InlineKeyboardMarkup, WebAppInfo
from src import texts, config

def main_menu_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    if config.WEB_APP_URL and config.WEB_APP_URL.startswith("https://"):
        builder.button(text=texts.BTN_APP, web_app=WebAppInfo(url=config.WEB_APP_URL))
    builder.button(text=texts.BTN_BOOK, callback_data="start_booking")
    builder.button(text=texts.BTN_MENU, callback_data="menu_main")
    builder.button(text=texts.BTN_SOMMELIER, callback_data="call_sommelier")
    builder.button(text=texts.BTN_CONCIERGE, callback_data="call_concierge")
    builder.button(text="👤 Мой профиль", callback_data="show_profile")
    builder.button(text=texts.BTN_PDF, callback_data="pdf_menu")
    builder.button(text=texts.BTN_FAVORITES, callback_data="favorites")
    builder.button(text=texts.BTN_CONTACT, callback_data="contacts")
    builder.adjust(1)
    return builder.as_markup()

def categories_kb(categories: list) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for cat in categories:
        builder.button(text=cat["name"], callback_data=f"category:{cat['id']}")
    builder.button(text=texts.BTN_BACK, callback_data="back_to_main")
    builder.adjust(1)
    return builder.as_markup()

def items_kb(items: list, cat_id: int, page: int, total_pages: int, item_type: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    start_idx = page * 5
    end_idx = start_idx + 5
    
    for item in items[start_idx:end_idx]:
        builder.button(text=f"{item['name']} — {item['price']}₽", callback_data=f"{item_type}:{item['id']}")
    
    # Навигация
    nav_btns = []
    if page > 0:
        nav_btns.append(("⬅️", f"page:{item_type}:{cat_id}:{page-1}"))
    if page < total_pages - 1:
        nav_btns.append(("➡️", f"page:{item_type}:{cat_id}:{page+1}"))
    
    for text, data in nav_btns:
        builder.button(text=text, callback_data=data)
    
    builder.button(text=texts.BTN_BACK_TO_CATEGORIES, callback_data="menu_main")
    builder.adjust(1)
    return builder.as_markup()

def item_detail_kb(item_id: int, cat_id: int, item_type: str, is_fav: bool) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    if is_fav:
        builder.button(text=texts.BTN_FAV_REMOVE, callback_data=f"unfav:{item_type}:{item_id}")
    else:
        builder.button(text=texts.BTN_FAV_ADD, callback_data=f"fav:{item_type}:{item_id}")
    
    builder.button(text=texts.BTN_SHARE, callback_data=f"share:{item_type}:{item_id}")
    builder.button(text=texts.BTN_ASK_AI, callback_data=f"ask:{item_type}:{item_id}")
    builder.button(text=texts.BTN_BACK, callback_data=f"back_to_items:{cat_id}:{item_type}")
    builder.adjust(2, 1, 1)
    return builder.as_markup()

def pdf_menu_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🥦 Кухня", callback_data="pdf:kitchen")
    builder.button(text="🍷 Бар", callback_data="pdf:bar")
    builder.button(text=texts.BTN_BACK, callback_data="menu_main")
    builder.adjust(2, 1)
    return builder.as_markup()

def policy_agreement_kb() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=texts.BTN_ACCEPT_POLICY, callback_data="accept_policy")
    return builder.as_markup()
