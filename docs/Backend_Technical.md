# Backend Technical Document: Community Registry & Matrimonial Platform

This document outlines the backend architecture, module breakdown, system designs, database schemas, security workflows, and deployment infrastructure for the CommunityConnect backend. The application is built using FastAPI (Python) with an asynchronous PostgreSQL database, Alembic for database migrations, JWT with OTP-based phone authentication, and role-based access controls (RBAC).

---

## 1. System Architecture Overview

The backend uses a standard three-tier architecture: Presentation (API Routes), Business Logic (Services), and Data Access (SQLAlchemy ORM + asyncpg). It leverages Redis for rate limiting and cache management, and GCP Cloud Storage for storing user media.

### 1.1 Architecture Components Diagram

The diagram below represents the system's request-response lifecycle and boundary interactions:

```mermaid
graph TD
    ClientApp[Client App React/Mobile] -->|HTTPS Requests| CORS[CORS Middleware]
    CORS --> RateLimiter[Rate Limiting Middleware slowapi/Redis]
    RateLimiter --> AuthMiddleware[JWT Auth Middleware]
    AuthMiddleware --> Router[FastAPI APIRouter]
    Router --> DependencyInjection[Dependency Injection / DB Session yield]
    DependencyInjection --> Services[Service Layer / Business Logic]
    Services --> Transactions[SQLAlchemy AsyncSession / Unit of Work]
    Transactions --> Database[(PostgreSQL Database)]
    Services --> GCPStorage[GCP Cloud Storage Client]
    Services --> SMSService[SMS Gateway MSG91/Twilio]
    Services --> TaskQueue[FastAPI BackgroundTasks / Celery Worker]
    TaskQueue --> Database
```

### 1.2 Component Responsibilities

1. **Client Application**: The front-end React interface interacting with versioned REST API endpoints.
2. **CORS Middleware**: Restricts incoming requests to whitelisted domains configured in settings.
3. **Rate Limiting Middleware**: Protects OTP-generating endpoints and critical write routes using a sliding-window algorithm backed by Redis.
4. **Auth Middleware**: Inspects the `Authorization: Bearer <token>` header, decodes the JWT, validates claims, checks database blacklist, and embeds the authenticated user identity in the request's context (`request.state.user`).
5. **FastAPI APIRouter**: Dispatches endpoints scoped under `/api/v1/` to corresponding controllers.
6. **Dependency Injection**: Resolves request dependencies, specifically opening and closing async database sessions (`AsyncSession`) per request lifecycle.
7. **Service Layer**: House of all transactional business logic, preventing routes from executing ORM queries or direct mutations.
8. **SQLAlchemy & asyncpg**: The asynchronous Object Relational Mapper and database driver communicating with the PostgreSQL database.
9. **GCP Cloud Storage**: Offloads media file serving and ensures security through public/private bucket layouts and time-limited signed URLs.
10. **SMS Gateway (MSG91/Twilio)**: Handles outbound delivery of one-time password messages to mobile numbers.
11. **Background Tasks**: Offloads long-running procedures (e.g., cron jobs, notification triggers, dual-access unlocking) to avoid blocking the HTTP request thread.

---

## 2. Project Directory Structure

The project follows a modular and clean architecture layout. All codebase files reside in `backend/app/` structured as follows:

