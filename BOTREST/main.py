# main.py
"""Точка входа: запуск Telegram-бота + REST API сервера одновременно."""
import asyncio
import logging
import socket
from contextlib import asynccontextmanager

from aiogram import Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
import uvicorn

# Принудительный IPv4
orig_getaddrinfo = socket.getaddrinfo
def getaddrinfo_ipv4(host, port, family=0, type=0, proto=0, flags=0):
    return orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = getaddrinfo_ipv4

from src.bot_instance import bot, scheduler
from src.core.database import init_db
from src.handlers import get_handlers_router
from src.api.routes import router as api_router
from src import config

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── FastAPI приложение ──────────────────────────────────

if not config.ADMIN_PASSWORD:
    logger.warning("⚠️ ADMIN_PASSWORD не задан. Админ-логин будет недоступен, пока не добавите его в BOTREST/.env.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при старте, очистка при остановке."""
    logger.info("🗄️ Инициализация базы данных...")
    await init_db()
    logger.info("✅ БД готова.")

    # Загрузка начальных данных (если БД пустая)
    await _seed_menu_if_empty()

    scheduler.start()
    logger.info("⏰ Планировщик запущен.")

    yield  # Приложение работает

    scheduler.shutdown(wait=False)
    logger.info("⏰ Планировщик остановлен.")


# Определяем разрешенные домены для админки и сайта
ALLOWED_ORIGINS = [
    origin for origin in [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        config.WEB_APP_URL,
    ] if origin
]

app = FastAPI(title="Ресторан Вкус API", lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,
    secret_key=config.ADMIN_SESSION_SECRET,
    session_cookie=config.ADMIN_SESSION_NAME,
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Mount static files directory for images
app.mount("/photos", StaticFiles(directory=config.BASE_DIR / "photo"), name="photos")

app.include_router(api_router)


# ── Telegram-бот ────────────────────────────────────────

async def run_bot():
    """✅ Улучшено: Запуск polling бота с exponential backoff и ограничением retry."""
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(get_handlers_router())

    try:
        await bot.delete_webhook(drop_pending_updates=True)
        logger.info("🧹 Вебхук удалён.")
    except Exception as e:
        logger.warning(f"⚠️ Не удалось удалить вебхук: {e}")

    logger.info("🤖 Telegram-бот запущен!")
    
    retry_count = 0
    max_retries = 10
    base_delay = 2  # секунды
    max_delay = 120  # макс 2 минуты между retry

    while retry_count < max_retries:
        try:
            await dp.start_polling(bot, close_bot_session=False)
            retry_count = 0  # Reset на успешный запуск
        except Exception as e:
            retry_count += 1
            delay = min(base_delay * (2 ** retry_count), max_delay)
            logger.error(f"💥 Ошибка polling (попытка {retry_count}/{max_retries}): {e}")
            
            if retry_count >= max_retries:
                logger.critical(f"❌ Бот не может восстановиться после {max_retries} попыток. Остановка.")
                raise
            
            logger.info(f"⏳ Перезапуск через {delay} секунд...")
            await asyncio.sleep(delay)


# ── Seed данных ─────────────────────────────────────────

async def _seed_menu_if_empty():
    """Заполняет БД начальными данными меню если она пустая."""
    from src.core.database import AsyncSessionLocal
    from src.models.menu import Category, MenuItem
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Category).limit(1))
        if result.scalar_one_or_none():
            return  # Данные уже есть

        logger.info("📝 Заполняем БД расширенным меню (40+ позиций)...")

        categories = [
            Category(id=1, name="Закуски", type="food", sort_order=1),
            Category(id=2, name="Салаты", type="food", sort_order=2),
            Category(id=3, name="Супы", type="food", sort_order=3),
            Category(id=4, name="Горячее", type="food", sort_order=4),
            Category(id=5, name="Десерты", type="dessert", sort_order=5),
            Category(id=6, name="Напитки", type="drink", sort_order=6),
            Category(id=7, name="Белые вина", type="wine", sort_order=7),
            Category(id=8, name="Красные вина", type="wine", sort_order=8),
            Category(id=9, name="Игристые вина", type="wine", sort_order=9),
        ]
        session.add_all(categories)

        items = [
            # Закуски
            MenuItem(category_id=1, name="Брускетта с томатами", description="Хрустящий багет с свежими томатами, базиликом и оливковым маслом", price=450, weight="180г", composition="Багет, Томаты, Базилик, Оливковое масло", allergens="Глютен", is_hit=True),
            MenuItem(category_id=1, name="Карпаччо из говядины", description="Тонко нарезанная мраморная говядина с рукколой и пармезаном", price=890, weight="150г", composition="Говядина, Руккола, Пармезан, Лимон", allergens="Молочные продукты", is_new=True),
            MenuItem(category_id=1, name="Тартар из лосося", description="Свежий лосось с авокадо, красным луком и лимонным соком", price=780, weight="200г", composition="Лосось, Авокадо, Красный лук, Лимон", allergens="Рыба"),
            MenuItem(category_id=1, name="Хумус с питой", description="Классический нутовый хумус с тахини, подаётся с тёплой питой", price=520, weight="250г", composition="Нут, Тахини, Лимон, Пита", allergens="Глютен, Кунжут"),
            MenuItem(category_id=1, name="Витело Тоннато", description="Нежная телятина под соусом из тунца с каперсами", price=920, weight="180г", composition="Телятина, Тунец, Каперсы, Майонез", allergens="Рыба, Яйцо"),
            MenuItem(category_id=1, name="Буррата с томатами", description="Свежая буррата с томатами черри и соусом песто", price=850, weight="200г", composition="Буррата, Томаты, Песто", allergens="Молочные продукты", is_new=True),
            
            # Салаты
            MenuItem(category_id=2, name="Цезарь с креветками", description="Классический салат Романо с тигровыми креветками", price=750, weight="280г", composition="Романо, Креветки, Пармезан, Соус", allergens="Молочные, Ракообразные, Глютен", is_hit=True),
            MenuItem(category_id=2, name="Нисуаз", description="Французский салат с тунцом, яйцом пашот и стручковой фасолью", price=680, weight="300г", composition="Тунец, Яйцо, Оливки, Фасоль", allergens="Рыба, Яйцо"),
            MenuItem(category_id=2, name="Тёплый салат с уткой", description="Микс-салат с утиной грудкой и вишнёвым соусом", price=890, weight="260г", composition="Утка, Микс салата, Вишня", is_hit=True),
            MenuItem(category_id=2, name="Греческий салат", description="Свежие овощи с сыром Фета и оливками Каламата", price=520, weight="320г", composition="Томаты, Огурцы, Фета, Оливки", allergens="Молочные продукты"),

            # Супы
            MenuItem(category_id=3, name="Крем-суп из тыквы", description="Нежный суп из печёной тыквы с трюфельным маслом", price=450, weight="300мл", composition="Тыква, Сливки, Семечки", allergens="Молочные продукты"),
            MenuItem(category_id=3, name="Гаспачо", description="Освежающий холодный томатный суп", price=420, weight="300мл", composition="Томаты, Огурец, Перец, Оливковое масло"),
            MenuItem(category_id=3, name="Борщ по-домашнему", description="Наваристый борщ с говядиной и пампушками", price=480, weight="350мл", composition="Говядина, Свёкла, Капуста, Сметана", allergens="Молочные, Глютен", is_hit=True),
            MenuItem(category_id=3, name="Том Ям с морепродуктами", description="Тайский острый суп с креветками и мидиями", price=750, weight="350мл", composition="Морепродукты, Кокосовое молоко, Лемонграсс", allergens="Ракообразные", spice_level=2),

            # Горячее
            MenuItem(category_id=4, name="Стейк Рибай", description="Мраморная говядина на гриле с перечным соусом и овощами", price=2450, weight="350г", composition="Говядина Рибай, Перечный соус, Овощи", is_hit=True),
            MenuItem(category_id=4, name="Каре ягнёнка", description="Ягнёнок на кости с мятным соусом", price=2200, weight="300г", composition="Ягнёнок, Мята, Овощи", is_new=True),
            MenuItem(category_id=4, name="Утиная грудка", description="Запечённая утиная грудка с пюре из сельдерея", price=1600, weight="280г", composition="Утка, Сельдерей, Вишня"),
            MenuItem(category_id=4, name="Паста Карбонара", description="Классическая римская паста с гуанчиале и пекорино романо", price=680, weight="320г", composition="Спагетти, Гуанчиале, Яйцо, Пекорино", allergens="Глютен, Яйцо, Молочные"),
            MenuItem(category_id=4, name="Ризотто с грибами", description="Кремовое ризотто с белыми грибами и трюфельным маслом", price=790, weight="300г", composition="Рис Арборио, Белые грибы, Трюфельное масло, Пармезан", allergens="Молочные", is_new=True),
            MenuItem(category_id=4, name="Паэлья с морепродуктами", description="Испанская паэлья с креветками, мидиями и шафраном", price=1200, weight="400г", composition="Рис, Креветки, Мидии, Кальмары, Шафран", allergens="Моллюски, Ракообразные", spice_level=1),
            MenuItem(category_id=4, name="Сибас на гриле", description="Целый сибас приготовленный на углях с прованскими травами", price=1400, weight="300г", composition="Сибас, Лимон, Оливковое масло", allergens="Рыба"),
            MenuItem(category_id=4, name="Лосось терияки", description="Филе лосося в японском соусе с рисом", price=1200, weight="250г", composition="Лосось, Рис, Терияки", allergens="Рыба, Соя"),

            # Десерты
            MenuItem(category_id=5, name="Тирамису", description="Классический итальянский десерт с маскарпоне и кофе", price=450, weight="180г", composition="Маскарпоне, Савоярди, Кофе, Яйцо, Какао", allergens="Молочные, Яйцо, Глютен", is_hit=True),
            MenuItem(category_id=5, name="Чизкейк Нью-Йорк", description="Нежный чизкейк с ягодным соусом", price=520, weight="200г", composition="Сливочный сыр, Сливки, Ягоды, Печенье", allergens="Молочные, Глютен"),
            MenuItem(category_id=5, name="Шоколадный фондан", description="Тёплый шоколадный торт с жидкой сердцевиной и ванильным мороженым", price=580, weight="220г", composition="Тёмный шоколад, Масло, Яйцо, Мука", allergens="Молочные, Яйцо, Глютен", is_new=True),
            MenuItem(category_id=5, name="Панна-котта", description="Лёгкий сливочный десерт с клубничным соусом", price=420, weight="180г", composition="Сливки, Ваниль, Клубника", allergens="Молочные"),

            # Напитки
            MenuItem(category_id=6, name="Эспрессо", description="Крепкий итальянский кофе", price=180, weight="30мл", composition="Кофе арабика"),
            MenuItem(category_id=6, name="Капучино", description="Эспрессо с молочной пенкой", price=250, weight="200мл", composition="Кофе, Молоко", allergens="Молочные"),
            MenuItem(category_id=6, name="Домашний лимонад", description="Освежающий лимонад с мятой и имбирём", price=350, weight="400мл", composition="Лимон, Мята, Имбирь, Сахар", is_hit=True),
            MenuItem(category_id=6, name="Свежевыжатый апельсиновый", description="100% натуральный", price=420, weight="300мл", composition="Апельсины"),

            # Вина - Белые
            MenuItem(category_id=7, name="Pinot Grigio, Veneto (2023)", description="Лёгкое сухое белое вино с нотками зелёного яблока и цитрусов. Италия.", price=2800, weight="750мл", vintage="2023", region="Veneto, Италия", grape_variety="Pinot Grigio", wine_type="white", food_pairing="рыба, морепродукты, лёгкие закуски", allergens="Сульфиты"),
            MenuItem(category_id=7, name="Chablis, Domaine William Fèvre (2022)", description="Сухое, среднетелое вино с нотами лимона и мела.", price=4200, weight="750мл", vintage="2022", region="Chablis, Франция", grape_variety="Chardonnay", wine_type="white", food_pairing="устрицы, сибас, курица", allergens="Сульфиты", is_hit=True),
            MenuItem(category_id=7, name="Sauvignon Blanc, Marlborough (2023)", description="Сухое, свежее вино с яркими тонами маракуйи.", price=3100, weight="750мл", vintage="2023", region="Marlborough, Новая Зеландия", grape_variety="Sauvignon Blanc", wine_type="white", food_pairing="салаты, козий сыр", allergens="Сульфиты", is_new=True),
            
            # Вина - Красные
            MenuItem(category_id=8, name="Chianti Classico, Tuscany (2021)", description="Классическое тосканское красное вино с нотками вишни и пряностей.", price=3200, weight="750мл", vintage="2021", region="Tuscany, Италия", grape_variety="Sangiovese", wine_type="red", food_pairing="паста карбонара, пицца, мясные закуски", allergens="Сульфиты", is_hit=True),
            MenuItem(category_id=8, name="Barolo DOCG (2019)", description="Полнотелое вино с мощной структурой и нотами трюфеля.", price=6500, weight="750мл", vintage="2019", region="Piemonte, Италия", grape_variety="Nebbiolo", wine_type="red", food_pairing="стейк Рибай, каре ягнёнка, выдержанные сыры", allergens="Сульфиты"),
            MenuItem(category_id=8, name="Malbec Reserva, Mendoza (2022)", description="Яркое вино с тонами сливы и шоколада.", price=2600, weight="750мл", vintage="2022", region="Mendoza, Аргентина", grape_variety="Malbec", wine_type="red", food_pairing="стейк, утиная грудка", allergens="Сульфиты"),
            MenuItem(category_id=8, name="Pinot Noir, Côtes de Beaune (2021)", description="Элегантное красное с тонами малины и пряностей.", price=4800, weight="750мл", vintage="2021", region="Bourgogne, Франция", grape_variety="Pinot Noir", wine_type="red", food_pairing="утиная грудка, грибные блюда", allergens="Сульфиты", is_new=True),
            
            # Вина - Игристые
            MenuItem(category_id=9, name="Prosecco, Valdobbiadene (NV)", description="Игристое вино с тонкими пузырьками и нотками белого персика.", price=2400, weight="750мл", vintage="NV", region="Veneto, Италия", grape_variety="Glera", wine_type="sparkling", food_pairing="аперитив, лёгкие закуски", allergens="Сульфиты", is_new=True),
            MenuItem(category_id=9, name="Champagne Moët & Chandon Impérial (NV)", description="Премиальное шампанское с тонами фруктов и бриоши.", price=8500, weight="750мл", vintage="NV", region="Champagne, Франция", grape_variety="Chardonnay, Pinot Noir, Pinot Meunier", wine_type="sparkling", food_pairing="икра, устрицы, торжества", allergens="Сульфиты"),
            MenuItem(category_id=9, name="Asti Spumante", description="Сладкое игристое вино.", price=1800, weight="750мл", vintage="NV", region="Piemonte, Италия", grape_variety="Moscato Bianco", wine_type="sparkling", food_pairing="десерты, фрукты", allergens="Сульфиты"),
        ]
        
        # Заполняем URL изображений
        for item in items:
            if item.category_id in [7, 8, 9]:
                item.image_url = "/photos/wine.jpg"
            else:
                item.image_url = "/photos/dish.jpg"

        session.add_all(items)
        await session.commit()
        logger.info(f"✅ Загружено {len(categories)} категорий и {len(items)} позиций меню.")


# ── Запуск ──────────────────────────────────────────────

async def main():
    logger.info(f"🚀 Запуск {config.RESTAURANT_NAME}...")

    # Запускаем бота и API параллельно
    api_config = uvicorn.Config(
        app, host=config.API_HOST, port=config.API_PORT, log_level="info",
    )
    api_server = uvicorn.Server(api_config)

    await asyncio.gather(
        api_server.serve(),  # FastAPI на порту 8000
        run_bot(),            # Telegram polling
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("👋 Бот и API остановлены.")
