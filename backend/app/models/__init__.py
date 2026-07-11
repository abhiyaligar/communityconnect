# CommunityConnect Backend Models Package

from app.models.enums import UserRole, VerificationStatus, Gender, MaritalStatus, ConnectionRequestStatus
from app.models.user import User
from app.models.region import AdminRegion, LocalAdminRegion
from app.models.family import FamilyUnit
from app.models.profile import Profile
from app.models.verification import VerificationRequest, VerificationApproval
from app.models.matrimony import MatrimonyProfile, ConnectionRequest, GuardianRecommendation
from app.models.memorial import MemorialRecord
from app.models.audit import AuditLog
from app.models.email_verification import EmailVerification
from app.models.interaction import ProfileLike, ProfileDislike
from app.models.chat import ChatMessage
from app.models.suggestion import Suggestion, SuggestionType

__all__ = [
    "UserRole",
    "VerificationStatus",
    "Gender",
    "MaritalStatus",
    "ConnectionRequestStatus",
    "User",
    "AdminRegion",
    "LocalAdminRegion",
    "FamilyUnit",
    "Profile",
    "VerificationRequest",
    "VerificationApproval",
    "MatrimonyProfile",
    "ConnectionRequest",
    "MemorialRecord",
    "AuditLog",
    "EmailVerification",
    "ProfileLike",
    "ProfileDislike",
    "GuardianRecommendation",
    "ChatMessage",
    "Suggestion",
    "SuggestionType",
]