```
backend/
├── alembic/                          # Alembic database migration scripts
├── alembic.ini                       # Alembic migration engine configuration
├── requirements.txt                  # Python dependencies
└── app/
    ├── __init__.py                   # Package initialization
    ├── main.py                       # Application entrypoint & Middleware stack
    ├── api/
    │   ├── __init__.py
    │   └── v1/
    │       ├── __init__.py
    │       ├── router.py             # Root APIRouter combining sub-routers
    │       └── endpoints/
    │           ├── __init__.py
    │           ├── health.py         # App health-checks & system heartbeats
    │           ├── auth.py           # OTP requests, validations, JWT generation, & logout
    │           ├── users.py          # Profiles, updates, minor creation, & account claiming
    │           ├── family.py         # Family unit management, head assignments, & co-approvers
    │           ├── verification.py   # State machine transitions & admin decisions
    │           ├── matrimony.py      # Matrimony opt-ins, browse feed, & connection states
    │           ├── admin.py          # Dashboard analytics, regional scope config, & peer audits
    │           └── memorial.py       # Archiving profiles, death validation, & obituaries
    ├── core/
    │   ├── __init__.py
    │   ├── config.py                 # App environment configurations (Pydantic BaseSettings)
    │   ├── security.py               # Password hashing, JWT claims signing/decoding
    │   ├── middleware.py             # Custom rate limiting, audit logs, & exception filters
    │   └── exceptions.py             # Domain-specific custom app exception classes
    ├── db/
    │   ├── __init__.py
    │   ├── base.py                   # Central importing of all models for Alembic autogen
    │   └── session.py                # Database connection pool setup & AsyncSession builder
    ├── models/
    │   ├── __init__.py
    │   ├── user.py                   # Authentication identities, roles, & statuses
    │   ├── profile.py                # Registry demographics & details
    │   ├── family.py                 # FamilyUnit representation
    │   ├── admin.py                  # AdminRegion, local_admin_regions, & peer approvals
    │   ├── verification.py           # VerificationRequest & multi-party logs
    │   ├── matrimony.py              # MatrimonyProfile & ConnectionRequest entities
    │   ├── memorial.py               # MemorialRecord details
    │   ├── otp.py                    # OtpToken tracking
    │   └── audit.py                  # AuditLog representation
    ├── schemas/
    │   ├── __init__.py
    │   ├── auth.py                   # Pydantic models for OTP & login tokens
    │   ├── user.py                   # Pydantic schemas for registry profiles
    │   ├── family.py                 # Pydantic schemas for family configurations
    │   ├── verification.py           # Pydantic schemas for verification states
    │   ├── matrimony.py              # Pydantic schemas for matchmaking
    │   ├── admin.py                  # Pydantic schemas for regional configurations
    │   └── memorial.py               # Pydantic schemas for memorial records
    └── services/
        ├── __init__.py
        ├── auth.py                   # Core logic for tokens, login, & logout
        ├── user.py                   # Logic for profiles, self vs head priority, & dual access
        ├── family.py                 # Logic for family groups & head assignments
        ├── verification.py           # Logic for state machine & regional workflows
        ├── matrimony.py              # Logic for connection requests & double approval state
        ├── admin.py                  # Logic for dashboards, auditing, & peer verifications
        ├── memorial.py               # Logic for death archiving and memorials
        ├── gcp_storage.py            # GCP photo uploading & signed URL generation
        └── background_jobs.py        # Cron routines (18+ check, OTP cleanup)
```

---

## 3. Authentication & Authorization Flow

### 3.1 OTP Phone Verification Workflow

Authentication is entirely passwordless via OTP-based SMS verification. Password authentication can be optionally set up for admins or claimed adult profiles, but phone verification remains the primary identity verification channel.

#### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    ClientApp ->> FastAPI: POST /auth/otp/send { phone_number, action_type }
    FastAPI ->> RateLimiter: Check throttling limit
    RateLimiter -->> FastAPI: Allow / Deny
    FastAPI ->> Database: Check active OTP for phone_number
    FastAPI ->> Security: Generate random 6-digit code
    FastAPI ->> Database: Save hashed OTP code (expires in 5 minutes)
    FastAPI ->> SMS Gateway: Dispatch code via SMS
    SMS Gateway -->> ClientApp: Deliver SMS OTP code
    ClientApp ->> FastAPI: POST /auth/otp/verify { phone_number, code }
    FastAPI ->> Database: Retrieve active OTP record
    Note over FastAPI, Database: Hash inputs to compare
    alt Code matches & Expire > now
        FastAPI ->> Database: Mark OTP as verified
        FastAPI ->> Database: Find or Create User by phone_number
        FastAPI ->> Security: Sign Access Token (30m) & Refresh Token (30d)
        FastAPI ->> Database: Save Refresh Token JTI
        FastAPI -->> ClientApp: HTTP 200 { access_token, refresh_token, role, user_status }
    else Code mismatch / Expired / Attempts >= 5
        FastAPI ->> Database: Increment attempts / Invalidate OTP if attempts limit met
        FastAPI -->> ClientApp: HTTP 400 Validation/OTP Error
    end
