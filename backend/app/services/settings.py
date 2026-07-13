from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.setting import Setting


async def get_setting(db: AsyncSession, key: str, default: str = "true") -> str:
    stmt = select(Setting).where(Setting.key == key)
    result = await db.execute(stmt)
    setting = result.scalars().first()
    if not setting:
        return default
    return setting.value


async def set_setting(db: AsyncSession, key: str, value: str) -> Setting:
    stmt = select(Setting).where(Setting.key == key)
    result = await db.execute(stmt)
    setting = result.scalars().first()
    if setting:
        setting.value = value
    else:
        setting = Setting(key=key, value=value)
        db.add(setting)
    await db.commit()
    await db.refresh(setting)
    return setting
