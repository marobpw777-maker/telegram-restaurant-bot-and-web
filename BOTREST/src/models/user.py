# src/models/user.py
from datetime import datetime
from sqlalchemy import Column, BigInteger, String, Text, DateTime, Integer, Float, Boolean, JSON
from src.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=True)
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)  # Для веб-пользователей
    
    # CRM Metrics & SaaS Features
    no_show_count = Column(Integer, default=0)
    is_banned = Column(Boolean, default=False)
    visits_count = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    
    # 152-FZ Compliance
    agreed_to_policy = Column(Boolean, default=False)
    marketing_consent = Column(Boolean, default=False)
    
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