```

#### OTP Rules and Throttling
1. **Window limit**: Max 3 OTP requests per phone number within a rolling 15-minute window.
2. **Attempt limit**: Max 5 incorrect code verification attempts per OTP. On the 5th incorrect attempt, the OTP token record is immediately set to expired (`expires_at = current_timestamp`).
3. **Expiry duration**: OTPs are valid for exactly 5 minutes (300 seconds) from generation.
4. **Hashing**: OTP codes are hashed via SHA-256 before storage to protect against DB leaks.
5. **Simulated Mode / Mock Bypass Code**: When `SMS_PROVIDER` is set to `mock` in `backend/.env`, OTP dispatches are printed to the server terminal/console. Additionally, a master bypass code of `123456` is automatically accepted for any phone number to simplify manual testing and verification.

### 3.2 JWT Token Architecture
Upon verification, the system returns two JWT tokens:

*   **Access Token**: Short-lived (30 minutes) used for API authorization. Passed via HTTP `Authorization: Bearer <access_token>` headers.
*   **Refresh Token**: Long-lived (30 days) used to fetch new access tokens without re-verifying phone numbers. Stored in database (`refresh_tokens` or registered in token table) for auditability and revocation. On token reuse detection, all tokens derived from that family are revoked immediately (Token Rotation).

#### JWT Payload Claims (Claims Schema)
```json
{
  "sub": "user_id_uuid_or_integer",
  "role": "MEMBER_SELF",
  "phone_number": "+919876543210",
  "is_verified": true,
  "jti": "unique_jwt_identifier_uuid",
  "exp": 1782845968
}
```

### 3.3 Role-Based Access Control (RBAC)
The system distinguishes six core roles mapping to specific system privileges. Roles are represented in the database as an Enum and stored in the User record.

#### Role Definition Hierarchy

| Role | Database Enum Value | Privileges & Boundaries |
| :--- | :--- | :--- |
| **Community Admin** | `SUPER_ADMIN` | Root level. Full write/read. Resolves escalated verification disputes. Peer-verifies Local Admins. |
| **Local Admin** | `LOCAL_ADMIN` | Regional scoping. Reviews verification requests in assigned region. Peer-verifies other Local Admins. |
| **Family Head** | `FAMILY_HEAD` | Manages profiles of the family unit, creates/edits profiles for minor family members, approves minor data, co-approves matrimonial connection requests. |
| **Self (Verified Adult)** | `MEMBER_SELF` | Full access to own registry details, self-edit priority, opts into the matrimonial module, controls double-approval settings. |
| **Minor** | `MEMBER_MINOR` | View-only registry access. No edit rights. No connection requests. Matrimonial module locked. |
| **Unverified User** | `UNVERIFIED` | Logged-in state with no access to search registry, browse matrimony, or update profiles (except submitting their own initial verification request). |

#### Dependency Enforcement
RBAC is enforced programmatically using FastAPI dependencies:

```python
# app/core/security.py
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)):
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account role does not have permission to execute this operation."
            )
        return current_user
```

Example endpoint declaration:
```python
@router.post("/regions", dependencies=[Depends(RoleChecker(["SUPER_ADMIN"]))])
async def create_region(region_data: RegionCreate, db: AsyncSession = Depends(get_db)):
    ...
```

---

## 4. Middleware Stack

The FastAPI middleware stack runs on every request in the following order:

```
[Incoming Request]
       │
       ▼
 1. CORS Middleware (Domain validation)
       │
       ▼
 2. Rate Limiting Middleware (slowapi - Token bucket via Redis)
       │
       ▼
 3. Auth Context Middleware (Extract JWT -> Inject current user)
       │
       ▼
 4. Audit Log Middleware (Intercept mutations -> Log sensitive steps)
       │
       ▼
