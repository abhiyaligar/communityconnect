"""
CommunityConnect Backend - Seed 20 Matrimony-eligible Profiles

Creates 10 male + 10 female singles with active memberships,
comprehensive matrimony data, and preference records.
Covers all enum values and edge cases.
"""

import asyncio
import os
import uuid
from datetime import date, timedelta
import bcrypt

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.enums import (
    UserRole, Gender, MaritalStatus, BodyType, Complexion,
    EducationLevel, EmploymentType, IncomeRange, Rashi,
    ManglikStatus, Diet, ActivityLevel, ProfileVisibility,
)
from app.models.user import User
from app.models.profile import Profile
from app.models.matrimony import MatrimonyProfile
from app.models.preference import MatrimonyPreference
from app.models.membership import Membership, MembershipStatus

SEED_PASSWORD = os.getenv("SEED_PASSWORD", "Password@123")

UNSPLASH_MEN = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
    "https://images.unsplash.com/photo-1504257432389-52343af06ae3",
    "https://images.unsplash.com/photo-1531384441138-2736e62e0919",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
]

UNSPLASH_WOMEN = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04",
    "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91",
    "https://images.unsplash.com/photo-1542596594-64957bc2f66d",
]

GOTRAS = [
    "Kashyapa", "Bharadwaja", "Vashishta", "Vishwamitra",
    "Atri", "Jamadagni", "Gautama", "Angira",
    "Kaushika", "Shandilya", "Parasara", "Vyasa",
    "Mandavya", "Valmiki", "Lohita", "Kanva",
]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira",
    "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha",
    "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra",
    "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula",
    "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

SUB_CASTES = ["Iyer", "Iyengar", "Smartha", "Madhwa", "Mishra", "Goud", "Saraswat", "Havyaka"]
FAMILY_TYPES = ["nuclear", "joint"]
FAMILY_VALUES = ["traditional", "moderate", "liberal"]
FAMILY_FINANCIAL = ["lower_middle", "middle", "upper_middle", "affluent"]
DIETS = [d.value for d in Diet]
MANGALIK_STATUSES = [m.value for m in ManglikStatus]
BODY_TYPES = [b for b in BodyType]
COMPLEXIONS = [c for c in Complexion]
EDUCATION_LEVELS = [e.value for e in EducationLevel]
EMPLOYMENT_TYPES = [e.value for e in EmploymentType]
INCOME_RANGES = [r.value for r in IncomeRange]
ACTIVITY_LEVELS = [a for a in ActivityLevel]
VISIBILITIES = [v.value for v in ProfileVisibility]

HOBBIES_POOL = [
    "Reading", "Trekking", "Photography", "Cooking",
    "Gardening", "Painting", "Music", "Dancing",
    "Yoga", "Swimming", "Chess", "Badminton",
    "Traveling", "Writing", "Cycling", "Movies",
]

LANGUAGES_POOL = [
    "Kannada", "Telugu", "Tamil", "Malayalam",
    "Hindi", "English", "Marathi", "Gujarati",
]

MALE_NAMES = [
    ("Arun", "Kumar"), ("Karthik", "Rao"), ("Suresh", "Murthy"),
    ("Vivek", "Shetty"), ("Rohan", "Joshi"), ("Pranav", "Desai"),
    ("Nikhil", "Patil"), ("Aditya", "Naik"), ("Varun", "Hegde"),
    ("Darshan", "Gowda"),
]

FEMALE_NAMES = [
    ("Priya", "Sharma"), ("Ananya", "Reddy"), ("Megha", "Pillai"),
    ("Sneha", "Menon"), ("Kavya", "Nair"), ("Divya", "Iyer"),
    ("Pooja", "Rao"), ("Neha", "Kulkarni"), ("Shruti", "Bhat"),
    ("Aishwarya", "Shetty"),
]


def make_user(email: str, phone: str) -> User:
    raw = SEED_PASSWORD.encode("utf-8")
    hashed = bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")
    return User(
        phone_number=phone,
        email=email,
        password_hash=hashed,
        role=UserRole.verified_adult,
        is_active=True,
    )


