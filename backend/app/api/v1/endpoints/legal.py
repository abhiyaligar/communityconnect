"""
CommunityConnect Backend — Legal Document Endpoints

Routes (prefix: /api/v1/legal):
  GET    /terms                          Return the Terms & Conditions document
  GET    /nda                            Return the NDA document
  POST   /accept                         Accept Terms & Conditions and/or NDA
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.setting import Setting

router = APIRouter()

TERMS_KEY = "terms_and_conditions"
NDA_KEY = "nda"

TERMS_DEFAULT = """# Terms & Conditions

## 1. Acceptance of Terms
By accessing and using this platform, you agree to be bound by these Terms & Conditions.

## 2. Platform Purpose — Matrimonial Site Only
This is a **matrimonial platform** designed exclusively for individuals seeking serious matrimonial alliances. It is **not a dating site**. Users are expected to use this platform solely for the purpose of finding a life partner. Any use of the platform for casual dating, hookups, or non-matrimonial purposes is strictly prohibited and will result in immediate account termination.

## 3. User Eligibility
You must be at least 18 years of age to use this service. By registering, you confirm that you meet this requirement.

## 4. Account Registration
You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Your IP address is recorded at the time of account creation for security and compliance purposes.

## 5. User Conduct
You agree not to:
- Provide false or misleading information
- Harass, abuse, or harm other users
- Use the platform for any unlawful purpose
- Share inappropriate or offensive content
- Create fake accounts or impersonate others
- Use the platform for dating, casual relationships, or any non-matrimonial purpose

## 6. No Verification of User Claims
The platform does **not independently verify, validate, or guarantee** any information, claims, or representations made by users unless specifically stated otherwise. Users are responsible for conducting their own due diligence before entering into any matrimonial arrangement. The platform acts solely as a medium for connection and does not endorse any user profile.

## 7. Voluntary Consent & Data Collection (DPDP Act, 2023)
You voluntarily consent to the collection, storage, verification, and processing of your personal information including but not limited to identity documents, photographs, contact details, family information, and matrimonial preferences as per the **Digital Personal Data Protection Act, 2023 (DPDP Act)**. Any abnormality, inconsistency, or false information found during verification may result in immediate rejection of your account without notice.

## 8. Privacy
Your personal data is handled in accordance with the DPDP Act, 2023. We implement reasonable security safeguards to protect your data.

## 9. Limitation of Liability
The platform is provided "as is" without warranties of any kind. The platform is not responsible for any outcomes, decisions, or consequences arising from connections made through this service, including but not limited to matrimonial alliances, financial arrangements, or personal interactions.

## 10. Account Termination
We reserve the right to suspend or terminate accounts without prior notice for:
- Fake or fraudulent profiles
- Using the platform for dating or non-matrimonial purposes
- Harassment or abusive behavior towards other users
- Misuse of the platform or its features
- Violation of any terms herein
- Providing false information during registration or verification

## 11. Grievance Officer
For any complaints, grievances, or inquiries regarding your data or this platform, please contact:

**Grievance Officer:**  
Email: grievance@ladmatrimony.in  
Address: Lad Matrimony, Bengaluru, Karnataka, India  
Response Time: Within 24 hours of receipt

## 12. Modifications
We reserve the right to modify these terms at any time. Users will be notified of material changes via email or platform notification.

*Last updated: July 2026*
"""

NDA_DEFAULT = """# Non-Disclosure Agreement (NDA)

## 1. Definition of Confidential Information
Confidential Information includes all personal data, family details, contact information, photographs, financial information, and any other data shared through this platform.

## 2. Obligations of the Receiving Party
You agree to:
- Maintain strict confidentiality of all information accessed
- Not share, distribute, or disclose any information to third parties
- Use the information solely for matrimonial connection purposes
- Not screenshot, record, or store information outside the platform

## 3. Permitted Disclosures
You may disclose information only:
- To immediate family members involved in the matrimonial decision
- When required by law

## 4. Duration
This agreement remains in effect indefinitely, even after account termination.

## 5. Breach Consequences
Any breach of this NDA may result in:
- Immediate account suspension or termination
- Legal action seeking damages
- Reporting to relevant authorities under applicable laws including the DPDP Act, 2023

## 6. Data Retention
Your confidential information will be retained as long as your account is active or as required by law. Upon account termination, data will be deleted within 90 days unless required for legal compliance.

## 7. Governing Law
This agreement shall be governed by the laws of India, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.

*By accepting, you acknowledge that you have read, understood, and agree to be bound by this NDA.*

*Last updated: July 2026*
"""


def _get_content(key: str, default: str) -> str:
    return default


@router.get("/terms")
async def get_terms():
    return {"content": _get_content(TERMS_KEY, TERMS_DEFAULT), "title": "Terms & Conditions"}


@router.get("/nda")
async def get_nda():
    return {"content": _get_content(NDA_KEY, NDA_DEFAULT), "title": "Non-Disclosure Agreement"}


@router.post("/accept", status_code=status.HTTP_200_OK)
async def accept_agreements(
    accept_terms: bool = False,
    accept_nda: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    if accept_terms:
        current_user.terms_accepted_at = now
    if accept_nda:
        current_user.nda_accepted_at = now

    if not accept_terms and not accept_nda:
        raise HTTPException(status_code=400, detail="Specify at least one agreement to accept.")

    await db.commit()
    await db.refresh(current_user)
    return {
        "message": "Agreements accepted successfully.",
        "terms_accepted_at": current_user.terms_accepted_at.isoformat() if current_user.terms_accepted_at else None,
        "nda_accepted_at": current_user.nda_accepted_at.isoformat() if current_user.nda_accepted_at else None,
    }


@router.get("/status")
async def get_agreement_status(
    current_user: User = Depends(get_current_user),
):
    return {
        "terms_accepted": current_user.terms_accepted_at is not None,
        "terms_accepted_at": current_user.terms_accepted_at.isoformat() if current_user.terms_accepted_at else None,
        "nda_accepted": current_user.nda_accepted_at is not None,
        "nda_accepted_at": current_user.nda_accepted_at.isoformat() if current_user.nda_accepted_at else None,
    }