[Route Execution / Service Layer]
```

1.  **CORS Middleware**: Native FastAPI `CORSMiddleware` injected during app initialization. Restricts request origins, headers, and HTTP methods based on values configured in `.env`.
2.  **Rate Limiting Middleware**: Implemented using `slowapi` with Redis backing. Protects `/auth/otp/send` from SMS exhaustion attacks. Scoped dynamically:
    *   General registry browsing: 60 requests/minute per authenticated user.
    *   Matrimonial profiles search: 30 requests/minute per authenticated user.
    *   OTP Send: 3 requests per 15 minutes per phone number.
3.  **Auth Context Middleware**: Custom middleware intercepting requests to inject user authentication state. Parses token headers, performs DB active-checks, and maps ORM models to `request.state.user`.
4.  **Audit Log Middleware**: Logs structural changes made to registry records, state transitions on verification requests, or changes to admin permissions. Catches requests, records payload metadata, and saves results asynchronously to the `audit_logs` table.

---

## 5. Service Layer Pattern

To keep route handlers minimal and decouple API entrypoints from business workflows, the backend enforces a Service Layer pattern.

*   **Route Handlers** (Endpoints): Handle HTTP serialization/deserialization, validate inputs (Pydantic validation), parse API dependencies (auth context, database sessions), and dispatch to service methods. They contain **no database query execution logic**.
*   **Service Layer**: Houses core business logic. All database transactions, validation policies, third-party integrations, and state modifications are handled here. Services accept a database session and target arguments.

### Code Pattern Template

```python
# app/services/user.py
class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_profile(self, user_id: int, updater_id: int, update_data: ProfileUpdateSchema) -> Profile:
        # 1. Fetch user & associated profile
        user = await self.db.get(User, user_id)
        if not user or not user.profile:
            raise EntityNotFoundError("Profile not found")

        # 2. Authorization rule check: Self vs Family Head vs Admin
        if updater_id != user_id:
            updater = await self.db.get(User, updater_id)
            if updater.role == "FAMILY_HEAD":
                # If profile is already claimed and claimed user is active, Family Head edits are rejected.
                if user.role == "MEMBER_SELF" and user.is_active:
                    raise PermissionDeniedError("Cannot edit details of a claimed adult profile.")
            elif updater.role not in ["SUPER_ADMIN", "LOCAL_ADMIN"]:
                raise PermissionDeniedError("Unauthorized to edit this profile.")

        # 3. Perform fields updates
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(user.profile, field, value)

        await self.db.commit()
        await self.db.refresh(user.profile)
        return user.profile
```

---

## 6. Detailed Module Breakdown & Database Schemas

All schemas are mapped to SQLAlchemy ORM models inheriting from `Base`.

---

### 6.1 Authentication & Authorization Module

Manages passwordless verification tokens and user authentication states.

#### Database Table: `otp_tokens`
```sql
CREATE TABLE otp_tokens (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'LOGIN', 'SIGNUP', 'UPDATE_PHONE'
    attempts INTEGER DEFAULT 0 NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_otp_phone ON otp_tokens(phone_number, is_verified, expires_at);
```

#### API Endpoints
*   `POST /api/v1/auth/otp/send`: Generates 6-digit random code, hashes it, stores in DB, sends SMS via gateway.
*   `POST /api/v1/auth/otp/verify`: Validates code. If matching and valid, issues access/refresh tokens. Creates shell `User` record if signup.
*   `POST /api/v1/auth/token/refresh`: Accepts valid refresh token, rotates tokens, invalidates old refresh token.
*   `POST /api/v1/auth/logout`: Blacklists current JWT JTI in Redis or database table.

---

### 6.2 User / Profile Management Module

Manages verified registry data and handles self vs family head editing conflicts.

#### Database Table: `users`
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NULL, -- Optional password authentication for Admins
    role VARCHAR(20) DEFAULT 'UNVERIFIED' NOT NULL, -- 'SUPER_ADMIN', 'LOCAL_ADMIN', 'FAMILY_HEAD', 'MEMBER_SELF', 'MEMBER_MINOR', 'UNVERIFIED'
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Database Table: `profiles`
```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10) NOT NULL, -- 'MALE', 'FEMALE', 'OTHER'
    marital_status VARCHAR(15) NOT NULL, -- 'SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'
    profile_photo_url VARCHAR(255) NULL,
    address TEXT NOT NULL,
    region_id INTEGER, -- Linkage to AdminRegion
    family_unit_id INTEGER, -- Linkage to FamilyUnit
    is_deceased BOOLEAN DEFAULT FALSE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Conflict Resolution & Permissions
*   **Minor accounts**: Managed entirely by their associated Family Head. Cannot edit their profile.
*   **Adult Claimed accounts**: When a minor reaches 18, they can register credentials for their account. Once logged in, their role becomes `MEMBER_SELF`.
*   **Self-Edit Overrides Family Head**:
    *   If a profile is unclaimed (e.g. minor, or an elderly relative without a login), the Family Head has full edit access.
    *   If the user has claimed the profile (`role = MEMBER_SELF`), family heads can no longer mutate the fields. The API strictly blocks updates where the author is not `SUPER_ADMIN`, `LOCAL_ADMIN`, or the profile `user_id` itself.

