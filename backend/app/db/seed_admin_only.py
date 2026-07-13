"""
CommunityConnect Backend - Seed Community Admin Only

Creates a single community_admin user and their profile.
Does not seed any other users, regions, or data.
"""

import asyncio
import bcrypt
from datetime import date
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.enums import UserRole, Gender, MaritalStatus
from app.models.user import User
from app.models.profile import Profile
from app.models.setting import Setting


async def seed_admin():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    email = "head.admin@communityconnect.org"
    import os
    password = os.getenv("SEED_PASSWORD", "Password@123")

    print("Generating password hash...")
    raw_password = password.encode("utf-8")
    hashed_password = bcrypt.hashpw(raw_password, bcrypt.gensalt()).decode("utf-8")

    async with async_session() as session:
        # Create Community Admin User
        admin_user = User(
            phone_number="+919999999999",
            email=email,
            password_hash=hashed_password,
            role=UserRole.community_admin,
            is_active=True
        )
        session.add(admin_user)
        await session.flush()  # Generate user.id

        # Create Profile for Super Admin
        admin_profile = Profile(
            user_id=admin_user.id,
            full_name="Mahadev Shastri",
            date_of_birth=date(1965, 5, 12),
            gender=Gender.male,
            marital_status=MaritalStatus.married,
            profile_photo_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
            contact_number="+919999999999",
            address="Venkateshwara Nilaya, Bengaluru",
            occupation="Trust Head",
        )
        session.add(admin_profile)

        # Seed default settings
        session.add(Setting(key="auto_create_free_membership", value="true"))

        await session.commit()
        print("🎉 Community Admin seeded successfully!")
        print(f"Email: {email}")
        print(f"Password: {password}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
