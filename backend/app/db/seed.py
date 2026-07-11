"""
CommunityConnect Backend - Database Seeding Script

Populates the database with sample regions, admins, families,
profiles, and matrimony states for development and testing.
"""

import asyncio
import uuid
from datetime import date, timedelta
import bcrypt

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.enums import UserRole, Gender, MaritalStatus, VerificationStatus
from app.models.user import User
from app.models.region import AdminRegion, LocalAdminRegion
from app.models.family import FamilyUnit
from app.models.profile import Profile
from app.models.matrimony import MatrimonyProfile


async def seed_data():
    print("Seeding database...")
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        # 1. Create default Admin Regions
        print("Creating regions...")
        regions = [
            AdminRegion(name="Bengaluru North", description="Covers Hebbal, Yelahanka, and surrounding areas."),
            AdminRegion(name="Bengaluru South", description="Covers Jayanagar, JP Nagar, and surrounding areas."),
            AdminRegion(name="Mysuru Central", description="Covers core Mysuru district boundaries."),
        ]
        session.add_all(regions)
        await session.flush()

        # 2. Create Users
        print("Creating users...")
        import os
        seed_password = os.getenv("SEED_PASSWORD", "Password@123")
        raw_password = seed_password.encode("utf-8")
        hashed_password = bcrypt.hashpw(raw_password, bcrypt.gensalt()).decode("utf-8")

        # Head / Super Admin
        admin_user = User(
            phone_number="+919999999999",
            email="head.admin@communityconnect.org",
            password_hash=hashed_password,
            role=UserRole.community_admin,
            is_active=True
        )
        
        # Local Admin 1
        local_admin_1 = User(
            phone_number="+918888888888",
            email="local.admin1@communityconnect.org",
            password_hash=hashed_password,
            role=UserRole.local_admin,
            is_active=True
        )

        # Local Admin 2
        local_admin_2 = User(
            phone_number="+917777777777",
            email="local.admin2@communityconnect.org",
            password_hash=hashed_password,
            role=UserRole.local_admin,
            is_active=True
        )

        # Verified Adult User (also Family Head)
        verified_adult_1 = User(
            phone_number="+916666666666",
            email="abhishek@gmail.com",
            password_hash=hashed_password,
            role=UserRole.verified_adult,
            is_active=True
        )

        # Matrimony Opt-In User 1
        matrimony_user_1 = User(
            phone_number="+915555555555",
            email="ramesh@gmail.com",
            password_hash=hashed_password,
            role=UserRole.verified_adult,
            is_active=True
        )

        # Unverified User
        unverified_user = User(
            phone_number="+914444444444",
            email="new.member@gmail.com",
            password_hash=hashed_password,
            role=UserRole.unverified,
            is_active=True
        )

        session.add_all([admin_user, local_admin_1, local_admin_2, verified_adult_1, matrimony_user_1, unverified_user])
        await session.flush()

        # 3. Map Local Admins to Regions
        print("Assigning Local Admins to regions...")
        mapping_1 = LocalAdminRegion(user_id=local_admin_1.id, region_id=regions[0].id)
        mapping_2 = LocalAdminRegion(user_id=local_admin_2.id, region_id=regions[1].id)
        session.add_all([mapping_1, mapping_2])

        # 4. Create Family Units
        print("Creating Family Units...")
        family_1 = FamilyUnit(name="Yaligar Family")
        family_2 = FamilyUnit(name="Sharma Family")
        session.add_all([family_1, family_2])
        await session.flush()

        # 5. Create Member Profiles
        print("Creating Profiles...")
        
        # Profile for Super Admin
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

        # Profile for Local Admin 1
        local_admin_profile = Profile(
            user_id=local_admin_1.id,
            full_name="Kiran Kumar",
            date_of_birth=date(1978, 9, 21),
            gender=Gender.male,
            marital_status=MaritalStatus.married,
            profile_photo_url="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce",
            contact_number="+918888888888",
            address="Yelahanka New Town, Bengaluru",
            occupation="Business Owner",
        )

        # Profile for Verified Family Head
        family_head_profile = Profile(
            user_id=verified_adult_1.id,
            family_unit_id=family_1.id,
            full_name="Abhishek Yaligar",
            date_of_birth=date(1990, 8, 15),
            gender=Gender.male,
            marital_status=MaritalStatus.married,
            profile_photo_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
            contact_number="+916666666666",
            address="JP Nagar 2nd Phase, Bengaluru",
            occupation="Software Architect",
        )

        # Profile for Minor child (under 18) linked to Family 1
        minor_profile = Profile(
            family_unit_id=family_1.id,
            full_name="Arjun Yaligar",
            date_of_birth=date(2015, 3, 10), # Minor, age ~11
            gender=Gender.male,
            marital_status=MaritalStatus.single,
            profile_photo_url="https://images.unsplash.com/photo-1503919545889-aef636e10ad4",
            address="JP Nagar 2nd Phase, Bengaluru",
        )

        # Profile for Matrimony User 1
        matrimony_profile_1 = Profile(
            user_id=matrimony_user_1.id,
            family_unit_id=family_2.id,
            full_name="Ramesh Sharma",
            date_of_birth=date(1996, 2, 4),
            gender=Gender.male,
            marital_status=MaritalStatus.single,
            profile_photo_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
            contact_number="+915555555555",
            address="Hebbal main road, Bengaluru",
            occupation="Chartered Accountant",
        )

        # Profile for Unverified User
        unverified_profile = Profile(
            user_id=unverified_user.id,
            full_name="Sunil Patil",
            date_of_birth=date(1992, 11, 30),
            gender=Gender.male,
            marital_status=MaritalStatus.single,
            profile_photo_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
            contact_number="+914444444444",
            address="Gokulam, Mysuru",
            occupation="Civil Engineer",
        )

        session.add_all([admin_profile, local_admin_profile, family_head_profile, minor_profile, matrimony_profile_1, unverified_profile])
        await session.flush()

        # Update Family Heads
        family_1.family_head_id = family_head_profile.id
        family_2.family_head_id = matrimony_profile_1.id

        # 6. Opt-In Matrimony Profile
        print("Opting member into Matrimony...")
        matrimony_detail = MatrimonyProfile(
            profile_id=matrimony_profile_1.id,
            opted_in=True,
            double_approval_required=False,
            about_me="Passionate about local community work, looking for someone with values.",
            highest_qualification="B.Com, CA",
            father_name="Retired Bank Manager",
            father_occupation="Service",
            mother_name="Homemaker",
            mother_occupation="Homemaker",
            hobbies="Trekking, Reading novels",
            preferences={"min_age": 24, "max_age": 29, "location": "Bengaluru"}
        )
        session.add(matrimony_detail)

        # Commit everything
        await session.commit()
        print("Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data())