---

### 6.3 Family Unit Management Module

Enables grouping of members into unified households and assigning co-approver delegation roles.

#### Database Table: `family_units`
```sql
CREATE TABLE family_units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    head_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Workflows & Rules
1.  **Creation**: Family Units are initialized by Local/Super Admins, or automatically when a self-registering user indicates they are the Family Head.
2.  **Minors**: Added directly into a Family Unit by the Family Head.
3.  **Head Assignment**: A Family Unit can have only one designated `head_user_id` at any time. When a new head is assigned, the old head is demoted to `MEMBER_SELF`.
4.  **Matrimony Co-Approver Selection**: When a family member configures double approval in the matrimony module, they select an adult verified member of their same `family_unit_id` as their co-approver.

---

### 6.4 Verification System Module

Controls state changes that unlock user access to search registry listings and submit connection requests.

#### Verification State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Account Created
    DRAFT --> SUBMITTED : User submits details & links family
    SUBMITTED --> PENDING_LOCAL_ADMIN : Region assigned automatically
    PENDING_LOCAL_ADMIN --> PENDING_FAMILY_CONFIRMATION : Local Admin approves linkage
    PENDING_FAMILY_CONFIRMATION --> PENDING_COMMUNITY_ADMIN : Family Head confirms linkage
    PENDING_LOCAL_ADMIN --> ESCALATED_TO_HEAD : Local Admins dispute / Admin flags profile
    PENDING_FAMILY_CONFIRMATION --> ESCALATED_TO_HEAD : Family head disputes linkage
    ESCALATED_TO_HEAD --> VERIFIED : Community Admin resolves & approves
    PENDING_COMMUNITY_ADMIN --> VERIFIED : Community Admin final approval
    PENDING_LOCAL_ADMIN --> REJECTED : Admin rejects
    ESCALATED_TO_HEAD --> REJECTED : Head rejects
```

#### Database Table: `admin_regions`
Defines regional assignments for Local Admins.
```sql
CREATE TABLE admin_regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NULL
);
```

#### Database Table: `local_admin_regions`
Maps local admins to regions. A local admin can cover multiple regions.
```sql
CREATE TABLE local_admin_regions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    region_id INTEGER REFERENCES admin_regions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, region_id)
);
```

