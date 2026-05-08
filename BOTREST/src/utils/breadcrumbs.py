# src/utils/breadcrumbs.py
from typing import List

def render_breadcrumbs(steps: List[str]) -> str:
    """Генерирует строку хлебных крошек: Главная › Меню › ..."""
    return " › ".join([f"<i>{s}</i>" for s in steps])
