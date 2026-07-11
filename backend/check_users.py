import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def inspect_users():
    async with AsyncSessionLocal() as session:
        stmt = select(User)
        result = await session.execute(stmt)
        users = result.scalars().all()
        print("Registered Users:")
        for u in users:
            print(f"  - Email: {u.email}")
            print(f"    Active: {u.is_active}")
            print(f"    Role: {u.role}")
            print(f"    ID: {u.id}")

if __name__ == "__main__":
    asyncio.run(inspect_users())
