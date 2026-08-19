"""
Shared Postgres (Neon) connection layer.
Every business-logic service imports `get_session` from here instead of
calling gas_client.gas_post(). One engine, reused across all services and
all SUKs — isolation between SUKs happens via the `suk_key` column on each
table (see db_models.py), not via separate databases or connections.
"""
import os
from contextlib import asynccontextmanager
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "")

_connect_args = {}

if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    # SQLAlchemy's async engine needs the asyncpg dialect prefix.
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    # asyncpg doesn't understand sslmode=require / channel_binding=require as
    # URL query params (those are psycopg2-style) — strip them out of the URL
    # and tell asyncpg to use SSL via connect_args instead. Neon always
    # requires SSL, so this is safe to force on unconditionally.
    parts = urlsplit(DATABASE_URL)
    query_pairs = [(k, v) for k, v in parse_qsl(parts.query) if k not in ("sslmode", "channel_binding")]
    DATABASE_URL = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query_pairs), parts.fragment))
    _connect_args = {"ssl": "require"}

# pool_size/max_overflow kept modest — Neon's free tier has a connection
# ceiling, and each of the 6 Render services opens its own pool.
_engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,   # avoids "stale connection" errors after Neon idles
    connect_args=_connect_args,
    echo=False,
) if DATABASE_URL else None

_SessionLocal = async_sessionmaker(
    bind=_engine, expire_on_commit=False, class_=AsyncSession
) if _engine else None


def db_configured() -> bool:
    return _engine is not None


@asynccontextmanager
async def get_session():
    """
    Usage:
        async with get_session() as session:
            result = await session.execute(select(Booking).where(...))
    Commits on clean exit, rolls back on exception.
    """
    if _SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not set — check Render env vars.")
    session = _SessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def init_db():
    """Create tables if they don't exist yet. Safe to call on every startup —
    a no-op once tables already exist. Called from each service's startup event."""
    from backend.shared.db_models import Base
    if _engine is None:
        return
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)