def make_profile(user: User, name: str, gender: Gender, dob: date, idx: int) -> Profile:
    unsplash = UNSPLASH_MEN[idx] if gender == Gender.male else UNSPLASH_WOMEN[idx]
    return Profile(
        user_id=user.id,
        full_name=name,
        date_of_birth=dob,
        gender=gender,
        marital_status=MaritalStatus.single,
        profile_photo_url=unsplash,
        contact_number=user.phone_number,
        address=f"{idx + 1}st Main Road, {['Jayanagar', 'Indiranagar', 'Koramangala', 'Whitefield', 'Yelahanka', 'Hebbal', 'JP Nagar', 'BTM Layout', 'Malleshwaram', 'Sadashivanagar'][idx]}, Bengaluru",
        occupation=["Software Engineer", "Doctor", "Architect", "Teacher", "Business Owner", "Lawyer", "Chartered Accountant", "Civil Engineer", "Marketing Manager", "Professor"][idx],
    )


def make_membership(user: User) -> Membership:
    username = user.email.split("@")[0]
    return Membership(
        user_id=user.id,
        username=username,
        start_date=date.today() - timedelta(days=30),
        end_date=date.today() + timedelta(days=330),
        status=MembershipStatus.active,
    )


def make_matrimony(profile: Profile, rashi: Rashi, gotra: str, nakshatra: str,
                   manglik: ManglikStatus, diet: Diet, body_type: BodyType,
                   complexion: Complexion, education: str, employment: str,
                   income: str, height: int, weight: int,
                   smoke: ActivityLevel, drink: ActivityLevel, activity: ActivityLevel,
                   family_type: str, family_values: str, family_financial: str,
                   visibility: str, birth_time: str | None, hobbies: list[str],
                   languages: list[str], idx: int) -> MatrimonyProfile:
    gender_prefix = "He" if profile.gender == Gender.male else "She"
    _last = profile.full_name.split()[-1]
    about = (
        f"{gender_prefix} is a {education} graduate working as a {employment} professional "
        f"in Bengaluru. Belongs to {gotra} gotra, {rashi.value} rashi. "
        f"Interested in {', '.join(hobbies[:3])}. Values {family_values} family traditions."
    )
    return MatrimonyProfile(
        profile_id=profile.id,
        opted_in=True,
        double_approval_required=False,
        height_cm=str(height),
        body_type=body_type.value,
        complexion=complexion.value,
        highest_qualification=education,
        field_of_study=["Computer Science", "Medicine", "Architecture", "Education", "Business Administration", "Law", "Commerce", "Civil Engineering", "Marketing", "Philosophy"][idx],
        institution=["IISc Bangalore", "KMC Mangalore", "BMS College", "NIAS Bangalore", "IIM Bangalore", "NLSIU Bangalore", "St. Joseph's College", "RV College", "MCC Bangalore", "Bangalore University"][idx],
        employment_type=employment,
        job_title=["Sr. Developer", "Cardiologist", "Design Lead", "School Principal", "CEO", "Corporate Lawyer", "Audit Manager", "Project Manager", "Brand Head", "HOD"][idx],
        income_range=income,
        work_location="Bengaluru",
        gotra=gotra,
        sub_caste=SUB_CASTES[idx % len(SUB_CASTES)],
        rashi=rashi.value,
        nakshatra=nakshatra,
        manglik_status=manglik.value,
        birth_time=birth_time,
        birth_place="Bengaluru",
        company_name=["TechCorp", "Apollo Hospitals", "A&D Studio", "Vidya Mandir", "MyBiz Ltd", "Legal Firm LLP", "Deloitte", "BuildWell Corp", "BrandCraft", "Vivekananda College"][idx],
        father_name=f"{['Ramesh', 'Suresh', 'Mahesh', 'Gopal', 'Venkatesh', 'Narayan', 'Hari', 'Ganesh', 'Krishna', 'Shankar'][idx]} {_last}",
        father_occupation=["Retired Banker", "Doctor", "Businessman", "Professor", "Engineer", "Lawyer", "Accountant", "Contractor", "Marketing Executive", "Civil Servant"][idx],
        mother_name=f"{['Lakshmi', 'Saraswati', 'Parvati', 'Anita', 'Radha', 'Geeta', 'Mala', 'Sunita', 'Rekha', 'Vimala'][idx]} {_last}",
        mother_occupation=["Homemaker", "Teacher", "Nurse", "Homemaker", "Bank Officer", "Homemaker", "Professor", "Homemaker", "Artist", "Homemaker"][idx],
        brothers_count=str(idx % 3),
        brothers_marital_status=["married", "single"][idx % 2],
        sisters_count=str((idx + 1) % 3),
        sisters_marital_status=["single", "married"][(idx + 1) % 2],
        family_type=family_type,
        family_values=family_values,
        family_financial_status=family_financial,
        diet=diet.value,
        smoking=smoke.value,
        drinking=drink.value,
        physical_activity=activity.value,
        about_me=about,
        hobbies=hobbies,
        languages=languages,
        visibility=visibility,
        preferences={
            "preferred_age_range": [profile.full_name, "preferences"],
        },
    )


