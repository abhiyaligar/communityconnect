import enum

class UserRole(str, enum.Enum):
    community_admin = "community_admin"
    local_admin = "local_admin"
    verified_adult = "verified_adult"
    minor = "minor"
    unverified = "unverified"

class VerificationStatus(str, enum.Enum):
    pending = "pending"
    local_approved = "local_approved"
    local_rejected = "local_rejected"
    approved = "approved"
    rejected = "rejected"
    escalated = "escalated"

class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class MaritalStatus(str, enum.Enum):
    single = "single"
    married = "married"
    divorced = "divorced"
    widowed = "widowed"

class ConnectionRequestStatus(str, enum.Enum):
    pending_self_approval = "pending_self_approval"
    pending_family_approval = "pending_family_approval"
    approved = "approved"
    declined_by_self = "declined_by_self"
    declined_by_family = "declined_by_family"
    revoked = "revoked"

class BodyType(str, enum.Enum):
    slim = "slim"
    average = "average"
    athletic = "athletic"
    heavy = "heavy"

class Complexion(str, enum.Enum):
    fair = "fair"
    wheatish = "wheatish"
    dark = "dark"

class EducationLevel(str, enum.Enum):
    tenth = "10th"
    twelfth = "12th"
    diploma = "diploma"
    bachelors = "bachelors"
    masters = "masters"
    phd = "phd"
    other = "other"

class EmploymentType(str, enum.Enum):
    employed = "employed"
    self_employed = "self_employed"
    business = "business"
    student = "student"
    not_working = "not_working"

class IncomeRange(str, enum.Enum):
    below_2l = "below_2l"
    from_2_to_5l = "2_5l"
    from_5_to_10l = "5_10l"
    from_10_to_20l = "10_20l"
    above_20l = "above_20l"
    prefer_not_to_say = "prefer_not_to_say"

class Rashi(str, enum.Enum):
    aries = "aries"
    taurus = "taurus"
    gemini = "gemini"
    cancer = "cancer"
    leo = "leo"
    virgo = "virgo"
    libra = "libra"
    scorpio = "scorpio"
    sagittarius = "sagittarius"
    capricorn = "capricorn"
    aquarius = "aquarius"
    pisces = "pisces"

class ManglikStatus(str, enum.Enum):
    yes = "yes"
    no = "no"
    partial = "partial"
    dont_know = "dont_know"

class Diet(str, enum.Enum):
    vegetarian = "vegetarian"
    non_vegetarian = "non_vegetarian"
    eggetarian = "eggetarian"

class ActivityLevel(str, enum.Enum):
    no = "no"
    occasionally = "occasionally"
    yes = "yes"

class ProfileVisibility(str, enum.Enum):
    all_verified = "all_verified"
    gotra_only = "gotra_only"
    paused = "paused"
