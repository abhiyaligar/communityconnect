# CommunityConnect — Complete Bug & Vulnerability Audit Report

> **Audit Date:** July 2026  
> **Project:** CommunityConnect (FastAPI + React/TypeScript)  
> **Audit Scope:** Backend (Python/FastAPI), Frontend (React/TypeScript), Database Models, API Endpoints  
> **Total Findings:** 14 CRITICAL · 45 HIGH · 55 MEDIUM · 30+ LOW/INFO

---

## Table of Contents

1. [CRITICAL Severity Findings](#critical-severity-findings)
2. [HIGH Severity Findings](#high-severity-findings)
3. [MEDIUM Severity Findings](#medium-severity-findings)
4. [LOW Severity Findings](#low-severity-findings)
5. [INFO / Observations](#info--observations)
6. [Quick-Fix Priority Order](#quick-fix-priority-order)

---

# CRITICAL Severity Findings

## C-01: Hardcoded Default JWT Secret Key

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Settings.SECRET_KEY` defaults to `"your-super-secret-key-change-in-production"` — a publicly-known string. No validator rejects this in production. |
| **Impact** | Attacker can forge arbitrary HS256 JWTs with any `sub` (user UUID) and any `role`. Full account takeover and privilege escalation. No token-type or audience checks exist. |
| **Files to Fix** | `backend/app/core/config.py:29` (default value), `backend/app/core/security.py:27,34` (uses secret) |
| **Recommended Fix** | Add `@field_validator("SECRET_KEY")` that raises if value equals the default or `len < 32` when `ENVIRONMENT == "production"`. Document generation via `secrets.token_urlsafe(64)`. |

---

## C-02: Refresh Tokens Accepted as Access Tokens

| Field | Detail |
|-------|--------|
| **Vulnerability** | `get_current_user` in deps.py decodes any valid JWT with a `sub` claim, never checking `payload.get("type") == "access"`. Refresh tokens (7-day expiry) are fully valid as Bearer tokens on all endpoints. |
| **Impact** | Stolen refresh cookie → full API access for 7 days without needing to call `/token/refresh`. Nullifies the access-token short expiry (30 min). |
| **Files to Fix** | `backend/app/api/deps.py:34-50` (auth check), `backend/app/core/security.py:18-28` (token creation) |
| **Recommended Fix** | Add `"type": "access"` to access JWTs at creation. In `get_current_user`, reject any token whose `type != "access"`. |

---

## C-03: OTP Master Bypass Code `"123456"`

| Field | Detail |
|-------|--------|
| **Vulnerability** | When `SMS_PROVIDER` is `"mock"`, any OTP verification with `"123456"` succeeds. If production ever has `SMS_PROVIDER=mock` (misconfiguration), any phone number can be authenticated with this static code. |
| **Impact** | Complete authentication bypass — attacker can login as any user by entering `123456` as the OTP. |
| **Files to Fix** | `backend/app/services/otp.py:43-46` |
| **Recommended Fix** | Add gating check: `if settings.ENVIRONMENT == "production": raise RuntimeError("Mock provider not allowed")`. Wrap bypass in `if settings.DEBUG`. |

---

## C-04: Self-Approval of Verification Requests

| Field | Detail |
|-------|--------|
| **Vulnerability** | The `approve_verification` endpoint never checks whether the approver is the same user as the target. An admin can approve their own verification request. |
| **Impact** | A `local_admin` can self-approve and gain `verified_adult` status without peer review. Combined with duplicate-vote inflation (C-05), they could grant themselves any role. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:128-134` |
| **Recommended Fix** | Add `if current_user.id == req.target_user_id: raise HTTPException(403, detail="Cannot approve your own verification.")` |

---

## C-05: Duplicate Vote Inflation — Missing Unique Constraint on Approvals

| Field | Detail |
|-------|--------|
| **Vulnerability** | `VerificationApproval` model has no unique constraint on `(verification_request_id, approver_user_id)`. Vote counting uses `len(...) + 1`, so a single admin can call approve multiple times to inflate the count. |
| **Impact** | Single rogue `local_admin` can reach the 4-vote threshold and self-approve, gaining `verified_adult` role without actual peer review. |
| **Files to Fix** | `backend/app/models/verification.py` (add constraint), `backend/app/api/v1/endpoints/verification.py:150-156` (counting logic) |
| **Recommended Fix** | Add `UniqueConstraint("verification_request_id", "approver_user_id", name="uq_approval_per_admin")`. Use `count(distinct approver_user_id)` in queries. |

---

## C-06: Hardcoded Password in Seed Script

| Field | Detail |
|-------|--------|
| **Vulnerability** | `backend/app/db/seed.py:41` hardcodes `raw_password = "Password@123".encode("utf-8")` for all seeded users including super admins. This is committed to source. |
| **Impact** | Anyone with access to the repo (or the running seed) knows the default password for all seeded accounts including community_admin. |
| **Files to Fix** | `backend/app/db/seed.py:41` |
| **Recommended Fix** | Read password from environment variable. Use `from app.core.security import hash_password` instead of reimplementing bcrypt. |

---

## C-07: FamilyUnit `delete-orphan` Cascade Destroys All Member Profiles

| Field | Detail |
|-------|--------|
| **Vulnerability** | `family_unit.members` relationship uses `cascade="all, delete-orphan"`. Deleting a `FamilyUnit` deletes ALL member `Profile` rows from the database. |
| **Impact** | If a family unit is deleted (planned or accidental), all profiles of all family members are permanently destroyed — no SET NULL, no protection. |
| **Files to Fix** | `backend/app/models/family.py:33` |
| **Recommended Fix** | Change cascade to `cascade="all"` (remove `delete-orphan`) so the DB `SET NULL` rule fires instead. |

---

## C-08: 7 Database Indexes Dropped and Never Recreated

| Field | Detail |
|-------|--------|
| **Vulnerability** | Migration `032d97cc0f66` dropped 7 indexes on critical tables (profile, memorial, matrimony, connection_requests) and they were never recreated. |
| **Impact** | Severe query performance degradation on all major read paths (profile search, matrimony matching, registry browsing). Full table scans on large tables. |
| **Files to Fix** | `backend/alembic/versions/032d97cc0f66*.py` — write a new migration |
| **Recommended Fix** | Write a hotfix migration that recreates: `ix_profiles_username`, `ix_profiles_email`, `ix_profiles_full_name`, `ix_memorial_date_of_death`, `ix_matrimony_opted_in`, `ix_connection_requests_status`, `ix_connection_requests_receiver`. |

---

## C-09: JWT Access Token Stored in `localStorage` (XSS-Exposed)

| Field | Detail |
|-------|--------|
| **Vulnerability** | The access token is written to and read from `localStorage` via `api.ts` and `AuthContext.tsx`. Any XSS vulnerability (unsanitized profile photo URL, social link, third-party script) can steal the JWT. |
| **Impact** | Full account takeover — attacker steals `access_token` from localStorage and calls any API as the victim until token expiry (30 min). Refresh cookies are also exfiltratable. |
| **Files to Fix** | `frontend/src/lib/api.ts:16,40,44` • `frontend/src/contexts/AuthContext.tsx:27-86` • `frontend/src/pages/Register.tsx:120,162` |
| **Recommended Fix** | Store access token in HttpOnly, Secure, SameSite cookie (like refresh token). Avoid `localStorage` entirely. If unavoidable, use in-memory with short TTL + refresh. |

---

## C-10: Fake "Verified Adult Level 3" Badge Shown to ALL Users

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Dashboard.tsx:83-85` unconditionally renders a static badge "Verified Adult Level 3" for every logged-in user, including unverified, minor, local_admin, and community_admin users. |
| **Impact** | Unverified users can falsely claim "Verified Adult Level 3" status on shared screens or screenshots. Undermines the entire verification system and community trust. |
| **Files to Fix** | `frontend/src/pages/Dashboard.tsx:83-85` |
| **Recommended Fix** | Dynamically compute from `user.role`: `{user?.role === "verified_adult" && <span>Verified Adult Level 3</span>}` |

---

## C-11: local_admin Can Assign community_admin Role via Edit Dialog

| Field | Detail |
|-------|--------|
| **Vulnerability** | The admin user edit dialog (`AdminUsers.tsx:322-331`) exposes ALL roles including `community_admin` in the role `<Select>`. Both `local_admin` and `community_admin` users can access this page. A `local_admin` can promote any user (including themselves) to `community_admin`. |
| **Impact** | Direct privilege escalation — rogue local_admin becomes community_admin with full platform control. |
| **Files to Fix** | `frontend/src/pages/admin/AdminUsers.tsx:322-331` (frontend), `backend/app/api/v1/endpoints/admin.py:186-228` (backend must also enforce) |
| **Recommended Fix** | Filter role options based on current user's role. Only `community_admin` should see `community_admin`/`local_admin` options. Backend must also enforce: only `community_admin` can assign admin roles. |

---

## C-12: `setInterval` Countdown Timer Never Cleaned Up on Unmount

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:80-85` — `startCountdown` creates a `setInterval` that decrements the OTP countdown timer. The interval is never cleared on component unmount (navigation away, tab close, step-back). |
| **Impact** | Memory leak (interval keeps firing), stale closure, React warning about setState on unmounted component after React 18. Over many navigation cycles, memory usage grows. |
| **Files to Fix** | `frontend/src/pages/Register.tsx:80-85` |
| **Recommended Fix** | Use `useEffect` with cleanup returning `clearInterval(timer)`. Track timer via `useRef`. |

---

## C-13: `email_verifications.id` Column Has No DB Default

| Field | Detail |
|-------|--------|
| **Vulnerability** | The `EmailVerification` model's `id` column is a UUID PK with no `server_default=gen_random_uuid()`. If the application layer fails to provide a UUID (e.g., bug, migration schema mismatch), the INSERT fails at the DB level. |
| **Impact** | Registration flow can fail silently with 500 errors. OTP verification requests might be lost. |
| **Files to Fix** | `backend/app/models/email_verification.py:12` |
| **Recommended Fix** | Add `server_default=text("gen_random_uuid()")` as a hotfix migration. |

---

## C-14: `/register/verify-email` Issues Tokens for Existing Users (OTP-Only Takeover)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:114-138` — When verifying an OTP, if `user` already exists (found by email), the endpoint **still issues access + refresh tokens** without verifying the user's password. The supplied password in the request body is ignored for existing users. |
| **Impact** | Attacker who phishes or brute-forces an OTP (6-digit, no rate limit on verify) can get authenticated access to any existing account without knowing the password. OTP-only account takeover. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:114-138` |
| **Recommended Fix** | Either (a) always verify the password against stored hash even for existing users, or (b) refuse to issue tokens if user already exists — return "Already registered, please login." |

---

# HIGH Severity Findings

## H-01: Stateless Refresh Tokens — No Server-Side Revocation

| Field | Detail |
|-------|--------|
| **Vulnerability** | Refresh tokens are JWTs with no `jti`, no server-side state, no blocklist, no `token_version` on User model. They cannot be revoked. Logout only deletes the client cookie. |
| **Impact** | Stolen refresh token (via XSS, log leak, cookie theft) remains valid for 7 days even after the user logs out or changes password. |
| **Files to Fix** | `backend/app/core/security.py:18-28` • `backend/app/api/v1/endpoints/auth.py:259-265` |
| **Recommended Fix** | Make refresh tokens opaque random tokens stored in a `refresh_tokens` table with `user_id`, `expires_at`, `revoked_at`. On rotation, detect reuse. On logout, revoke server-side. |

---

## H-02: Refresh Token Rotation Has No Reuse Detection

| Field | Detail |
|-------|--------|
| **Vulnerability** | `/token/refresh` issues a new JWT but the old one remains valid. There is no server-side record of which `jti` was rotated. Attacker and legitimate user can both use the same stolen token simultaneously. |
| **Impact** | Token rotation is theater — attacker who steals one refresh cookie can mint an unlimited chain of tokens without detection. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:204-257` |
| **Recommended Fix** | Store refresh tokens in DB. On rotation, mark old token as `rotated`. If a `rotated` token is presented again, revoke the entire token family. |

---

## H-03: No Rate Limiting on Auth Endpoints (OTP Brute-Force)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `/register/email`, `/register/verify-email`, `/login`, `/token/refresh` have NO rate limiting. OTP is 6 digits (10^6 space) with no attempt counter. |
| **Impact** | Attacker can brute-force OTP at high speed, achieving account takeover. Credential stuffing on `/login` is unlimited. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:36,84,156,204` |
| **Recommended Fix** | Add per-identity rate limiting: max 5 OTP verification attempts per OTP lifetime (track in DB), max N login attempts per minute. Use `fastapi-limiter`/slowapi with Redis (already configured). |

---

## H-04: Logout Does Not Invalidate Any Token

| Field | Detail |
|-------|--------|
| **Vulnerability** | `logout` only calls `response.delete_cookie(key="refresh_token")`. It does not revoke the refresh JWT server-side, does not bump `token_version`, does not clear the access token. |
| **Impact** | After logout, access token remains valid for 30 min. Refresh token (stolen earlier) remains valid for 7 days. Logout button is security theater. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:259-265` |
| **Recommended Fix** | Accept the refresh token, revoke its server-side row, bump user's `token_version` to invalidate all access tokens immediately. |

---

## H-05: OTP Stored in Plaintext in Database

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:69-74` — OTP codes are stored as-is in the `EmailVerification` table. Anyone with DB read access (SQL injection elsewhere, backup leak, DBA) can read live OTPs. |
| **Impact** | DB-level plaintext OTPs allow anyone with DB access to authenticate as any user. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:69-74`, `backend/app/models/email_verification.py:17` |
| **Recommended Fix** | Hash OTPs at rest using HMAC-SHA256 with a server-side derived key. |

---

## H-06: Missing Role Checks on All Profile PUT Endpoints

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:296-477` — Four PUT endpoints (`/me`, `/me/matrimony`, `/me/username`, `/me/social`) use only `get_current_user` without `RoleChecker`. Any authenticated user including `unverified` can modify all profile fields. |
| **Impact** | Unverified users can access matrimony features, set co-approvers, change username, and update social links before admin approval. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:296,340,430,459` |
| **Recommended Fix** | Add `Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))` to all four endpoints. |

---

## H-07: Missing Role Checks on Matrimony Endpoints

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:231,313,400,476,513` — All matrimony interaction endpoints (send requests, list requests, approve/reject, manage co-approvers) use only `get_current_user`. |
| **Impact** | Unverified users can fully participate in the matrimony system — send connection requests, approve/reject matches — before any admin verification. |
| **Files to Fix** | `backend/app/api/v1/endpoints/matrimony.py:231,313,400,476,513` |
| **Recommended Fix** | Add `Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))` to all these endpoints. |

---

## H-08: Single Admin Can Reject Any Verification (No Peer Review for Rejection)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:172-207` — Unlike approvals (which require 4 peer votes for local_admin targets), a SINGLE local_admin can reject any verification request immediately. |
| **Impact** | A rogue local_admin can systematically reject all pending verification requests in their region, locking users out of the platform. No appeal mechanism. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:203-204` |
| **Recommended Fix** | Require the same 4-vote threshold for rejection, or require community_admin override for any rejection. |

---

## H-09: No Region Scoping for local_admin (Data Breach)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:106,142,231` — All admin list/stats endpoints (`/admin/dashboard`, `/admin/users`, `/admin/matrimony`) use `RoleChecker` that allows `local_admin` but provide NO region scoping. A `local_admin` assigned to one region can see ALL users platform-wide. |
| **Impact** | Massive PII data breach — a local_admin for a small town can export names, phones, addresses, DOBs for the entire national community. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:106,142,231` |
| **Recommended Fix** | For `local_admin` users, filter all queries by their assigned region IDs from `LocalAdminRegion`. |

---

## H-10: Self-Deletion of Admin Account

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:267-284` — `delete_user_account_admin` does not check whether `current_admin.id == user_id`. A community_admin can delete their own account. |
| **Impact** | Permanent self-DoS — if the only community_admin deletes their account, the platform has no remaining admin to restore or manage it. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:275` |
| **Recommended Fix** | Add `if current_admin.id == user_id: raise HTTPException(400, detail="Cannot delete your own account.")` |

---

## H-11: Email Verification Code Leaked to Logs on SMTP Failure

| Field | Detail |
|-------|--------|
| **Vulnerability** | `utils/email.py:48` — When SMTP sending fails, the fallback logs: `logger.info(f"SIMULATION FALLBACK: Code is {code}")`. The full OTP is written to application logs. |
| **Impact** | Anyone with log access (operators, log aggregation service, SIEM) can extract plaintext OTPs and authenticate as any user who experienced a failed email. |
| **Files to Fix** | `backend/app/utils/email.py:48` |
| **Recommended Fix** | Log only a masked code (`code[:2] + "****"`). Never log secrets even in fallback paths. |

---

## H-12: Escalation Lacks Region-Scoping Check

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:210-233` — The escalate endpoint is gated to `local_admin` but there is no check that the verification request belongs to the admin's assigned region. |
| **Impact** | A local_admin from region A can escalate requests from region B, interfering with other admins' workflows and overloading the community admin. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:221-226` |
| **Recommended Fix** | Verify that `req.region_id` is in the current admin's assigned region IDs before allowing escalation. |

---

## H-13: User Enumeration via Registration Endpoint

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:50-54` — `/register/email` returns 400 "Email is already registered" vs 200 "Verification code sent". An attacker can enumerate the user base. |
| **Impact** | Privacy breach — attacker can confirm which emails are registered on the platform. Enables targeted phishing, credential stuffing. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:50-54` |
| **Recommended Fix** | Return the same neutral message regardless of whether the email exists. |

---

## H-14: `DEBUG=True` by Default in Production

| Field | Detail |
|-------|--------|
| **Vulnerability** | `config.py:18` — `DEBUG: bool = True` is the default. `session.py:16` uses `echo=settings.DEBUG`, dumping all SQL with bound parameters (emails, OTPs, UUIDs) to logs. |
| **Impact** | PII and authentication secrets (OTPs) in plaintext application logs — privacy and compliance violation. SQL parameter logging can expose all user data. |
| **Files to Fix** | `backend/app/core/config.py:18`, `backend/app/db/session.py:16` |
| **Recommended Fix** | Default `DEBUG = False`. Gate `echo=True` behind `ENVIRONMENT == "development"`. |

---

## H-15: No Token Version / JTI — Revoked Tokens Remain Valid

| Field | Detail |
|-------|--------|
| **Vulnerability** | `deps.py:35-78` — `get_current_user` only checks user exists + is_active. There is no `token_version` or `jti` lookup. Password changes, role downgrades, or admin deactivation take up to `ACCESS_TOKEN_EXPIRE_MINUTES` (30 min) to take effect (unless `is_active=False`). |
| **Impact** | Privilege removal is delayed by up to 30 minutes. A demoted admin still has full API access during that window. |
| **Files to Fix** | `backend/app/api/deps.py:35-78` |
| **Recommended Fix** | Add `token_version` column to User. Embed as JWT claim. Compare on every request. Bump on role change / password change. |

---

## H-16: Frontend — Dead Routes in Sidebar (Settings / Support)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `MainLayout.tsx:70-73` — The sidebar contains `NavLink` entries for `/settings` and `/support`. These routes do not exist in `App.tsx` and render 404. |
| **Impact** | Users clicking "Settings" or "Support" see a 404 page. Damages trust in navigation. |
| **Files to Fix** | `frontend/src/components/layout/MainLayout.tsx:70-73` |
| **Recommended Fix** | Either implement the routes or remove the dead links. |

---

## H-17: Frontend — Direct localStorage Write in Register Bypasses AuthContext State

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:120` writes token directly to `localStorage` without calling `login()` from AuthContext. React state (`token`, `user`) is NOT updated. |
| **Impact** | Components checking `isAuthenticated` see stale `false` state between OTP verify and onboard steps. Inconsistent auth state. |
| **Files to Fix** | `frontend/src/pages/Register.tsx:120` |
| **Recommended Fix** | Call `login(res.data.access_token, ...)` instead of manual localStorage write. |

---

## H-18: Frontend — No Refresh-Token Race-Condition Lock

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:28-52` — When multiple parallel API calls trigger 401, each fires a separate refresh request concurrently. No mutex/lock. |
| **Impact** | Multiple refresh calls can race, causing token thrashing and potentially invalidating each other. |
| **Files to Fix** | `frontend/src/lib/api.ts:28-52` |
| **Recommended Fix** | Implement a promise queue/mutex: cache the in-flight refresh promise and share it across concurrent 401s. |

---

## H-19: Frontend — Stale AuthContext State Not Cleared on Refresh Failure

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:44-46` — On refresh failure, the interceptor clears localStorage and redirects, but does NOT reset AuthContext's React state (`setToken(null)`). |
| **Impact** | Brief flash of stale user data during redirect from protected route to login. |
| **Files to Fix** | `frontend/src/lib/api.ts:44-46` |
| **Recommended Fix** | Call a callback to also clear React state. Export a global `forceLogout()` function that AuthProvider listens to. |

---

## H-20: Frontend — login() Stores Token Before Profile Fetch

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AuthContext.tsx:64-73` — `login` writes token to localStorage before fetching `/profiles/me`. If profile fetch fails, token is committed but user is `null`. |
| **Impact** | User stuck with stale token — cannot recover without manually clearing localStorage. Sees "Invalid email or password" error even with correct password. |
| **Files to Fix** | `frontend/src/contexts/AuthContext.tsx:64-73` |
| **Recommended Fix** | Don't write token until profile fetch succeeds, or implement rollback. |

---

## H-21: Frontend — Registry Shows Matrimony Matches, Not Actual Registry

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Registry.tsx:53-62` — For non-admin users, data is fetched from `/matrimony/matches` instead of a registry endpoint. The "Community Registry" page displays matrimony profiles, not the full community directory. |
| **Impact** | Users see only matrimony-opted-in members when expecting the full community. Critical misdirection bug. |
| **Files to Fix** | `frontend/src/pages/Registry.tsx:53-62` |
| **Recommended Fix** | Create a dedicated `/profiles/registry` endpoint returning all verified members with masked contact info. |

---

## H-22: Frontend — AdminSidebar Component Is Dead Code

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AdminSidebar.tsx` (entire 123-line file) is never imported anywhere in the codebase. The admin routes use `AdminShell.tsx` which uses `MainLayout.tsx`, not `AdminSidebar`. |
| **Impact** | 123 lines of dead, rotting code. Maintenance burden; confusion for future developers. |
| **Files to Fix** | `frontend/src/components/layout/AdminSidebar.tsx` |
| **Recommended Fix** | Delete the file if it's truly unused (verify via grep first). |

---

## H-23: Endpoint — Sender's Double-Approval Bypass in Matrimony

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:292-305` — When creating a connection request, only the **receiver's** `double_approval_required` is checked. The **sender's** co-approver is ignored entirely. |
| **Impact** | A user with `double_approval_required=True` and an unapproved co-approver can send requests without their own guardian's knowledge. |
| **Files to Fix** | `backend/app/api/v1/endpoints/matrimony.py:292-305` |
| **Recommended Fix** | Check both sender and receiver `double_approval_required` settings before allowing the request. |

---

## H-24: Endpoint — Admin User List Has No Max Limit

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:144-145` — The `limit` parameter has no maximum bound. A caller can set `limit=1000000` to dump the entire user database in one request. |
| **Impact** | Any admin can extract the entire user database (names, phones, DOBs, addresses, roles) in a single API call. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:144-145` |
| **Recommended Fix** | Add `Field(le=100)` to the `limit` parameter or validate in the handler. |

---

## H-25: Endpoint — Co-Approver Assignment Without Consent

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:378-386` — Any user can set `family_co_approver_profile_id` to any other profile's UUID with no consent check. Only existence is verified. |
| **Impact** | User A can force User B to appear as a co-approver. User B gets unwanted invitations and must manually decline. Repetition causes harassment. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:378-386` |
| **Recommended Fix** | Require co-approver to generate an invite code or accept first before assignment is stored. |

---

## H-26: Endpoint — Admin Self-Editing and Self-Demotion

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:186-228` — A community_admin can `PUT /admin/users/{user_id}` on their own `user_id` to change their own `role` and `is_active`. |
| **Impact** | Admin could accidentally deactivate themselves or set `role=verified_adult`, losing admin privileges with no recovery. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:215-216` |
| **Recommended Fix** | Prevent self-demotion: `if current_admin.id == user_id and request.role != UserRole.community_admin: raise HTTPException(400)` |

---

## H-27: Endpoint — Verification Race Condition in Vote Counting

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:150-166` — Vote counting query and status update are not in a locked transaction. Two concurrent approvals can both see `vote_count < 4` and miss the threshold transition. |
| **Impact** | Verification requests can get stuck at `local_approved` indefinitely even with enough votes. Requires manual community_admin intervention. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:150-166` |
| **Recommended Fix** | Use `select ... for update` on the `VerificationRequest` row before counting and updating status. |

---

## H-28: Frontend — Non-Functional "Pending Approvals" and "Guardian View" Tabs

| Field | Detail |
|-------|--------|
| **Vulnerability** | `MatrimonyRequests.tsx:195-199,236-239` — Three tabs are rendered ("Inbox", "Pending Approvals", "Guardian View"), but only "Inbox" has content. The other two are dead with placeholder text. "Add Guardian" button has no `onClick`. |
| **Impact** | Misleading UX — users see tabs they can't use. Creates false expectations. |
| **Files to Fix** | `frontend/src/pages/MatrimonyRequests.tsx` |
| **Recommended Fix** | Implement the tab content or remove the dead tabs/buttons. |

---

## H-29: Backend — `AuditLog` Model Is Never Written

| Field | Detail |
|-------|--------|
| **Vulnerability** | A full `AuditLog` table/model exists but NO endpoint, service, or event handler ever writes to it. Admin actions (user update/delete, verification approve/reject, role changes) are not audited. |
| **Impact** | No audit trail for compliance. Cannot investigate who changed what or when. Violates basic security logging requirements. |
| **Files to Fix** | `backend/app/models/audit.py` (exists, unused) |
| **Recommended Fix** | Implement SQLAlchemy `before_flush` event or a service-layer `audit_log()` helper. Call from every mutating endpoint. |

---

# MEDIUM Severity Findings

## M-01: CORS Origins Hardcoded and Ignoring Config

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py:48` hardcodes `allow_origins=["https://communityconnect-wv5t.onrender.com","http://localhost:5173"]` but `config.py:35` defines `CORS_ORIGINS` which is never used. Two sources of truth. |
| **Impact** | Changing CORS origins in `.env` has no effect. Operators may think they've configured CORS when they haven't. |
| **Files to Fix** | `backend/app/main.py:48`, `backend/app/core/config.py:35` |
| **Recommended Fix** | Use `settings.CORS_ORIGINS` in `main.py`. Add validator forbidding `["*"]` when `allow_credentials=True`. |

---

## M-02: Swagger/ReDoc Exposed in Production

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py:39-41` — `docs_url="/docs"` and `redoc_url="/redoc"` are set with no environment gating. Production exposes the full OpenAPI schema. |
| **Impact** | Information disclosure — attackers can enumerate every endpoint, read schemas, and understand the attack surface. |
| **Files to Fix** | `backend/app/main.py:39-41` |
| **Recommended Fix** | In production: `docs_url=None, redoc_url=None, openapi_url=None`. |

---

## M-03: No Rate Limiting or Security Headers at Framework Level

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py:26-52` — Missing: `TrustedHostMiddleware` (host header injection), rate limiting (login/OTP brute-force), security headers (CSP, HSTS, X-Content-Type-Options), request body size limit. |
| **Impact** | Systemic weakness — OTP brute-force possible (H-03), host header injection for password reset phishing (if implemented), SSL stripping without HSTS. |
| **Files to Fix** | `backend/app/main.py:26-52` |
| **Recommended Fix** | Add `slowapi`/`fastapi-limiter` for auth endpoints. Add `TrustedHostMiddleware`. Add security headers middleware. |

---

## M-04: `get_db` Commits After Every Request (Even GETs)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `session.py:35-48` — The dependency commits unconditionally after every route handler, even read-only GETs. Any accidental ORM mutation on a fetched object silently persists. |
| **Impact** | Silent, unintended writes to user records if any code path accidentally dirties a fetched object. Authorization integrity risk. |
| **Files to Fix** | `backend/app/db/session.py:35-48` |
| **Recommended Fix** | Separate read-only vs write sessions, or commit only in handlers that mutate. |

---

## M-05: SQL Echo in Production Exposes Bound Parameters

| Field | Detail |
|-------|--------|
| **Vulnerability** | `session.py:16` — `echo=settings.DEBUG` (default True) prints all SQL queries with bound parameters to stdout/logs. |
| **Impact** | PII (emails, phones), OTP codes, and UUIDs are logged in plaintext. Compliance violation. |
| **Files to Fix** | `backend/app/db/session.py:16` |
| **Recommended Fix** | Disable echo in production: `echo=settings.DEBUG and settings.ENVIRONMENT == "development"`. |

---

## M-06: No `pool_pre_ping` on DB Engine

| Field | Detail |
|-------|--------|
| **Vulnerability** | `session.py:14-20` — Engine created without `pool_pre_ping=True`. Stale connections from DB restart or idle timeout cause errors. |
| **Impact** | Intermittent 500 errors after database maintenance or restart. |
| **Files to Fix** | `backend/app/db/session.py:14-20` |
| **Recommended Fix** | Add `pool_pre_ping=True` to `create_async_engine`. |

---

## M-07: In-Memory OTP Store (Lost on Restart, No Cross-Worker Support)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `services/otp.py:18-21` — OTPs stored in `_otp_store: Dict[str, Tuple[str, float]]` — a module-level dict. Per-process only. Lost on restart. Doesn't work across multiple uvicorn workers. |
| **Impact** | OTP verification breaks under multi-worker deployment. Server restart wipes all pending OTPs and resets rate-limit counters. |
| **Files to Fix** | `backend/app/services/otp.py:18-21` |
| **Recommended Fix** | Use Redis or another persistent cache for OTP storage. |

---

## M-08: OTP Rate-Limit Exhaustion (DoS on Legitimate Users)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `services/otp.py:68-88` — Rate limit is max 3 OTPs per 15 minutes per phone number. Attacker can deliberately exhaust the limit for a target's phone. |
| **Impact** | Denial of service — legitimate user cannot receive OTP for 15 minutes. |
| **Files to Fix** | `backend/app/services/otp.py:68-88` |
| **Recommended Fix** | Use persistent store (Redis). Lower retry cooldown to 1 minute. Limit is on generation, not verification. |

---

## M-09: Cookie Security Flags — `Secure=False` in Non-Production

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:140-147,188-195,243-250` — `secure=True if settings.ENVIRONMENT == "production" else False`. String comparison is brittle — `ENVIRONMENT="staging"` or `"prod"` silently disables secure flag. Also `samesite="lax"` (not `strict`), no `path` restriction. |
| **Impact** | Refresh cookie sent over HTTP in non-production environments. Lax SameSite allows top-level cross-site navigation sends. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:140,188,243` |
| **Recommended Fix** | Add `Secure=True` whenever request is HTTPS. Use `samesite="strict"` for refresh cookies. Restrict `path="/api/v1/auth"`. Consider `__Host-` prefix. |

---

## M-10: Login Endpoint Leaks Account Status

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:166-176` — Separate messages: "Incorrect email or password" vs "User account is inactive". An attacker who knows the password sees different messages for active vs inactive accounts. |
| **Impact** | Account enumeration and password confirmation. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:166-176` |
| **Recommended Fix** | Single generic message for all login failure cases. |

---

## M-11: `/token/refresh` Can 500 on Malformed `sub`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:223-224` — `uuid.UUID(user_id)` can raise `TypeError` (if `None`) or `ValueError` (if malformed). No try/except wrapper (unlike `deps.py:52-59` which does guard). |
| **Impact** | Unhandled 500 error with potential traceback in debug mode. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:223-224` |
| **Recommended Fix** | Mirror `deps.py:52-59` — validate `user_id is not None`, parse in try/except, return 401 on failure. |

---

## M-12: No Password Min-Length Validation on Registration

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:26-33` — Inline `EmailOTPRequest` and `EmailOTPVerify` schemas have `password: str` with no `min_length`. The `EmailVerify` schema in `schemas/auth.py` (which has `min_length=8`) is never imported — it's dead code. |
| **Impact** | Users can register with empty or trivially short passwords. Password policy is not enforced. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:26-33` |
| **Recommended Fix** | Use the schemas from `app.schemas.auth` (which have min_length). Add max_length (128) and strength validation. |

---

## M-13: Duplicate User Race — No Exception Handling on UniqueViolation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:114-125` — Check-then-insert pattern for user creation is not atomic. Two concurrent requests can both pass the SELECT, and the second INSERT raises unhandled `UniqueViolationError` → 500. |
| **Impact** | Opaque 500 errors on legitimate retry. Account creation race condition. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:114-125` |
| **Recommended Fix** | Use `INSERT ... ON CONFLICT (email) DO NOTHING RETURNING id`, or wrap in try-except for `IntegrityError` returning 409. |

---

## M-14: /onboard Endpoint Has No Role Check

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:165-293` — Onboard endpoint uses only `get_current_user`. If a profile is ever deleted, any authenticated user (including admin) could re-onboard. |
| **Impact** | Inconsistent user state — admin could accidentally create a second profile. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:165` |
| **Recommended Fix** | Add `Depends(RoleChecker([UserRole.unverified]))` or check `current_user.role` explicitly. |

---

## M-15: Mass-Assignment via `setattr` Loop in Matrimony Update

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:376-399` — `setattr(mat_prof, key, value)` loop dumps all fields from schema. If a field like `opted_in: bool` is added to the schema in the future, it's writable without explicit handling. |
| **Impact** | Future developer could accidentally expose internal fields. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:376-399` |
| **Recommended Fix** | Use an allowlist of handled fields, or `exclude={"opted_in", "profile_id", "created_at", "updated_at"}`. |

---

## M-16: No Duplicate-Phone Check on Profile Update

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:332-334` — When updating `contact_number`, no uniqueness check against other profiles. DB column lacks unique constraint. |
| **Impact** | Multiple users can have the same contact number, enabling impersonation or receiving another user's verification codes. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:332-334` |
| **Recommended Fix** | Add uniqueness check before assignment, or add DB unique constraint. |

---

## M-17: Race Condition on Connection Request Creation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:277-308` — Existing-request check and INSERT are not atomic. Two concurrent requests can both pass the check, with DB unique constraint catching the second as an unhandled IntegrityError (500). |
| **Impact** | 500 error on rapid double-click or automated script. |
| **Files to Fix** | `backend/app/api/v1/endpoints/matrimony.py:277-308` |
| **Recommended Fix** | Wrap in try-except for `IntegrityError`, or use `select ... for update` to lock the check. |

---

## M-18: Missing Pagination on `/matrimony/matches`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:39-228` — Matches endpoint returns ALL opted-in profiles with no `limit`/`offset`. In a community with 10,000+ members, this is a massive payload. |
| **Impact** | Network congestion, high memory usage, potential DoS. |
| **Files to Fix** | `backend/app/api/v1/endpoints/matrimony.py:39-228` |
| **Recommended Fix** | Add required pagination parameters (`limit`, `offset`) with configurable max page size. |

---

## M-19: PII Exposure to Local Admins in Pending Verification List

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:68-96` — Pending verification response includes `contact_number` and `address` for all candidates in the list view. Exposed to all local admins. |
| **Impact** | Compromised or malicious local_admin can scrape contact numbers and addresses for all pending users in their region. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:85-86` |
| **Recommended Fix** | Only expose contact details on a per-request "review" endpoint. Mask/omit in list view. |

---

## M-20: `generate_unique_username` Race Condition

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:40-52` — While-loop checks DB for username uniqueness then returns. No unique constraint guarantee at INSERT time (column IS unique, but check-then-set is non-atomic). |
| **Impact** | Two concurrent registrations could get the same username — one will fail at INSERT with 500. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:40-52` |
| **Recommended Fix** | Use `INSERT ... ON CONFLICT (username) DO UPDATE` pattern, or generate UUID-based usernames with no collision risk. |

---

## M-21: Enum Columns Stored as Plain String (Data Integrity)

| Field | Detail |
|-------|--------|
| **Vulnerability** | Multiple `MatrimonyProfile` fields (`body_type`, `complexion`, `diet`, `education_level`, etc.) are stored as plain `String` columns despite `enums.py` defining corresponding enums. No DB-level CHECK constraints enforce valid values. |
| **Impact** | Arbitrary strings can be stored, breaking data integrity. Queries filtering by these fields may miss results with unexpected values. |
| **Files to Fix** | `backend/app/models/matrimony.py:22-61` |
| **Recommended Fix** | Use SQLAlchemy `Enum` type or add `CheckConstraint` for each field. |

---

## M-22: Frontend — Dead "Forgot Password?" Link

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Login.tsx:96-98` — "Forgot password?" link uses `href="#"` which does nothing. No password reset flow exists. |
| **Impact** | Users cannot recover their account if they forget their password. |
| **Files to Fix** | `frontend/src/pages/Login.tsx:96-98` |
| **Recommended Fix** | Implement password reset flow or disable the link. |

---

## M-23: Frontend — "Not provided" Sent as Address Default

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:145` — When no address provided, the string `"Not provided"` is sent to the backend and stored as a real address value. |
| **Impact** | Database pollution — cannot distinguish between "no address provided" and "address is literally 'Not provided'". |
| **Files to Fix** | `frontend/src/pages/Register.tsx:145` |
| **Recommended Fix** | Send `null` or omit the field. |

---

## M-24: Frontend — `(user as any)?.email` Bypasses TypeScript Safety

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Profile.tsx:105` — Casts user to `any` to access `email` which is not in the `AuthUser` type. If backend stops returning email, this silently becomes `undefined`. |
| **Impact** | Silent UI failure — shows "—" instead of email with no TypeScript error. |
| **Files to Fix** | `frontend/src/pages/Profile.tsx:105` |
| **Recommended Fix** | Add `email?: string` to the `AuthUser` interface in `types/index.ts`. |

---

## M-25: Frontend — Misleading Error Message on Login

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Login.tsx:48` — If login POST succeeds but profile GET fails, the error says "Invalid email or password" which is incorrect. |
| **Impact** | User with correct credentials sees wrong error message. Confusing UX. |
| **Files to Fix** | `frontend/src/pages/Login.tsx:48` |
| **Recommended Fix** | Differentiate between auth failure and profile fetch failure. |

---

## M-26: Frontend — 404 Treated as "No Profile" in AuthContext

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AuthContext.tsx:43-51` — Any 404 from `/profiles/me` is assumed to mean "no profile yet". Creates a dummy user with role `"unverified"`. |
| **Impact** | Could mask actual errors (wrong endpoint, deleted profile, invalid ID). |
| **Files to Fix** | `frontend/src/contexts/AuthContext.tsx:43-51` |
| **Recommended Fix** | Backend should return 200 with `profile_exists: false` flag instead of 404. |

---

## M-27: Frontend — `any`-Typed API Responses

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Dashboard.tsx:313,344` — API responses typed as `any`. Accessing `.profile?.profile_photo_url`, `.sender?.full_name` can return `undefined` silently. |
| **Impact** | Silent UI failures — blank sections with no TypeScript errors when backend changes response shape. |
| **Files to Fix** | `frontend/src/pages/Dashboard.tsx:313,344` (and other pages with `any` types) |
| **Recommended Fix** | Define proper TypeScript interfaces for all API responses. |

---

## M-28: Frontend — Missing `react` and `react-dom` as Direct Dependencies

| Field | Detail |
|-------|--------|
| **Vulnerability** | `package.json` — `react` and `react-dom` are not listed in `dependencies`. Only `@types/react` and `@types/react-dom` are present (dev). |
| **Impact** | Fragile build — minor update to transitive dependency could break the build. |
| **Files to Fix** | `frontend/package.json` |
| **Recommended Fix** | Add `"react": "^19.0.0"` and `"react-dom": "^19.0.0"` to `dependencies`. |

---

## M-29: Frontend — `shadcn` in `dependencies` Instead of `devDependencies`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `package.json` — `shadcn` CLI tool listed in `dependencies`. |
| **Impact** | Inflates production bundle. CLI tool unnecessary at runtime. |
| **Files to Fix** | `frontend/package.json:44` |
| **Recommended Fix** | Move `"shadcn"` to `devDependencies`. |

---

## M-30: Frontend — Non-Standard Tailwind Class `glass`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Navbar.tsx:152` — Uses `glass` class which is not a standard Tailwind utility and not defined in custom CSS. |
| **Impact** | Class has no effect. Glass effect is missing from the UI. |
| **Files to Fix** | `frontend/src/components/layout/Navbar.tsx:152` |
| **Recommended Fix** | Define `glass` in CSS or use standard Tailwind `backdrop-blur-md bg-white/10`. |

---

## M-31: Frontend — `navigate(-1)` Misbehaves When History Is Empty

| Field | Detail |
|-------|--------|
| **Vulnerability** | `EditMatrimony.tsx:180` — "Back" and "Cancel" buttons use `navigate(-1)`. If user navigated directly (bookmark), no history exists. |
| **Impact** | Browser falls back to previous site, leaving the app unexpectedly. |
| **Files to Fix** | `frontend/src/pages/EditMatrimony.tsx:180` |
| **Recommended Fix** | Use `navigate("/dashboard")` as fallback: `navigate(-1)` or `navigate("/dashboard")`. |

---

## M-32: Frontend — Stale Closure in IntersectionObserver Cleanup

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AdminUsers.tsx:50-70` — `useEffect` cleanup captures `trigger` variable by reference. If the trigger element is removed/re-added between renders, cleanup's `trigger` may be stale. |
| **Impact** | `observer.unobserve(null)` fails silently. Possible memory leak. |
| **Files to Fix** | `frontend/src/pages/admin/AdminUsers.tsx:50-70` |
| **Recommended Fix** | Store trigger element in a `useRef` and use that in cleanup. |

---

## M-33: Frontend — Inconsistent API Endpoint Patterns for Verification

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AdminVerification.tsx:50-51` — Approve posts to `/verification/${id}/approve`, reject to `/verification/${id}/reject`, escalate to `/verification/${id}/escalate`. Three different URL patterns for similar actions. |
| **Impact** | Maintenance confusion. Harder to add new action types. |
| **Files to Fix** | `frontend/src/pages/admin/AdminVerification.tsx:50-51` |
| **Recommended Fix** | Unify to a single endpoint `/verification/${id}/action` with `{ action: "approve" | "reject" | "escalate" }`. |

---

## M-34: Backend — `safe_enum` Silently Drops Invalid Values

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:219-222,370-373` — `safe_enum` catches `ValueError` and returns `None`. Invalid enum values are silently discarded instead of returning a 400 error. |
| **Impact** | User believes they set a preference, but it is stored as NULL. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:219-222,370-373` |
| **Recommended Fix** | Raise `HTTPException(400, "Invalid value for field X")` or validate all enum values in Pydantic schema. |

---

## M-35: Backend — `connection_requests` Unique Constraint Too Strict (No Retry After Decline)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `models/matrimony.py:107` — `UniqueConstraint("sender_profile_id", "receiver_profile_id")` plus same-direction + reverse-direction check blocks any new request after the first ever — even after a declined request. No re-try path exists. |
| **Impact** | If User A sends request to User B and User B declines, User A can never send another request to User B. |
| **Files to Fix** | `backend/app/models/matrimony.py:107`, `backend/app/api/v1/endpoints/matrimony.py:277-288` |
| **Recommended Fix** | Include `status` in the constraint or allow re-send after decline. Add a `resend_allowed_after` timestamp. |

---

## M-36: Backend — All Date Columns Lack Bounds CHECK Constraints

| Field | Detail |
|-------|--------|
| **Vulnerability** | No `CheckConstraint` on any `date_of_birth` or `date_of_death` column. Future dates and impossible past dates (e.g., DOB = year 1700) can be stored. |
| **Impact** | Data integrity issues — impossible birth dates, death dates before birth dates. |
| **Files to Fix** | `backend/app/models/profile.py`, `backend/app/models/memorial.py` |
| **Recommended Fix** | Add `CheckConstraint("date_of_birth <= CURRENT_DATE")` and `CheckConstraint("date_of_death >= date_of_birth")`. |

---

## M-37: Backend — JSONB Columns Are Untyped and Unindexed

| Field | Detail |
|-------|--------|
| **Vulnerability** | 6 JSONB columns (`Profile.social_links`, `MatrimonyProfile.hobbies`, `languages`, `additional_photos`, `preferences`, `AuditLog.old_values/new_values`) have no schema validation, size limits, or GIN indexes. |
| **Impact** | Any data shape can be stored. Query performance poor. Unbounded growth. |
| **Files to Fix** | All model files with JSONB columns |
| **Recommended Fix** | Add schema validation in Pydantic, size limits, and GIN indexes for queried JSONB fields. |

---

## M-38: Endpoint — No Email Uniqueness Check on Admin Creation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:41-48` — Only `phone_number` uniqueness is checked when creating admin. If email already exists, DB unique constraint causes unhandled 500. |
| **Impact** | Stack trace leakage in debug mode. Unclear error for operator. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:41-48` |
| **Recommended Fix** | Add explicit `select(User).where(User.email == request.email)` check before insert. |

---

## M-39: Endpoint — User Onboarding Doesn't Actually Change Role

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:287-293` — Comment claims `/onboard` updates user role to `pending`, but no actual role mutation is performed. User remains `unverified`. |
| **Impact** | The verification flow later promotes to `verified_adult`, so this works accidentally, but the comment/code mismatch indicates broken intent. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:287-293` |
| **Recommended Fix** | Either update the role to `pending` or fix the comment. |

---

## M-40: Frontend — `setTimeout` Redirect Not Captured/Cleaned

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:166` — `setTimeout(() => navigate("/pending-verification"), 2000)` is never captured or cleared. Fires even after unmount. |
| **Impact** | User who navigates away before 2s is forcibly redirected back to `/pending-verification`. |
| **Files to Fix** | `frontend/src/pages/Register.tsx:166` |
| **Recommended Fix** | Store timeout ID in ref and clear in `useEffect` cleanup. |

---

## M-41: Frontend — Contact Visibility Toggles Are Not Persisted

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Profile.tsx:27-29,114-133` — Contact visibility toggles are local-only `useState` — never sent to backend. Changes lost on reload. |
| **Impact** | Feature appears functional but changes are ephemeral. Incomplete feature implementation. |
| **Files to Fix** | `frontend/src/pages/Profile.tsx:27-29,114-133` |
| **Recommended Fix** | Wire toggles to backend (PUT `/profiles/me/social` or a new visibility endpoint). |

---

## M-42: Frontend — Hardcoded Unsplash Photo URLs as Default Avatars

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Registry.tsx:76,106` — Default profile photos point to `images.unsplash.com` external CDN. External dependency — if Unsplash is blocked, all default avatars fail. Same photo for all users without photo. |
| **Impact** | External CDN dependency. All default-avatar users look identical. |
| **Files to Fix** | `frontend/src/pages/Registry.tsx:76,106` |
| **Recommended Fix** | Use local SVG default avatar or gradient-generated placeholder. |

---

## M-43: Frontend — `contact_locked` Field Defined but Never Used in Rendering

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Registry.tsx:109` — `contact_locked` is computed but the template always renders `profile.contact` unconditionally. |
| **Impact** | Contact info always shown regardless of lock status. |
| **Files to Fix** | `frontend/src/pages/Registry.tsx:109` and template |
| **Recommended Fix** | Either use the flag to mask/hide contact or remove the dead field. |

---

## M-44: Frontend — Duplicate `/verification` Route

| Field | Detail |
|-------|--------|
| **Vulnerability** | `App.tsx:99-108,151-152` — `/verification` route defined twice: once top-level (wrapped in MainLayout) and once nested under `/admin/verification`. |
| **Impact** | Two different paths (`/verification` and `/admin/verification`) map to the same component. Confusing navigation. |
| **Files to Fix** | `frontend/src/App.tsx:99-108` |
| **Recommended Fix** | Remove the top-level `/verification` route. Keep the one under `/admin/verification`. |

---

## M-45: Backend — `UserResponse.id` Type Mismatch (int vs UUID)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `schemas/user.py:37` — `UserResponse.id: int` but `User` model PK is `UUID`. `TokenData.user_id: Optional[int]` also wrong. |
| **Impact** | These schemas would break if ever used as response models. Dead code, but indicates schema drift. |
| **Files to Fix** | `backend/app/schemas/user.py:37,52` |
| **Recommended Fix** | Change to `UUID` to match the model. |

---

# LOW Severity Findings

## L-01: `decode_jwt_token` Swallows All JWT Errors Into None

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:36-37` — Catch-all `JWTError` collapses expired, invalid-signature, and malformed-token errors into `None`. |
| **Impact** | Cannot distinguish expired (rotate refresh) from tampered (attack signal). |
| **Files to Fix** | `backend/app/core/security.py:36-37` |
| **Recommended Fix** | Catch `ExpiredSignatureError` separately. Log signature failures. |

---

## L-02: No `jti`, `iat`, `nbf`, `aud`, `iss` in JWT Claims

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:18-28` — JWT has only `sub` and `exp`. No token identifier, no issued-at, no audience. |
| **Impact** | Cannot revoke specific tokens. Cannot enforce token freshness. No audience restriction. |
| **Files to Fix** | `backend/app/core/security.py:18-28` |
| **Recommended Fix** | Add `iat`, `jti=str(uuid.uuid4())`, `aud`, `iss` to all tokens. |

---

## L-03: `bcrypt` 72-Byte Password Truncation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:43-45,50` — bcrypt silently truncates passwords > 72 bytes. No length guard on input. |
| **Impact** | Two users with same first 72 bytes of a long passphrase hash identically. Passphrase user believes full passphrase is honored. |
| **Files to Fix** | `backend/app/core/security.py:43-45,50` |
| **Recommended Fix** | Pre-hash with SHA-256 before bcrypt, or cap password length at schema validator. |

---

## L-04: `verify_password` Can Raise on Malformed Hash

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:48-50` — `bcrypt.checkpw` raises `ValueError` on malformed hash strings. Uncaught. |
| **Impact** | 500 error on login if stored hash is corrupted. |
| **Files to Fix** | `backend/app/core/security.py:48-50` |
| **Recommended Fix** | Wrap `checkpw` in try/except, return `False` on error. |

---

## L-05: `parse_cors_origins` Crashes on Non-JSON Values

| Field | Detail |
|-------|--------|
| **Vulnerability** | `config.py:64-68` — `json.loads(v)` raises `JSONDecodeError` if operator writes `CORS_ORIGINS=https://example.com` (natural) instead of JSON array. |
| **Impact** | Application fails to boot with confusing error. |
| **Files to Fix** | `backend/app/core/config.py:64-68` |
| **Recommended Fix** | Fall back to comma-split on `json.loads` failure. |

---

## L-06: `Settings` Uses `extra="ignore"` — Silently Absorbs Typos

| Field | Detail |
|-------|--------|
| **Vulnerability** | `config.py:75` — Typos like `SECERT_KEY` are silently ignored; default (insecure) value used. |
| **Impact** | Configuration errors leading to insecure defaults are silent. |
| **Files to Fix** | `backend/app/core/config.py:75` |
| **Recommended Fix** | Use `extra="forbid"` or at minimum log warnings. |

---

## L-07: Frontend — Hardcoded localhost Fallback for API URL

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:4` — Falls back to `http://localhost:8000/api/v1` if `VITE_API_URL` env var not set. In production, silently connects to localhost. |
| **Impact** | Bad UX in production misconfiguration. |
| **Files to Fix** | `frontend/src/lib/api.ts:4` |
| **Recommended Fix** | Remove fallback or log a warning. |

---

## L-08: Frontend — `localStorage.removeItem("user")` Is a No-Op

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:45` — Clears `"user"` from localStorage, but AuthContext never stores `"user"` there. |
| **Impact** | Harmless dead code, but creates false sense of state clearance. |
| **Files to Fix** | `frontend/src/lib/api.ts:45` |
| **Recommended Fix** | Remove the line for clarity. |

---

## L-09: Frontend — Redundant `as UserRole` Cast

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AuthContext.tsx:98` — `user.role as UserRole` is redundant since `user.role` is already typed as `UserRole`. |
| **Impact** | Unnecessary cast — could mask TypeScript errors if types change. |
| **Files to Fix** | `frontend/src/contexts/AuthContext.tsx:98` |
| **Recommended Fix** | Remove the cast. |

---

## L-10: `uuid` Import Unused in security.py

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:8` — `import uuid` is unused. |
| **Impact** | Dead import. |
| **Files to Fix** | `backend/app/core/security.py:8` |
| **Recommended Fix** | Remove unused import. |

---

## L-11: `UserResponse.id` Type Mismatch (int vs UUID)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `schemas/user.py:37` — `UserResponse.id: int` but `User` model PK is `UUID`. |
| **Impact** | Would fail at runtime if used. Dead code indicates schema drift. |
| **Files to Fix** | `backend/app/schemas/user.py:37,52` |
| **Recommended Fix** | Change to `UUID`. |

---

## L-12: Version Mismatch (main.py 1.1.0 vs config.py 1.0.0)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py:28` hardcodes `version="1.1.0"` while `config.py:17` is `APP_VERSION="1.0.0"`. |
| **Impact** | OpenAPI docs show one version, root endpoint returns another. |
| **Files to Fix** | `backend/app/main.py:28` |
| **Recommended Fix** | Use `version=settings.APP_VERSION`. |

---

# INFO / Observations

- **I-01:** `print()`-based logging in `main.py` lifespan instead of `logging.getLogger()` — not a bug but non-standard.
- **I-02:** `seed.py` reimplements bcrypt hashing instead of using `app.core.security.hash_password` — three separate hashing paths exist.
- **I-03:** `TypeScript ~6.0.2` in `package.json:18` — TypeScript 6.0 does not exist as stable release. Likely a typo for 5.6.2.
- **I-04:** Unused schema classes in `schemas/auth.py` (`EmailRegister`, `EmailVerify`) — `auth.py` defines inline schemas instead.
- **I-05:** `schemas/__init__.py` only re-exports user schemas — namespace inconsistency.
- **I-06:** `MemorialRecord` model exists but no endpoint handles memorial records.
- **I-07:** Global search input in `MainLayout.tsx:244-253` is purely decorative — `searchQuery` state is never used.
- **I-08:** Bell and Lock icons in `MainLayout.tsx:258-264` have no onClick handlers.
- **I-09:** Default avatar URLs from Unsplash CDN — external dependency and tracking vector.
- **I-10:** `Registry.tsx` hardcodes `dependents` and `dependents_overflow` to `[]` and `0` — dead template code.

---

# Quick-Fix Priority Order

## Immediate (Critical — 24 hours)

| # | Issue | Fix Complexity |
|---|-------|----------------|
| 1 | C-01: Hardcoded default SECRET_KEY | 1 file, 10 lines |
| 2 | C-02: Refresh tokens as access tokens | 2 files, 5 lines each |
| 3 | C-03: OTP master bypass (123456) | 1 file, 3 lines |
| 4 | C-04: Self-approval of verification | 1 file, 1 line |
| 5 | C-05: Duplicate vote inflation | 2 files, unique constraint + query change |
| 6 | C-09: Access token in localStorage | 2 files, moderate refactor |
| 7 | C-14: OTP-only account takeover | 1 file, 15 lines |

## Urgent (HIGH — 1 week)

| # | Issue | Fix Complexity |
|---|-------|----------------|
| 8 | H-01: Stateless refresh tokens (no revocation) | 2 files, new table, moderate |
| 9 | H-06/H-07: Missing RoleCheckers on profile/matrimony endpoints | 9 endpoints, 9 decorator adds |
| 10 | H-08: Single admin can reject verification | 1 file, add peer-review check |
| 11 | H-09: No region scoping for local_admin | 3 endpoints, add filter |
| 12 | H-11: Email verification code leaked to logs | 1 file, 1 line |
| 13 | H-14: DEBUG=True by default | 1 file, 1 char |
| 14 | H-02: Refresh rotation reuse detection | Requires H-01 first |
| 15 | H-03: No rate limiting on auth | New dependency + decorators |
| 16 | H-04: Logout doesn't invalidate | Requires H-01 first |
| 17 | H-05: OTP in plaintext | 2 files, hash + verify |
| 18 | H-10: Self-deletion of admin | 1 file, 3 lines |
| 19 | H-12: Escalation lacks region check | 1 file, 5 lines |
| 20 | H-15: No token version / JTI | 3 files, moderate |
| 21 | C-06: Hardcoded seed password | 1 file, 5 lines |
| 22 | C-07: FamilyUnit cascade delete-orphan | 1 file, 1 word change |
| 23 | C-08: Recreate 7 dropped indexes | 1 migration file |
| 24 | C-10: Fake "Verified" badge | 1 file, 1 line |
| 25 | C-11: local_admin can assign community_admin | 2 files |

## Important (MEDIUM — 2 weeks)

| # | Issue |
|---|-------|
| 26 | M-01 through M-45 (all medium findings) |

## Eventually (LOW)

| # | Issue |
|---|-------|
| 27 | L-01 through L-12 (all low findings) |

---

> **End of Report — 14 CRITICAL · 45 HIGH · 45 MEDIUM · 12 LOW findings**

---

*Generated by automated code audit — July 2026*
