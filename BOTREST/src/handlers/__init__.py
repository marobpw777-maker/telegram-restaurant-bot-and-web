# src/handlers/__init__.py
from aiogram import Router
from . import start, booking, menu, admin, profile, ai_assistant


def get_handlers_router() -> Router:
    router = Router()
    router.include_router(start.router)
    router.include_router(booking.router)
    router.include_router(menu.router)
    router.include_router(admin.router)
    router.include_router(profile.router)
    router.include_router(ai_assistant.router)  # Должен быть ПОСЛЕДНИМ (ловит любой текст)
    return router