def make_preferences(profile: Profile,
                     strict_rashi: list[str] | None, preferred_rashi: list[str] | None,
                     strict_gotra: list[str] | None, preferred_gotra: list[str] | None,
                     strict_diet: list[str] | None, preferred_diet: list[str] | None,
                     manglik: str) -> MatrimonyPreference:
    return MatrimonyPreference(
        profile_id=profile.id,
        strict_rashi=strict_rashi,
        preferred_rashi=preferred_rashi,
        strict_gotra=strict_gotra,
        preferred_gotra=preferred_gotra,
        strict_diet=strict_diet,
        preferred_diet=preferred_diet,
        manglik=manglik,
        strict_age_min=23,
        strict_age_max=35,
        preferred_age_min=25,
        preferred_age_max=32,
        strict_height_min=150,
        strict_height_max=190,
        preferred_height_min=155,
        preferred_height_max=185,
        strict_income_min=IncomeRange.from_2_to_5l.value,
        strict_income_max=IncomeRange.above_20l.value,
        preferred_income=IncomeRange.from_10_to_20l.value,
        strict_education=[EducationLevel.bachelors.value, EducationLevel.masters.value],
        preferred_education=[EducationLevel.masters.value],
        strict_employment=[EmploymentType.employed.value, EmploymentType.self_employed.value],
        preferred_employment=[EmploymentType.employed.value],
        preferred_hobbies=["Reading", "Traveling", "Music"],
        about_partner="Looking for someone who shares similar values and interests.",
    )


