from fastapi import Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from src import config


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


async def require_admin(request: Request):
    if request.session.get("admin_authenticated") is True:
        return True
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Требуется вход в админ-панель",
    )


async def get_current_admin_login(request: Request):
    if request.session.get("admin_authenticated") is True:
        return request.session.get("admin_login", config.ADMIN_LOGIN)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Требуется вход в админ-панель",
    )


def verify_admin_credentials(username: str, password: str) -> bool:
    if not config.ADMIN_PASSWORD:
        return False
    return username == config.ADMIN_LOGIN and password == config.ADMIN_PASSWORD