#### Database Table: `verification_requests`
```sql
CREATE TABLE verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL, -- 'SUBMITTED', 'PENDING_LOCAL_ADMIN', 'PENDING_FAMILY_CONFIRMATION', 'PENDING_COMMUNITY_ADMIN', 'VERIFIED', 'REJECTED', 'ESCALATED'
    region_id INTEGER REFERENCES admin_regions(id) ON DELETE SET NULL,
    escalation_reason TEXT NULL,
    local_admin_decision VARCHAR(15) NULL, -- 'APPROVED', 'REJECTED'
    local_admin_id INTEGER REFERENCES users(id),
    family_head_decision VARCHAR(15) NULL, -- 'APPROVED', 'REJECTED'
    community_admin_decision VARCHAR(15) NULL, -- 'APPROVED', 'REJECTED'
    community_admin_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Multi-Party Peer Verification for Local Admins
To prevent rogue registrations, a Local Admin cannot self-verify or start verifying others without peer confirmation:
*   A newly proposed Local Admin remains in an inactive state (`is_active = FALSE`).
*   Requires registration of peer verifications from a minimum of **4 separate active Local Admins** or the root **Community Admin** to activate.

```sql
CREATE TABLE local_admin_peer_verifications (
    id SERIAL PRIMARY KEY,
    target_admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    verifying_admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(15) NOT NULL, -- 'APPROVED', 'REJECTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uniq_peer_verify UNIQUE(target_admin_id, verifying_admin_id)
);
```

---

### 6.5 Matrimonial Module

Provides a highly restricted opt-in matrimonial browsing feed based on Instagram's private-account model.

#### Database Table: `matrimony_profiles`
```sql
CREATE TABLE matrimony_profiles (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    is_opted_in BOOLEAN DEFAULT FALSE NOT NULL,
    education VARCHAR(100) NULL,
    occupation VARCHAR(100) NULL,
    income DECIMAL(12, 2) NULL,
    caste VARCHAR(50) NULL,
    sub_caste VARCHAR(50) NULL,
    expectations TEXT NULL,
    require_double_approval BOOLEAN DEFAULT FALSE NOT NULL,
    designated_co_approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Database Table: `connection_requests`
```sql
CREATE TABLE connection_requests (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) DEFAULT 'PENDING_RECEIVER' NOT NULL, -- 'PENDING_RECEIVER', 'PENDING_FAMILY', 'APPROVED', 'DECLINED', 'REVOKED'
    receiver_decision VARCHAR(15) NULL, -- 'APPROVED', 'DECLINED'
    family_decision VARCHAR(15) NULL, -- 'APPROVED', 'DECLINED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uniq_connection UNIQUE(sender_id, receiver_id)
);
```

#### Connection Flow Rules
1.  **Search Feed**: Users can browse basic details of opted-in members (Full Name, Age, Profile Photo).
2.  **Request Interest**: User A sends connection request to User B.
    *   Creates a `connection_requests` record with status `PENDING_RECEIVER`.
3.  **Receiver Decision**: User B accepts or declines.
    *   If declined, status transitions to `DECLINED`.
    *   If approved and User B has `require_double_approval = FALSE`, status transitions directly to `APPROVED`. Full profile details (contact number, DOB, family details, income, address) are unlocked for User A.
    *   If approved and User B has `require_double_approval = TRUE`, status transitions to `PENDING_FAMILY`.
4.  **Co-Approver Decision**: The designated family member (stored as `designated_co_approver_id`) must review and approve.
    *   If approved, status transitions to `APPROVED`. Access is granted.
    *   If declined, status transitions to `DECLINED`.

---

### 6.6 Admin Module

Centralizes regional management, system reporting dashboards, and actions auditing.

#### Database Table: `audit_logs`
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'VERIFY_USER', 'CHANGE_ROLE', 'PEER_VERIFY_ADMIN'
    target_type VARCHAR(50) NOT NULL, -- 'User', 'Profile', 'VerificationRequest'
    target_id INTEGER NULL,
    details JSONB NULL, -- Raw changes dictionary (e.g. before/after states)
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### API Endpoints
*   `GET /api/v1/admin/dashboard`: Returns aggregate reporting metrics.
    *   *Metrics details*: Total registry count, verification turnaround average, matching connection success rates, pending requests count, distribution map by regions.
*   `POST /api/v1/admin/regions`: Allocates new region bounds.
*   `POST /api/v1/admin/local-admins/{admin_id}/peer-verify`: Submits a verification review for a proposed Local Admin.
*   `GET /api/v1/admin/audit-logs`: Retrieves database audit logs.

---

### 6.7 Memorial Records Module

Deactivates profiles of deceased users and archives their history under a public memory wall.

#### Database Table: `memorial_records`
```sql
CREATE TABLE memorial_records (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    date_of_death DATE NOT NULL,
    place_of_death VARCHAR(100) NULL,
    announced_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    obituary TEXT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Workflow & Rules
1.  **Deactivation trigger**: A verified death announcement shuts down logins for the user immediately:
    ```sql
    UPDATE users SET is_active = FALSE WHERE id = (SELECT user_id FROM profiles WHERE id = :profile_id);
    UPDATE profiles SET is_deceased = TRUE WHERE id = :profile_id;
    ```
2.  **Removal from Matrimonial**: Corresponding `matrimony_profiles` are permanently deleted, and open connection requests are set to `REVOKED`.
3.  **Read-Only Archival**: The profile's edit permission is locked for the user's family head.
4.  **Admin Exception**: Only the `SUPER_ADMIN` can edit details within `memorial_records` or the linked profile info to correct errors.

---

## 7. Error Handling Strategy

The system enforces structured HTTP error payloads to simplify UI consumption.

### 7.1 Response Envelope
All exception handlers format API errors to match a unified schema:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable detail message.",
    "details": {}
  }
}
```

### 7.2 Custom Exceptions Hierarchy
We define a base application exception subclassing FastAPI's HTTP exception:

```python
# app/core/exceptions.py
class CommunityConnectException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, details: dict = None):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.details = details or {}
```

#### Subclasses and HTTP Mappings

| Exception Class | HTTP Status | Error Code (`code`) | Use Case |
| :--- | :--- | :--- | :--- |
| `EntityNotFoundError` | 404 | `RESOURCE_NOT_FOUND` | Database record not found by ID. |
| `ValidationError` | 400 | `VALIDATION_ERROR` | Request data fails schema rules. |
| `InvalidStateTransition` | 409 | `INVALID_STATE` | Attempting invalid status workflow. |
| `OtpExpiredError` | 400 | `OTP_EXPIRED` | Using token after expiry timestamp. |
| `OtpThrottledError` | 429 | `TOO_MANY_REQUESTS` | Exceeded OTP limits on requests. |
| `AuthenticationError` | 401 | `UNAUTHORIZED` | Expired or malformed JWT token. |
| `PermissionDeniedError` | 403 | `FORBIDDEN` | Missing RBAC role privileges. |
| `ConflictError` | 409 | `CONFLICT` | Registering existing phone number. |

---

## 8. File Upload Handling (GCP Cloud Storage)

User profile photos are uploaded to Google Cloud Storage. The system enforces strict validation before files reach GCP.

### 8.1 Image Validation Pipeline
```
[Client Multi-part File Upload]
             │
             ▼
 1. Check size (< 5MB)
             │
             ▼
 2. Verify MIME type (image/jpeg, image/png, image/webp)
             │
             ▼
 3. Read header bytes (Verify magic number header)
             │
             ▼
 4. PIL (Pillow): Resize, strip EXIF metadata, compress to WebP
             │
             ▼
 5. Upload to Google Cloud Storage
```

### 8.2 Public vs Private Storage Layout
*   **Public Photos (Registry)**: Main profile photos are uploaded to the public registry bucket. Served via direct CDN URLs stored in `profiles.profile_photo_url` (e.g. `https://storage.googleapis.com/community-public-photos/uuid.webp`).
*   **Private Photos (Matrimonial)**: Optional sensitive matrimonial photos are uploaded to the private bucket. Access is secured using time-limited signed URLs generated on-demand by the API:

```python
# app/services/gcp_storage.py
from google.cloud import storage
import datetime

def generate_signed_url(blob_name: str) -> str:
    storage_client = storage.Client.from_service_account_json(settings.GCP_KEY_FILE)
    bucket = storage_client.bucket(settings.GCP_PRIVATE_BUCKET)
    blob = bucket.blob(blob_name)

    url = blob.generate_signed_url(
        version="v4",
        expiration=datetime.timedelta(minutes=15),
        method="GET",
    )
    return url
```

---

## 9. Background Tasks

FastAPI's asynchronous ecosystem is used to process long-running tasks.

### 9.1 Age-Based Access Unlocking at 18
A daily cron script sweeps profiles to transition minors into verified adult statuses.

#### Process Sequence
1.  **Scan**: The query scans the database for verified accounts in the minor role whose date of birth is at least 18 years ago.
    ```sql
    SELECT p.id, p.user_id, u.phone_number 
    FROM profiles p
    JOIN users u ON p.user_id = u.id
    WHERE u.role = 'MEMBER_MINOR' 
      AND p.is_verified = TRUE 
      AND p.dob <= CURRENT_DATE - INTERVAL '18 years';
    ```
2.  **Transition**: For each record, the task updates the role to `MEMBER_SELF`.
    ```sql
    UPDATE users SET role = 'MEMBER_SELF' WHERE id = :user_id;
    ```
3.  **Notification**: Triggers a background SMS task inviting the newly-minted adult to claim their login details and configure security settings.
4.  **Audit**: Logs the automated transition into `audit_logs` under system operations.

### 9.2 Other Cron Routines
*   **OTP Record Purging**: Daily sweep removing `otp_tokens` where `expires_at` is older than 24 hours to keep the table clean.
*   **Blacklist Eviction**: Prunes expired access token JTIs from the Redis blacklist.

---

## 10. Environment Configuration

Settings are parsed using Pydantic Settings and validated at runtime.

### 10.1 Pydantic Configuration Model
```python
# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn

class Settings(BaseSettings):
    # App
    APP_NAME: str = "CommunityConnect"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development" -- 'development', 'staging', 'production'
    DEBUG: bool = True
    
    # Servers
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # DB (asyncpg)
    DATABASE_URL: PostgresDsn = Field(..., env="DATABASE_URL")
    
    # JWT
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Redis (Rate limits / Blacklists)
    REDIS_URL: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    
    # GCP
    GCP_PROJECT_ID: str = Field(..., env="GCP_PROJECT_ID")
    GCP_KEY_FILE: str = Field(..., env="GCP_KEY_FILE")
    GCP_PUBLIC_BUCKET: str = Field(..., env="GCP_PUBLIC_BUCKET")
    GCP_PRIVATE_BUCKET: str = Field(..., env="GCP_PRIVATE_BUCKET")
    
    # SMS
    SMS_API_KEY: str = Field(..., env="SMS_API_KEY")
    SMS_SENDER_ID: str = Field(..., env="SMS_SENDER_ID")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }

settings = Settings()
```

### 10.2 Sample Local Environment Setup (`.env`)
```env
APP_NAME=CommunityConnect
APP_VERSION=1.0.0
ENV=development
DEBUG=true
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/communityconnect
SECRET_KEY=9a6d8c2e4f1b7a0d3e5f8b9c0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9
REDIS_URL=redis://localhost:6379/0
GCP_PROJECT_ID=community-connect-3920
GCP_KEY_FILE=/secrets/gcp-sa-key.json
GCP_PUBLIC_BUCKET=communityconnect-public-photos
GCP_PRIVATE_BUCKET=communityconnect-private-photos
SMS_API_KEY=sms_mock_key_12345
SMS_SENDER_ID=COMCON
```

---

## 11. Testing Strategy

Tests are built using `pytest` and execution is run asynchronously using `pytest-asyncio`.

### 11.1 Async Test Session Setup
To prevent tests from leaking changes to the database, each test runs in a transaction block that rolls back upon completion.

```python
# tests/conftest.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.session import Base
from app.main import app
from app.db.session import get_db

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/test_communityconnect"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session() -> AsyncSession:
    async with TestingSessionLocal() as session:
        async with session.begin():
            yield session
            await session.rollback() # Rollback all writes
```

### 11.2 Integration Testing Pattern
Mocking external services (GCP bucket Client and SMS Gateway client) is required:

```python
# tests/api/test_auth.py
from unittest.mock import patch
import pytest

@pytest.mark.asyncio
async def test_request_otp_success(client):
    with patch("app.services.auth.SMSService.send_otp") as mock_send:
        mock_send.return_value = True
        response = client.post("/api/v1/auth/otp/send", json={
            "phone_number": "+919999999999",
            "action_type": "SIGNUP"
        })
        assert response.status_code == 200
        assert response.json()["success"] is True
```

---

## 12. Deployment (GCP Cloud Run)

The application is containerized and deployed to Google Cloud Run, linking securely to a Cloud SQL PostgreSQL instance.

### 12.1 Multi-Stage Dockerfile
```dockerfile
# Stage 1: Build dependencies
FROM python:3.11-slim AS builder
WORKDIR /install
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r /requirements.txt

# Stage 2: Final image
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /install /usr/local
COPY ./app /app/app
COPY ./alembic /app/alembic
COPY ./alembic.ini /app/alembic.ini

# Expose port and configure entrypoint
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 12.2 GCP Infrastructure Setup (gcloud CLI)

```bash
# 1. Build the docker container via Cloud Build
gcloud builds submit --tag gcr.io/community-connect-3920/backend:latest

# 2. Deploy service to Cloud Run with environment overrides
gcloud run deploy communityconnect-backend \
    --image gcr.io/community-connect-3920/backend:latest \
    --platform managed \
    --region asia-south1 \
    --add-cloudsql-instances community-connect-3920:asia-south1:communityconnect-db \
    --set-env-vars "ENV=production,DEBUG=false,HOST=0.0.0.0,PORT=8000" \
    --set-secrets "DATABASE_URL=db-url-secret:latest,SECRET_KEY=jwt-secret:latest,SMS_API_KEY=sms-key-secret:latest" \
    --allow-unauthenticated
```

#### Secrets Management
Environment configurations are managed securely using **GCP Secret Manager**. Secrets like database credentials, JWT secret keys, and SMS API keys are referenced in the Cloud Run deploy command (`--set-secrets`), mounting secrets as environment variables inside the execution environment. This avoids leaking keys in configuration repositories.
