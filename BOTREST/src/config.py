import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

# Корень проекта BOTREST/
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# --- Telegram ---
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN is not set. Check your .env file.")

TELEGRAM_API_URL = os.getenv("TELEGRAM_API_URL")
ADMIN_IDS = [int(i) for i in os.getenv("ADMIN_IDS", "").split(",") if i.strip()]

# --- Admin auth ---
ADMIN_LOGIN = os.getenv("ADMIN_LOGIN", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_SESSION_SECRET = os.getenv("ADMIN_SESSION_SECRET") or os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
ADMIN_SESSION_NAME = os.getenv("ADMIN_SESSION_NAME", "restaurant_admin_session")

# --- AI (GigaChat) ---
GIGACHAT_API_KEY = os.getenv("GIGACHAT_API_KEY", "")
GIGACHAT_MODEL = os.getenv("GIGACHAT_MODEL", "GigaChat")

# --- База данных ---
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR / 'data' / 'restaurant.db'}")

# --- WebApp ---
WEB_APP_URL = os.getenv("WEB_APP_URL", "")

# --- Ресторан ---
RESTAURANT_NAME = os.getenv("RESTAURANT_NAME", "Ресторан Вкус")
RESTAURANT_ADDRESS = os.getenv("RESTAURANT_ADDRESS", "г. Москва, ул. Большая Дмитровка, 12")
RESTAURANT_PHONE = os.getenv("RESTAURANT_PHONE", "+7 (495) 123-45-67")
RESTAURANT_HOURS = os.getenv("RESTAURANT_HOURS", "Ежедневно 10:00–23:00")
NOTIFICATION_CHAT_ID = os.getenv("NOTIFICATION_CHAT_ID")

# --- Бронирование ---
WORK_HOURS_START = int(os.getenv("WORK_HOURS_START", "10"))
WORK_HOURS_END = int(os.getenv("WORK_HOURS_END", "23"))
BOOKING_INTERVAL = int(os.getenv("BOOKING_INTERVAL", "30"))
REMINDER_HOURS_1 = int(os.getenv("REMINDER_HOURS_1", "24"))
REMINDER_HOURS_2 = int(os.getenv("REMINDER_HOURS_2", "1"))
SURVEY_DELAY_HOURS = int(os.getenv("SURVEY_DELAY_HOURS", "5"))

# --- API сервер ---
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# --- Логирование ---
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
