# src/models/menu.py
from datetime import datetime
from sqlalchemy import String, Integer, Text, Boolean, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from src.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(50), default="food")  # food, drink, wine, dessert
    description: Mapped[str] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float)
    weight: Mapped[str] = mapped_column(String(50), nullable=True)
    composition: Mapped[str] = mapped_column(Text, nullable=True)
    allergens: Mapped[str] = mapped_column(Text, nullable=True)
    spice_level: Mapped[int] = mapped_column(Integer, nullable=True, default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)
    
    # Винные поля
    vintage: Mapped[str] = mapped_column(String(4), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=True)
    grape_variety: Mapped[str] = mapped_column(String(100), nullable=True)
    wine_type: Mapped[str] = mapped_column(String(50), nullable=True)
    food_pairing: Mapped[str] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