async def seed():
    print("=" * 60)
    print("Seeding 20 matrimony-eligible profiles...")
    print("=" * 60)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with async_session() as session:
        # ── Male Users + Profiles ──────────────────────────
        males: list[tuple[User, Profile]] = []
        male_rashis = [
            Rashi.aries, Rashi.taurus, Rashi.gemini, Rashi.cancer,
            Rashi.leo, Rashi.virgo, Rashi.libra, Rashi.scorpio,
            Rashi.sagittarius, Rashi.capricorn,
        ]
        male_dobs = [
            date(2001, 3, 15), date(1999, 7, 22), date(1997, 11, 8),
            date(1996, 1, 20), date(1994, 5, 10), date(1993, 9, 5),
            date(1991, 12, 18), date(1990, 4, 25), date(1988, 8, 30),
            date(1987, 2, 14),
        ]
        for i in range(10):
            first, last = MALE_NAMES[i]
            email = f"{first.lower()}.{last.lower()}@example.com"
            phone = f"+9191000000{i:02d}"
            user = make_user(email, phone)
            session.add(user)
            await session.flush()

            profile = make_profile(user, f"{first} {last}", Gender.male, male_dobs[i], i)
            profile.username = f"male_{first.lower()}_{i}"
            session.add(profile)
            await session.flush()

            membership = make_membership(user)
            session.add(membership)

            males.append((user, profile))

        # ── Female Users + Profiles ────────────────────────
        females: list[tuple[User, Profile]] = []
        female_rashis = [
            Rashi.aquarius, Rashi.pisces, Rashi.aries, Rashi.taurus,
            Rashi.gemini, Rashi.cancer, Rashi.leo, Rashi.virgo,
            Rashi.libra, Rashi.scorpio,
        ]
        female_dobs = [
            date(2002, 6, 10), date(2000, 10, 3), date(1998, 2, 28),
            date(1995, 8, 15), date(1994, 12, 1), date(1992, 4, 17),
            date(1991, 7, 23), date(1990, 11, 11), date(1988, 3, 5),
            date(1986, 9, 19),
        ]
        for i in range(10):
            first, last = FEMALE_NAMES[i]
            email = f"{first.lower()}.{last.lower()}@example.com"
            phone = f"+9192000000{i:02d}"
            user = make_user(email, phone)
            session.add(user)
            await session.flush()

            profile = make_profile(user, f"{first} {last}", Gender.female, female_dobs[i], i)
            profile.username = f"female_{first.lower()}_{i}"
            session.add(profile)
            await session.flush()

            membership = make_membership(user)
            session.add(membership)

            females.append((user, profile))

        await session.flush()
        print(f"  ✓ Created {len(males) + len(females)} users + profiles + memberships")

        # ── Matrimony Profiles ─────────────────────────────
        seed_values = [
            # idx=0 male
            dict(rashi=male_rashis[0], gotra=GOTRAS[0], nakshatra=NAKSHATRAS[0],
                 manglik=ManglikStatus.no, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[0], complexion=COMPLEXIONS[0],
                 education=EDUCATION_LEVELS[0], employment=EMPLOYMENT_TYPES[0],
                 income=INCOME_RANGES[0], height=175, weight=70,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[1], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[0],
                 family_financial=FAMILY_FINANCIAL[0], visibility=VISIBILITIES[0],
                 birth_time="02:30 PM", hobbies=HOBBIES_POOL[:4], languages=LANGUAGES_POOL[:3]),
            # idx=1 male
            dict(rashi=male_rashis[1], gotra=GOTRAS[1], nakshatra=NAKSHATRAS[1],
                 manglik=ManglikStatus.yes, diet=Diet.non_vegetarian,
                 body_type=BODY_TYPES[1], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[1], employment=EMPLOYMENT_TYPES[1],
                 income=INCOME_RANGES[1], height=180, weight=78,
                 smoke=ACTIVITY_LEVELS[1], drink=ACTIVITY_LEVELS[2], activity=ACTIVITY_LEVELS[0],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[1],
                 family_financial=FAMILY_FINANCIAL[1], visibility=VISIBILITIES[1],
                 birth_time="11:45 AM", hobbies=HOBBIES_POOL[2:7], languages=LANGUAGES_POOL[1:4]),
            # idx=2 male
            dict(rashi=male_rashis[2], gotra=GOTRAS[2], nakshatra=NAKSHATRAS[2],
                 manglik=ManglikStatus.partial, diet=Diet.eggetarian,
                 body_type=BODY_TYPES[2], complexion=COMPLEXIONS[2],
                 education=EDUCATION_LEVELS[2], employment=EMPLOYMENT_TYPES[2],
                 income=INCOME_RANGES[2], height=168, weight=62,
                 smoke=ACTIVITY_LEVELS[2], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[1],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[2],
                 family_financial=FAMILY_FINANCIAL[2], visibility=VISIBILITIES[2],
                 birth_time="08:15 AM", hobbies=HOBBIES_POOL[5:9], languages=LANGUAGES_POOL[2:6]),
            # idx=3 male
            dict(rashi=male_rashis[3], gotra=GOTRAS[3], nakshatra=NAKSHATRAS[3],
                 manglik=ManglikStatus.dont_know, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[3], complexion=COMPLEXIONS[0],
                 education=EDUCATION_LEVELS[3], employment=EMPLOYMENT_TYPES[3],
                 income=INCOME_RANGES[3], height=185, weight=85,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[0],
                 family_financial=FAMILY_FINANCIAL[3], visibility=VISIBILITIES[0],
                 birth_time=None, hobbies=HOBBIES_POOL[7:12], languages=LANGUAGES_POOL[0:5]),
            # idx=4 male
            dict(rashi=male_rashis[4], gotra=GOTRAS[4], nakshatra=NAKSHATRAS[4],
                 manglik=ManglikStatus.no, diet=Diet.non_vegetarian,
                 body_type=BODY_TYPES[0], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[4], employment=EMPLOYMENT_TYPES[4],
                 income=INCOME_RANGES[4], height=172, weight=68,
                 smoke=ACTIVITY_LEVELS[2], drink=ACTIVITY_LEVELS[2], activity=ACTIVITY_LEVELS[0],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[1],
                 family_financial=FAMILY_FINANCIAL[0], visibility=VISIBILITIES[1],
                 birth_time="06:00 PM", hobbies=HOBBIES_POOL[:5], languages=LANGUAGES_POOL[3:7]),
            # idx=5 male
            dict(rashi=male_rashis[5], gotra=GOTRAS[5], nakshatra=NAKSHATRAS[5],
                 manglik=ManglikStatus.yes, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[1], complexion=COMPLEXIONS[2],
                 education=EDUCATION_LEVELS[5], employment=EMPLOYMENT_TYPES[4],
                 income=INCOME_RANGES[5], height=178, weight=75,
                 smoke=ACTIVITY_LEVELS[1], drink=ACTIVITY_LEVELS[1], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[2],
                 family_financial=FAMILY_FINANCIAL[1], visibility=VISIBILITIES[0],
                 birth_time="09:30 AM", hobbies=HOBBIES_POOL[4:9], languages=LANGUAGES_POOL[2:5]),
            # idx=6 male
            dict(rashi=male_rashis[6], gotra=GOTRAS[6], nakshatra=NAKSHATRAS[6],
                 manglik=ManglikStatus.partial, diet=Diet.eggetarian,
                 body_type=BODY_TYPES[2], complexion=COMPLEXIONS[0],
                 education=EDUCATION_LEVELS[6], employment=EMPLOYMENT_TYPES[0],
                 income=INCOME_RANGES[0], height=160, weight=55,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[2], activity=ACTIVITY_LEVELS[1],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[0],
                 family_financial=FAMILY_FINANCIAL[2], visibility=VISIBILITIES[2],
                 birth_time="12:00 PM", hobbies=HOBBIES_POOL[9:14], languages=LANGUAGES_POOL[4:8]),
            # idx=7 male
            dict(rashi=male_rashis[7], gotra=GOTRAS[7], nakshatra=NAKSHATRAS[7],
                 manglik=ManglikStatus.dont_know, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[3], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[0], employment=EMPLOYMENT_TYPES[1],
                 income=INCOME_RANGES[1], height=190, weight=95,
                 smoke=ACTIVITY_LEVELS[2], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[0],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[1],
                 family_financial=FAMILY_FINANCIAL[3], visibility=VISIBILITIES[1],
                 birth_time="05:45 PM", hobbies=HOBBIES_POOL[1:6], languages=LANGUAGES_POOL[0:4]),
            # idx=8 male
            dict(rashi=male_rashis[8], gotra=GOTRAS[8], nakshatra=NAKSHATRAS[8],
                 manglik=ManglikStatus.no, diet=Diet.non_vegetarian,
                 body_type=BODY_TYPES[0], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[1], employment=EMPLOYMENT_TYPES[2],
                 income=INCOME_RANGES[2], height=170, weight=65,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[1], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[2],
                 family_financial=FAMILY_FINANCIAL[0], visibility=VISIBILITIES[0],
                 birth_time="07:30 PM", hobbies=HOBBIES_POOL[6:11], languages=LANGUAGES_POOL[1:5]),
            # idx=9 male
            dict(rashi=male_rashis[9], gotra=GOTRAS[9], nakshatra=NAKSHATRAS[9],
                 manglik=ManglikStatus.yes, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[1], complexion=COMPLEXIONS[2],
                 education=EDUCATION_LEVELS[2], employment=EMPLOYMENT_TYPES[3],
                 income=INCOME_RANGES[3], height=165, weight=58,
                 smoke=ACTIVITY_LEVELS[1], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[1],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[0],
                 family_financial=FAMILY_FINANCIAL[1], visibility=VISIBILITIES[2],
                 birth_time="10:00 AM", hobbies=HOBBIES_POOL[3:8], languages=LANGUAGES_POOL[2:6]),

            # idx=0 female
            dict(rashi=female_rashis[0], gotra=GOTRAS[10], nakshatra=NAKSHATRAS[10],
                 manglik=ManglikStatus.no, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[1], complexion=COMPLEXIONS[0],
                 education=EDUCATION_LEVELS[4], employment=EMPLOYMENT_TYPES[4],
                 income=INCOME_RANGES[4], height=158, weight=52,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[1],
                 family_financial=FAMILY_FINANCIAL[2], visibility=VISIBILITIES[0],
                 birth_time="03:15 PM", hobbies=HOBBIES_POOL[8:13], languages=LANGUAGES_POOL[3:7]),
            # idx=1 female
            dict(rashi=female_rashis[1], gotra=GOTRAS[11], nakshatra=NAKSHATRAS[11],
                 manglik=ManglikStatus.yes, diet=Diet.non_vegetarian,
                 body_type=BODY_TYPES[2], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[5], employment=EMPLOYMENT_TYPES[0],
                 income=INCOME_RANGES[5], height=162, weight=55,
                 smoke=ACTIVITY_LEVELS[1], drink=ACTIVITY_LEVELS[2], activity=ACTIVITY_LEVELS[0],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[2],
                 family_financial=FAMILY_FINANCIAL[3], visibility=VISIBILITIES[1],
                 birth_time="01:00 PM", hobbies=HOBBIES_POOL[0:4], languages=LANGUAGES_POOL[0:4]),
            # idx=2 female
            dict(rashi=female_rashis[2], gotra=GOTRAS[12], nakshatra=NAKSHATRAS[12],
                 manglik=ManglikStatus.partial, diet=Diet.eggetarian,
                 body_type=BODY_TYPES[3], complexion=COMPLEXIONS[2],
                 education=EDUCATION_LEVELS[0], employment=EMPLOYMENT_TYPES[1],
                 income=INCOME_RANGES[0], height=165, weight=58,
                 smoke=ACTIVITY_LEVELS[2], drink=ACTIVITY_LEVELS[1], activity=ACTIVITY_LEVELS[1],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[0],
                 family_financial=FAMILY_FINANCIAL[0], visibility=VISIBILITIES[2],
                 birth_time="08:45 AM", hobbies=HOBBIES_POOL[4:9], languages=LANGUAGES_POOL[1:5]),
            # idx=3 female
            dict(rashi=female_rashis[3], gotra=GOTRAS[13], nakshatra=NAKSHATRAS[13],
                 manglik=ManglikStatus.dont_know, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[0], complexion=COMPLEXIONS[0],
                 education=EDUCATION_LEVELS[1], employment=EMPLOYMENT_TYPES[2],
                 income=INCOME_RANGES[1], height=170, weight=63,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[1],
                 family_financial=FAMILY_FINANCIAL[1], visibility=VISIBILITIES[0],
                 birth_time=None, hobbies=HOBBIES_POOL[6:11], languages=LANGUAGES_POOL[2:6]),
            # idx=4 female
            dict(rashi=female_rashis[4], gotra=GOTRAS[14], nakshatra=NAKSHATRAS[14],
                 manglik=ManglikStatus.no, diet=Diet.non_vegetarian,
                 body_type=BODY_TYPES[1], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[2], employment=EMPLOYMENT_TYPES[3],
                 income=INCOME_RANGES[2], height=155, weight=48,
                 smoke=ACTIVITY_LEVELS[1], drink=ACTIVITY_LEVELS[1], activity=ACTIVITY_LEVELS[0],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[2],
                 family_financial=FAMILY_FINANCIAL[2], visibility=VISIBILITIES[1],
                 birth_time="11:30 AM", hobbies=HOBBIES_POOL[2:7], languages=LANGUAGES_POOL[3:7]),
            # idx=5 female
            dict(rashi=female_rashis[5], gotra=GOTRAS[15], nakshatra=NAKSHATRAS[15],
                 manglik=ManglikStatus.yes, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[2], complexion=COMPLEXIONS[0],
                 education=EDUCATION_LEVELS[3], employment=EMPLOYMENT_TYPES[4],
                 income=INCOME_RANGES[3], height=168, weight=60,
                 smoke=ACTIVITY_LEVELS[2], drink=ACTIVITY_LEVELS[2], activity=ACTIVITY_LEVELS[1],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[0],
                 family_financial=FAMILY_FINANCIAL[3], visibility=VISIBILITIES[0],
                 birth_time="04:00 PM", hobbies=HOBBIES_POOL[9:14], languages=LANGUAGES_POOL[4:8]),
            # idx=6 female
            dict(rashi=female_rashis[6], gotra=GOTRAS[0], nakshatra=NAKSHATRAS[16],
                 manglik=ManglikStatus.partial, diet=Diet.eggetarian,
                 body_type=BODY_TYPES[3], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[4], employment=EMPLOYMENT_TYPES[0],
                 income=INCOME_RANGES[4], height=163, weight=56,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[1],
                 family_financial=FAMILY_FINANCIAL[0], visibility=VISIBILITIES[2],
                 birth_time="07:15 AM", hobbies=HOBBIES_POOL[0:5], languages=LANGUAGES_POOL[0:4]),
            # idx=7 female
            dict(rashi=female_rashis[7], gotra=GOTRAS[1], nakshatra=NAKSHATRAS[17],
                 manglik=ManglikStatus.dont_know, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[0], complexion=COMPLEXIONS[2],
                 education=EDUCATION_LEVELS[5], employment=EMPLOYMENT_TYPES[1],
                 income=INCOME_RANGES[5], height=175, weight=70,
                 smoke=ACTIVITY_LEVELS[1], drink=ACTIVITY_LEVELS[1], activity=ACTIVITY_LEVELS[0],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[2],
                 family_financial=FAMILY_FINANCIAL[1], visibility=VISIBILITIES[1],
                 birth_time="09:00 AM", hobbies=HOBBIES_POOL[5:10], languages=LANGUAGES_POOL[1:5]),
            # idx=8 female
            dict(rashi=female_rashis[8], gotra=GOTRAS[2], nakshatra=NAKSHATRAS[18],
                 manglik=ManglikStatus.no, diet=Diet.non_vegetarian,
                 body_type=BODY_TYPES[1], complexion=COMPLEXIONS[0],
                 education=EDUCATION_LEVELS[0], employment=EMPLOYMENT_TYPES[2],
                 income=INCOME_RANGES[0], height=160, weight=50,
                 smoke=ACTIVITY_LEVELS[2], drink=ACTIVITY_LEVELS[0], activity=ACTIVITY_LEVELS[1],
                 family_type=FAMILY_TYPES[0], family_values=FAMILY_VALUES[0],
                 family_financial=FAMILY_FINANCIAL[2], visibility=VISIBILITIES[0],
                 birth_time="06:30 PM", hobbies=HOBBIES_POOL[7:12], languages=LANGUAGES_POOL[2:6]),
            # idx=9 female
            dict(rashi=female_rashis[9], gotra=GOTRAS[3], nakshatra=NAKSHATRAS[19],
                 manglik=ManglikStatus.yes, diet=Diet.vegetarian,
                 body_type=BODY_TYPES[2], complexion=COMPLEXIONS[1],
                 education=EDUCATION_LEVELS[1], employment=EMPLOYMENT_TYPES[3],
                 income=INCOME_RANGES[1], height=167, weight=62,
                 smoke=ACTIVITY_LEVELS[0], drink=ACTIVITY_LEVELS[2], activity=ACTIVITY_LEVELS[2],
                 family_type=FAMILY_TYPES[1], family_values=FAMILY_VALUES[1],
                 family_financial=FAMILY_FINANCIAL[3], visibility=VISIBILITIES[2],
                 birth_time="02:00 PM", hobbies=HOBBIES_POOL[3:8], languages=LANGUAGES_POOL[3:7]),
        ]

        # Build matrimony profiles
        matrimony_list = []
        for i, (user, profile) in enumerate(males):
            vals = seed_values[i].copy()
            vals["hobbies"] = vals["hobbies"][:]
            vals["languages"] = vals["languages"][:]
            mp = make_matrimony(profile, idx=i, **vals)
            matrimony_list.append(mp)
            session.add(mp)

        for i, (user, profile) in enumerate(females):
            vals = seed_values[10 + i].copy()
            vals["hobbies"] = vals["hobbies"][:]
            vals["languages"] = vals["languages"][:]
            mp = make_matrimony(profile, idx=i, **vals)
            matrimony_list.append(mp)
            session.add(mp)

        await session.flush()
        print(f"  ✓ Created {len(matrimony_list)} matrimony profiles")

        # ── Matrimony Preferences ──────────────────────────
        # Give preferences to 14 (7 male + 7 female), leave 6 without
        preference_configs = [
            # (rashi list, gotra list, diet list, manglik)
            (["aries", "taurus", "leo"], ["Kashyapa", "Bharadwaja"], ["vegetarian"], "no"),
            (["virgo", "libra"], ["Vashishta", "Vishwamitra"], ["vegetarian", "eggetarian"], "any"),
            (None, ["Atri", "Gautama"], ["vegetarian"], "no"),
            (["sagittarius", "capricorn"], None, None, "any"),
            (["gemini", "cancer", "scorpio"], ["Kaushika", "Angira"], ["non_vegetarian", "eggetarian"], "yes"),
            (["leo", "virgo", "libra"], ["Shandilya", "Parasara"], None, "any"),
            (["pisces", "aquarius"], None, ["vegetarian"], "no"),
        ]

        for i, (_, profile) in enumerate(males[:7]):
            sr, sg, sd, mang = preference_configs[i]
            pref = make_preferences(profile, sr, sr, sg, sg, sd, sd, mang)
            session.add(pref)

        for i, (_, profile) in enumerate(females[:7]):
            sr, sg, sd, mang = preference_configs[i]
            pref = make_preferences(profile, sr, sr, sg, sg, sd, sd, mang)
            session.add(pref)

        await session.flush()
        print("  ✓ Created 14 matrimony preference records (7M + 7F)")

        await session.commit()
        print()
        print("=" * 60)
        print("  ✅ Seeded 20 matrimony-eligible profiles successfully!")
        print()
        print("  🔑 Login credentials (all use same password):")
        print(f"     Password: {SEED_PASSWORD}")
        print()
        print("  👤 Male profiles:")
        for user, profile in males:
            print(f"     {user.email}")
        print()
        print("  👤 Female profiles:")
        for user, profile in females:
            print(f"     {user.email}")
        print()
        print("  📋 Coverage summary:")
        print("     - 10 male (all single, active membership, opted-in matrimony)")
        print("     - 10 female (all single, active membership, opted-in matrimony)")
        print("     - 12 of 12 rashis covered")
        print("     - 16 gotras used")
        print("     - 20 nakshatras used")
        print("     - All manglik statuses covered")
        print("     - All diet types covered")
        print("     - All body types & complexions covered")
        print("     - All education levels covered")
        print("     - All employment types covered")
        print("     - 5 of 6 income ranges (excluding prefer_not_to_say)")
        print("     - All family types, values, financial statuses")
        print("     - 2 profiles without birth_time (null edge case)")
        print("     - 14 with preferences, 6 without")
        print("     - All visibility levels covered")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed())
