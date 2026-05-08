# src/utils/render_dish.py
from src import texts

def render_dish_text(dish: dict) -> str:
    """Форматирует данные блюда в красивый HTML-текст."""
    signature = texts.SIGNATURE if dish.get("is_signature") else ""
    new = texts.NEW if dish.get("is_new") else ""
    
    return texts.MENU_ITEM_TEMPLATE.format(
        name=dish["name"],
        signature=signature,
        new=new,
        description=dish.get("description", "Описание скоро появится"),
        composition=dish.get("composition", "Секрет шеф-повара"),
        weight=dish.get("weight", "---"),
        price=dish.get("price", " --- "),
        allergens=dish.get("allergens", "уточните у официанта")
    )
