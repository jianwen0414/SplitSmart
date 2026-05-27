from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_settings = get_settings()
_engine = create_async_engine(
    _settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    connect_args={"ssl": "require"},
) if _settings.DATABASE_URL else None
_SessionLocal = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession) if _engine else None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if _SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with _SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
