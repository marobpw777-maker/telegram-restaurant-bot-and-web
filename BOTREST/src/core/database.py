# src/core/database.py
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from src import config

# Убедимся, что директория data/ существует
data_dir = Path(config.BASE_DIR) / "data"
data_dir.mkdir(exist_ok=True)

engine = create_async_engine(config.DATABASE_URL, echo=config.DEBUG)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Создать все таблицы если их нет."""
    # Импорт моделей чтобы они зарегистрировались в Base.metadata
    from src.models import User, Booking, Category, MenuItem, BusinessSettings  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Получить сессию БД (для FastAPI DI)."""
    async with AsyncSessionLocal() as session:
        yield session
