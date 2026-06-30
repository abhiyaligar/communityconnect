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
