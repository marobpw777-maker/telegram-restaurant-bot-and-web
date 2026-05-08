# src/bot_instance.py
import logging
import socket
import aiohttp
import json
from aiogram import Bot
from aiogram.client.session.aiohttp import AiohttpSession
from aiogram.client.telegram import TelegramAPIServer
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from src import config

logger = logging.getLogger(__name__)

TIMEOUT = 60


class SafeAiohttpSession(AiohttpSession):
    """Сессия с принудительным IPv4 и безопасным SSL."""

    async def create_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            connector = aiohttp.TCPConnector(
                family=socket.AF_INET,
                ssl=not config.DEBUG,  # Отключаем проверку SSL в DEBUG для стабильности на локальных ПК
                ttl_dns_cache=300,
            )
            serializer = getattr(self, "json_serialization", json.dumps)
            self._session = aiohttp.ClientSession(
                connector=connector,
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                json_serialize=serializer,
                trust_env=True,
            )
        return self._session


session = SafeAiohttpSession(timeout=TIMEOUT)

if config.TELEGRAM_API_URL:
    logger.info(f"🌐 Зеркало API: {config.TELEGRAM_API_URL}")
    session.api = TelegramAPIServer.from_base(config.TELEGRAM_API_URL)
else:
    logger.info("📡 Официальное API Telegram (IPv4, SSL гибкий)")

bot = Bot(token=config.TELEGRAM_BOT_TOKEN, session=session)

# Планировщик задач
jobs_db_path = config.BASE_DIR / "data" / "jobs.sqlite"
jobstores = {"default": SQLAlchemyJobStore(url=f"sqlite:///{jobs_db_path}")}
scheduler = AsyncIOScheduler(jobstores=jobstores)
