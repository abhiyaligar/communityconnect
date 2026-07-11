# CommunityConnect — Bug & Vulnerability Report

> **Category:** Open Findings
> **Count:** 81 findings

---

## H-01 🔴 Stateless Refresh Tokens — No Server-Side Revocation

| Field | Detail |
|-------|--------|
| **Vulnerability** | Refresh tokens are JWTs with no `jti`, no server-side state, no blocklist, no `token_version` on User model. They cannot be revoked. Logout only deletes the client cookie. |
| **Impact** | Stolen refresh token (via XSS, log leak, cookie theft) remains valid for 7 days even after the user logs out or changes password. |
| **Files to Fix** | `backend/app/core/security.py:18-28` • `backend/app/api/v1/endpoints/auth.py:259-265` |
| **Recommended Fix** | Make refresh tokens opaque random tokens stored in a `refresh_tokens` table with `user_id`, `expires_at`, `revoked_at`. On rotation, detect reuse. On logout, revoke server-side. |
| **Status** | 🔴 Not fixed |


---

## H-02 🔴 Refresh Token Rotation Has No Reuse Detection

| Field | Detail |
|-------|--------|
| **Vulnerability** | `/token/refresh` issues a new JWT but the old one remains valid. There is no server-side record of which token was rotated. Attacker and legitimate user can both use the same stolen token simultaneously. |
| **Impact** | Token rotation is theater — attacker who steals one refresh cookie can mint an unlimited chain of tokens without detection. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:228-281` |
| **Recommended Fix** | Store refresh tokens in DB. On rotation, mark old token as `rotated`. If a `rotated` token is presented again, revoke the entire token family. |
| **Status** | 🔴 Not fixed |


---

## H-04 🔴 Logout Does Not Invalidate Any Token

| Field | Detail |
|-------|--------|
| **Vulnerability** | `logout` only calls `response.delete_cookie(key="refresh_token")`. It does not revoke the refresh JWT server-side, does not bump `token_version`, does not clear the access token. |
| **Impact** | After logout, access token remains valid for 30 min. Refresh token (stolen earlier) remains valid for 7 days. Logout button is security theater. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:283-289` |
| **Recommended Fix** | Accept the refresh token, revoke its server-side row, bump user's `token_version` to invalidate all access tokens immediately. |
| **Status** | 🔴 Not fixed |


---

## H-06 🔴 Missing Role Checks on All Profile PUT Endpoints

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:350-467` — Four PUT endpoints (`/me`, `/me/matrimony`, `/me/username`, `/me/social`) use only `get_current_user` without `RoleChecker`. Any authenticated user including `unverified` can modify all profile fields. |
| **Impact** | Unverified users can access matrimony features, set co-approvers, change username, and update social links before admin approval. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:350,394,567,596` |
| **Recommended Fix** | Add `Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))` to all four endpoints. |
| **Status** | 🔴 Not fixed |


---

## H-08 🔴 Single Admin Can Reject Any Verification (No Peer Review for Rejection)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:217-252` — Unlike approvals (which require 4 peer votes for local_admin targets), a SINGLE local_admin can reject any verification request immediately. |
| **Impact** | A rogue local_admin can systematically reject all pending verification requests in their region, locking users out of the platform. No appeal mechanism. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:248` |
| **Recommended Fix** | Require the same 4-vote threshold for rejection, or require community_admin override for any rejection. |
| **Status** | 🔴 Not fixed |


---

## H-12 🔴 Escalation Lacks Region-Scoping Check

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:255-278` — The escalate endpoint is gated to `local_admin` but there is no check that the verification request belongs to the admin's assigned region. |
| **Impact** | A local_admin from region A can escalate requests from region B, interfering with other admins' workflows and overloading the community admin. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:266-272` |
| **Recommended Fix** | Verify that `req.region_id` is in the current admin's assigned region IDs before allowing escalation. |
| **Status** | 🔴 Not fixed |


---

## H-13 🔴 User Enumeration via Registration Endpoint

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:50-54` — `/register/email` returns 400 "Email is already registered" vs 200 "Verification code sent". An attacker can enumerate the user base. |
| **Impact** | Privacy breach — attacker can confirm which emails are registered on the platform. Enables targeted phishing, credential stuffing. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:50-54` |
| **Recommended Fix** | Return the same neutral message regardless of whether the email exists. |
| **Status** | 🔴 Not fixed |


---

## H-15 🔴 No Token Version / JTI — Revoked Tokens Remain Valid

| Field | Detail |
|-------|--------|
| **Vulnerability** | `deps.py:26-78` — `get_current_user` only checks user exists + is_active. There is no `token_version` or `jti` lookup. Password changes, role downgrades, or admin deactivation take up to `ACCESS_TOKEN_EXPIRE_MINUTES` (30 min) to take effect (unless `is_active=False`). |
| **Impact** | Privilege removal is delayed by up to 30 minutes. A demoted admin still has full API access during that window. |
| **Files to Fix** | `backend/app/api/deps.py:26-78` |
| **Recommended Fix** | Add `token_version` column to User. Embed as JWT claim. Compare on every request. Bump on role change / password change. |
| **Status** | 🔴 Not fixed |


---

## H-16 🔴 Frontend — Dead Routes in Sidebar (Settings / Support)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `MainLayout.tsx:90-91` — The sidebar contains `NavLink` entries for `/settings` and `/support`. The `/support` route does not exist in `App.tsx` and renders 404. |
| **Impact** | Users clicking "Support" see a 404 page. Damages trust in navigation. |
| **Files to Fix** | `frontend/src/components/layout/MainLayout.tsx:90-91` |
| **Recommended Fix** | Either implement the routes or remove the dead links. |
| **Status** | 🔴 Not fixed |


---

## H-17 🔴 Frontend — Direct localStorage Write in Register Bypasses AuthContext State

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:240` writes token directly to `localStorage` without calling `login()` from AuthContext. React state (`token`, `user`) is NOT updated. |
| **Impact** | Components checking `isAuthenticated` see stale `false` state between OTP verify and onboard steps. Inconsistent auth state. |
| **Files to Fix** | `frontend/src/pages/Register.tsx:240` |
| **Recommended Fix** | Call `login(res.data.access_token, ...)` instead of manual localStorage write. |
| **Status** | 🔴 Not fixed |


---

## H-18 🔴 Frontend — No Refresh-Token Race-Condition Lock

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:58-76` — When multiple parallel API calls trigger 401, each fires a separate refresh request concurrently. No mutex/lock. |
| **Impact** | Multiple refresh calls can race, causing token thrashing and potentially invalidating each other. |
| **Files to Fix** | `frontend/src/lib/api.ts:58-76` |
| **Recommended Fix** | Implement a promise queue/mutex: cache the in-flight refresh promise and share it across concurrent 401s. |
| **Status** | 🔴 Not fixed |


---

## H-19 🔴 Frontend — Stale AuthContext State Not Cleared on Refresh Failure

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:70-74` — On refresh failure, the interceptor clears localStorage and redirects, but does NOT reset AuthContext's React state (`setToken(null)`). |
| **Impact** | Brief flash of stale user data during redirect from protected route to login. |
| **Files to Fix** | `frontend/src/lib/api.ts:70-74` |
| **Recommended Fix** | Call a callback to also clear React state. Export a global `forceLogout()` function that AuthProvider listens to. |
| **Status** | 🔴 Not fixed |


---

## H-20 🔴 Frontend — login() Stores Token Before Profile Fetch

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AuthContext.tsx:81-82` — `login` writes token to localStorage before fetching `/profiles/me`. If profile fetch fails, token is committed but user is `null`. |
| **Impact** | User stuck with stale token — cannot recover without manually clearing localStorage. Sees "Invalid email or password" error even with correct password. |
| **Files to Fix** | `frontend/src/contexts/AuthContext.tsx:81-82` |
| **Recommended Fix** | Don't write token until profile fetch succeeds, or implement rollback. |
| **Status** | 🔴 Not fixed |


---

## H-21 🔴 Frontend — Registry Shows Matrimony Matches, Not Actual Registry

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Registry.tsx:57` — For non-admin users, data is fetched from `/matrimony/matches` instead of a registry endpoint. The "Community Registry" page displays matrimony profiles, not the full community directory. |
| **Impact** | Users see only matrimony-opted-in members when expecting the full community. Critical misdirection bug. |
| **Files to Fix** | `frontend/src/pages/Registry.tsx:57` |
| **Recommended Fix** | Create a dedicated `/profiles/registry` endpoint returning all verified members with masked contact info. |
| **Status** | 🔴 Not fixed |


---

## H-22 🔴 Frontend — AdminSidebar Component Is Dead Code

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AdminSidebar.tsx` (entire file) is never imported anywhere in the codebase. The admin routes use `AdminShell.tsx` which uses `MainLayout.tsx`, not `AdminSidebar`. |
| **Impact** | Dead, rotting code. Maintenance burden; confusion for future developers. |
| **Files to Fix** | `frontend/src/components/layout/AdminSidebar.tsx` |
| **Recommended Fix** | Delete the file if it's truly unused (verify via grep first). |
| **Status** | 🔴 Not fixed |


---

## H-23 🔴 Endpoint — Sender's Double-Approval Bypass in Matrimony

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:316-324` — When creating a connection request, only the **receiver's** `double_approval_required` is checked. The **sender's** co-approver is ignored entirely. |
| **Impact** | A user with `double_approval_required=True` and an unapproved co-approver can send requests without their own guardian's knowledge. |
| **Files to Fix** | `backend/app/api/v1/endpoints/matrimony.py:316-324` |
| **Recommended Fix** | Check both sender and receiver `double_approval_required` settings before allowing the request. |
| **Status** | 🔴 Not fixed |


---

## H-24 🔴 Endpoint — Admin User List Has No Max Limit

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:175` — The `limit` parameter has no maximum bound. A caller can set `limit=1000000` to dump the entire user database in one request. |
| **Impact** | Any admin can extract the entire user database (names, phones, DOBs, addresses, roles) in a single API call. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:175` |
| **Recommended Fix** | Add `Field(le=100)` to the `limit` parameter or validate in the handler. |
| **Status** | 🔴 Not fixed |


---

## H-25 🔴 Endpoint — Co-Approver Assignment Without Consent

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:439-448` — Any user can set `family_co_approver_profile_id` to any other profile's UUID with no consent check. Only existence is verified. |
| **Impact** | User A can force User B to appear as a co-approver. User B gets unwanted invitations and must manually decline. Repetition causes harassment. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:439-448` |
| **Recommended Fix** | Require co-approver to generate an invite code or accept first before assignment is stored. |
| **Status** | 🔴 Not fixed |


---

## H-26 🔴 Endpoint — Admin Self-Editing and Self-Demotion

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:226-268` — A community_admin can `PUT /admin/users/{user_id}` on their own `user_id` to change their own `role` and `is_active`. |
| **Impact** | Admin could accidentally deactivate themselves or set `role=verified_adult`, losing admin privileges with no recovery. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:255` |
| **Recommended Fix** | Prevent self-demotion: `if current_admin.id == user_id and request.role != UserRole.community_admin: raise HTTPException(400)` |
| **Status** | 🔴 Not fixed |


---

## H-27 🔴 Endpoint — Verification Race Condition in Vote Counting

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:192-210` — Vote counting query and status update are not in a locked transaction. Two concurrent approvals can both see `vote_count < 4` and miss the threshold transition. |
| **Impact** | Verification requests can get stuck at `local_approved` indefinitely even with enough votes. Requires manual community_admin intervention. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:192-210` |
| **Recommended Fix** | Use `select ... for update` on the `VerificationRequest` row before counting and updating status. |
| **Status** | 🔴 Not fixed |


---

## H-28 🔴 Frontend — Non-Functional "Pending Approvals" and "Guardian View" Tabs

| Field | Detail |
|-------|--------|
| **Vulnerability** | `MatrimonyRequests.tsx` — Three tabs are rendered ("Inbox", "Pending Approvals", "Guardian View"), but only "Inbox" has content. The other two are dead with placeholder text. "Add Guardian" button has no `onClick`. |
| **Impact** | Misleading UX — users see tabs they can't use. Creates false expectations. |
| **Files to Fix** | `frontend/src/pages/MatrimonyRequests.tsx` |
| **Recommended Fix** | Implement the tab content or remove the dead tabs/buttons. |
| **Status** | 🔴 Not fixed |


---

## M-01 🔴 CORS Origins Hardcoded and Ignoring Config

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py:66-69` hardcodes `allow_origins=["https://communityconnect-alpha.vercel.app","http://localhost:5173"]` but `config.py:36` defines `CORS_ORIGINS` which is never used. Two sources of truth. |
| **Impact** | Changing CORS origins in `.env` has no effect. Operators may think they've configured CORS when they haven't. |
| **Files to Fix** | `backend/app/main.py:66-69`, `backend/app/core/config.py:36` |
| **Recommended Fix** | Use `settings.CORS_ORIGINS` in `main.py`. Add validator forbidding `["*"]` when `allow_credentials=True`. |
| **Status** | 🔴 Not fixed |


---

## M-02 🔴 Swagger/ReDoc Exposed in Production

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py:42-43` — `docs_url="/docs"` and `redoc_url="/redoc"` are set with no environment gating. Production exposes the full OpenAPI schema. |
| **Impact** | Information disclosure — attackers can enumerate every endpoint, read schemas, and understand the attack surface. |
| **Files to Fix** | `backend/app/main.py:42-43` |
| **Recommended Fix** | In production: `docs_url=None, redoc_url=None, openapi_url=None`. |
| **Status** | 🔴 Not fixed |


---

## M-04 🔴 `get_db` Commits After Every Request (Even GETs)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `session.py:35-48` — The dependency commits unconditionally after every route handler, even read-only GETs. Any accidental ORM mutation on a fetched object silently persists. |
| **Impact** | Silent, unintended writes to user records if any code path accidentally dirties a fetched object. Authorization integrity risk. |
| **Files to Fix** | `backend/app/db/session.py:35-48` |
| **Recommended Fix** | Separate read-only vs write sessions, or commit only in handlers that mutate. |
| **Status** | 🔴 Not fixed |


---

## M-05 🔴 SQL Echo in Production Exposes Bound Parameters

| Field | Detail |
|-------|--------|
| **Vulnerability** | `session.py:16` — `echo=settings.DEBUG` (default True) prints all SQL queries with bound parameters to stdout/logs. |
| **Impact** | PII (emails, phones), OTP codes, and UUIDs are logged in plaintext. Compliance violation. |
| **Files to Fix** | `backend/app/db/session.py:16` |
| **Recommended Fix** | Disable echo in production: `echo=settings.DEBUG and settings.ENVIRONMENT == "development"`. |
| **Status** | 🔴 Not fixed |


---

## M-06 🔴 No `pool_pre_ping` on DB Engine

| Field | Detail |
|-------|--------|
| **Vulnerability** | `session.py:14-20` — Engine created without `pool_pre_ping=True`. Stale connections from DB restart or idle timeout cause errors. |
| **Impact** | Intermittent 500 errors after database maintenance or restart. |
| **Files to Fix** | `backend/app/db/session.py:14-20` |
| **Recommended Fix** | Add `pool_pre_ping=True` to `create_async_engine`. |
| **Status** | 🔴 Not fixed |


---

## M-07 🔴 In-Memory OTP Store (Lost on Restart, No Cross-Worker Support)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `services/otp.py:18-21` — OTPs stored in `_otp_store: Dict[str, Tuple[str, float]]` — a module-level dict. Per-process only. Lost on restart. Doesn't work across multiple uvicorn workers. |
| **Impact** | OTP verification breaks under multi-worker deployment. Server restart wipes all pending OTPs. |
| **Files to Fix** | `backend/app/services/otp.py:18-21` |
| **Recommended Fix** | Use Redis or another persistent cache for OTP storage. |
| **Status** | 🔴 Not fixed |


---

## M-08 🔴 OTP Rate-Limit Exhaustion (DoS on Legitimate Users)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `services/otp.py:68-88` — Rate limit is max 3 OTPs per 15 minutes per phone number. Attacker can deliberately exhaust the limit for a target's phone. |
| **Impact** | Denial of service — legitimate user cannot receive OTP for 15 minutes. |
| **Files to Fix** | `backend/app/services/otp.py:68-88` |
| **Recommended Fix** | Use persistent store (Redis). Lower retry cooldown to 1 minute. Limit is on generation, not verification. |
| **Status** | 🔴 Not fixed |


---

## M-09 🔴 Cookie Security Flags — `Secure=False` in Non-Production

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:163-170,212-219,267-274,422-429` — `secure=True if settings.ENVIRONMENT == "production" else False`. String comparison is brittle — `ENVIRONMENT="staging"` or `"prod"` silently disables secure flag. |
| **Impact** | Refresh cookie sent over HTTP in non-production environments. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:163,212,267,422` |
| **Recommended Fix** | Add `Secure=True` whenever request is HTTPS. Use `samesite="strict"`. |
| **Status** | 🔴 Not fixed |


---

## M-10 🔴 Login Endpoint Leaks Account Status

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:190-200` — Separate messages: "Incorrect email or password" vs "User account is inactive". An attacker who knows the password sees different messages for active vs inactive accounts. |
| **Impact** | Account enumeration and password confirmation. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:190-200` |
| **Recommended Fix** | Single generic message for all login failure cases. |
| **Status** | 🔴 Not fixed |


---

## M-11 🔴 `/token/refresh` Can 500 on Malformed `sub`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:248` — `uuid.UUID(user_id)` can raise `ValueError` (if malformed). No try/except wrapper (unlike `deps.py:52-59` which does guard). |
| **Impact** | Unhandled 500 error with potential traceback in debug mode. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:248` |
| **Recommended Fix** | Mirror `deps.py:52-59` — validate `user_id is not None`, parse in try/except, return 401 on failure. |
| **Status** | 🔴 Not fixed |


---

## M-12 🔴 No Password Min-Length Validation on Registration

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:30-37` — Inline `EmailOTPRequest` and `EmailOTPVerify` schemas have `password: str` with no `min_length`. The `EmailVerify` schema in `schemas/auth.py` (which has `min_length=8`) is never imported — it's dead code. |
| **Impact** | Users can register with empty or trivially short passwords. Password policy is not enforced. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:30-37` |
| **Recommended Fix** | Use the schemas from `app.schemas.auth` (which have min_length). Add max_length (128) and strength validation. |
| **Status** | 🔴 Not fixed |


---

## M-13 🔴 Duplicate User Race — No Exception Handling on UniqueViolation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:132-148` — Check-then-insert pattern for user creation is not atomic. Two concurrent requests can both pass the SELECT, and the second INSERT raises unhandled `UniqueViolationError` → 500. |
| **Impact** | Opaque 500 errors on legitimate retry. Account creation race condition. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:132-148` |
| **Recommended Fix** | Use `INSERT ... ON CONFLICT (email) DO NOTHING RETURNING id`, or wrap in try-except for `IntegrityError` returning 409. |
| **Status** | 🔴 Not fixed |


---

## M-14 🔴 /onboard Endpoint Has No Role Check

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:193-347` — Onboard endpoint uses only `get_current_user`. If a profile is ever deleted, any authenticated user (including admin) could re-onboard. |
| **Impact** | Inconsistent user state — admin could accidentally create a second profile. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:193` |
| **Recommended Fix** | Add `Depends(RoleChecker([UserRole.unverified]))` or check `current_user.role` explicitly. |
| **Status** | 🔴 Not fixed |


---

## M-15 🔴 Mass-Assignment via `setattr` Loop in Matrimony Update

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:456-460` — `setattr(mat_prof, key, value)` loop dumps all fields from schema. If a field like `opted_in: bool` is added to the schema in the future, it's writable without explicit handling. |
| **Impact** | Future developer could accidentally expose internal fields. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:456-460` |
| **Recommended Fix** | Use an allowlist of handled fields, or `exclude={"opted_in", "profile_id", "created_at", "updated_at"}`. |
| **Status** | 🔴 Not fixed |


---

## M-16 🔴 No Duplicate-Phone Check on Profile Update

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:386-388` — When updating `contact_number`, no uniqueness check against other profiles. DB column lacks unique constraint. |
| **Impact** | Multiple users can have the same contact number, enabling impersonation or receiving another user's verification codes. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:386-388` |
| **Recommended Fix** | Add uniqueness check before assignment, or add DB unique constraint. |
| **Status** | 🔴 Not fixed |


---

## M-17 🔴 Race Condition on Connection Request Creation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:302-333` — Existing-request check and INSERT are not atomic. Two concurrent requests can both pass the check, with DB unique constraint catching the second as an unhandled IntegrityError (500). |
| **Impact** | 500 error on rapid double-click or automated script. |
| **Files to Fix** | `backend/app/api/v1/endpoints/matrimony.py:302-333` |
| **Recommended Fix** | Wrap in try-except for `IntegrityError`, or use `select ... for update` to lock the check. |
| **Status** | 🔴 Not fixed |


---

## M-19 🔴 PII Exposure to Local Admins in Pending Verification List

| Field | Detail |
|-------|--------|
| **Vulnerability** | `verification.py:109-110` — Pending verification response includes `contact_number` and `address` for all candidates in the list view. Exposed to all local admins. |
| **Impact** | Compromised or malicious local_admin can scrape contact numbers and addresses for all pending users in their region. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:109-110` |
| **Recommended Fix** | Only expose contact details on a per-request "review" endpoint. Mask/omit in list view. |
| **Status** | 🔴 Not fixed |


---

## M-20 🔴 `generate_unique_username` Race Condition

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:41-53` — While-loop checks DB for username uniqueness then returns. No unique constraint guarantee at INSERT time (column IS unique, but check-then-set is non-atomic). |
| **Impact** | Two concurrent registrations could get the same username — one will fail at INSERT with 500. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:41-53` |
| **Recommended Fix** | Use `INSERT ... ON CONFLICT (username) DO UPDATE` pattern, or generate UUID-based usernames with no collision risk. |
| **Status** | 🔴 Not fixed |


---

## M-21 🔴 Enum Columns Stored as Plain String (Data Integrity)

| Field | Detail |
|-------|--------|
| **Vulnerability** | Multiple `MatrimonyProfile` fields (`body_type`, `complexion`, `diet`, `education_level`, etc.) are stored as plain `String` columns. No DB-level CHECK constraints enforce valid enum values. |
| **Impact** | Arbitrary strings can be stored, breaking data integrity. |
| **Files to Fix** | `backend/app/models/matrimony.py:22-75` |
| **Recommended Fix** | Use SQLAlchemy `Enum` type or add `CheckConstraint` for each field. |
| **Status** | 🔴 Not fixed |


---

## M-23 🔴 Frontend — "Not provided" Sent as Address Default

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:304` — When no address provided, the string `"Not provided"` is sent to the backend and stored as a real address value. |
| **Impact** | Database pollution — cannot distinguish between "no address provided" and "address is literally 'Not provided'". |
| **Files to Fix** | `frontend/src/pages/Register.tsx:304` |
| **Recommended Fix** | Send `null` or omit the field. |
| **Status** | 🔴 Not fixed |


---

## M-24 🔴 Frontend — `(user as any)?.email` Bypasses TypeScript Safety

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Profile.tsx:105` — Casts user to `any` to access `email` which is not in the `AuthUser` type. If backend stops returning email, this silently becomes `undefined`. |
| **Impact** | Silent UI failure — shows "—" instead of email with no TypeScript error. |
| **Files to Fix** | `frontend/src/pages/Profile.tsx:105` |
| **Recommended Fix** | Add `email?: string` to the `AuthUser` interface in `types/index.ts`. |
| **Status** | 🔴 Not fixed |


---

## M-25 🔴 Frontend — Misleading Error Message on Login

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Login.tsx:72` — If login POST succeeds but profile GET fails, the error says "Invalid email or password" which is incorrect. |
| **Impact** | User with correct credentials sees wrong error message. Confusing UX. |
| **Files to Fix** | `frontend/src/pages/Login.tsx:72` |
| **Recommended Fix** | Differentiate between auth failure and profile fetch failure. |
| **Status** | 🔴 Not fixed |


---

## M-26 🔴 Frontend — 404 Treated as "No Profile" in AuthContext

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AuthContext.tsx:56-63` — Any 404 from `/profiles/me` is assumed to mean "no profile yet". Creates a dummy user with role `"unverified"`. |
| **Impact** | Could mask actual errors (wrong endpoint, deleted profile, invalid ID). |
| **Files to Fix** | `frontend/src/contexts/AuthContext.tsx:56-63` |
| **Recommended Fix** | Backend should return 200 with `profile_exists: false` flag instead of 404. |
| **Status** | 🔴 Not fixed |


---

## M-27 🔴 Frontend — `any`-Typed API Responses

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Dashboard.tsx:258` — API responses typed as `any`. Accessing `.profile?.profile_photo_url`, `.sender?.full_name` can return `undefined` silently. |
| **Impact** | Silent UI failures — blank sections with no TypeScript errors when backend changes response shape. |
| **Files to Fix** | `frontend/src/pages/Dashboard.tsx:258` (and other pages with `any` types) |
| **Recommended Fix** | Define proper TypeScript interfaces for all API responses. |
| **Status** | 🔴 Not fixed |


---

## M-28 🔴 Frontend — Missing `react` and `react-dom` as Direct Dependencies

| Field | Detail |
|-------|--------|
| **Vulnerability** | `package.json` — `react` and `react-dom` are not listed in `dependencies`. Only `@types/react` and `@types/react-dom` are present (dev). |
| **Impact** | Fragile build — minor update to transitive dependency could break the build. |
| **Files to Fix** | `frontend/package.json` |
| **Recommended Fix** | Add `"react": "^19.0.0"` and `"react-dom": "^19.0.0"` to `dependencies`. |
| **Status** | 🔴 Not fixed |


---

## M-29 🔴 Frontend — `shadcn` in `dependencies` Instead of `devDependencies`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `package.json:44` — `shadcn` CLI tool listed in `dependencies`. |
| **Impact** | Inflates production bundle. CLI tool unnecessary at runtime. |
| **Files to Fix** | `frontend/package.json:44` |
| **Recommended Fix** | Move `"shadcn"` to `devDependencies`. |
| **Status** | 🔴 Not fixed |


---

## M-30 🔴 Frontend — Non-Standard Tailwind Class `glass`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Navbar.tsx:152` — Uses `glass` class which is not a standard Tailwind utility and not defined in custom CSS. |
| **Impact** | Class has no effect. Glass effect is missing from the UI. |
| **Files to Fix** | `frontend/src/components/layout/Navbar.tsx:152` |
| **Recommended Fix** | Define `glass` in CSS or use standard Tailwind `backdrop-blur-md bg-white/10`. |
| **Status** | 🔴 Not fixed |


---

## M-31 🔴 Frontend — `navigate(-1)` Misbehaves When History Is Empty

| Field | Detail |
|-------|--------|
| **Vulnerability** | `EditMatrimony.tsx:180` — "Back" and "Cancel" buttons use `navigate(-1)`. If user navigated directly (bookmark), no history exists. |
| **Impact** | Browser falls back to previous site, leaving the app unexpectedly. |
| **Files to Fix** | `frontend/src/pages/EditMatrimony.tsx:180` |
| **Recommended Fix** | Use `navigate("/dashboard")` as fallback: `navigate(-1)` or `navigate("/dashboard")`. |
| **Status** | 🔴 Not fixed |


---

## M-32 🔴 Frontend — Stale Closure in IntersectionObserver Cleanup

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AdminUsers.tsx:50-70` — `useEffect` cleanup captures `trigger` variable by reference. If the trigger element is removed/re-added between renders, cleanup's `trigger` may be stale. |
| **Impact** | `observer.unobserve(null)` fails silently. Possible memory leak. |
| **Files to Fix** | `frontend/src/pages/admin/AdminUsers.tsx:50-70` |
| **Recommended Fix** | Store trigger element in a `useRef` and use that in cleanup. |
| **Status** | 🔴 Not fixed |


---

## M-33 🔴 Frontend — Inconsistent API Endpoint Patterns for Verification

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AdminVerification.tsx:58-60` — Approve posts to `/verification/${id}/approve`, reject to `/verification/${id}/reject`, escalate to `/verification/${id}/escalate`. Three different URL patterns for similar actions. |
| **Impact** | Maintenance confusion. Harder to add new action types. |
| **Files to Fix** | `frontend/src/pages/admin/AdminVerification.tsx:58-60` |
| **Recommended Fix** | Unify to a single endpoint `/verification/${id}/action` with `{ action: "approve" | "reject" | "escalate" }`. |
| **Status** | 🔴 Not fixed |


---

## M-34 🔴 Backend — `safe_enum` Silently Drops Invalid Values

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:270-273,424-427` — `safe_enum` catches `ValueError` and returns `None`. Invalid enum values are silently discarded instead of returning a 400 error. |
| **Impact** | User believes they set a preference, but it is stored as NULL. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:270-273,424-427` |
| **Recommended Fix** | Raise `HTTPException(400, "Invalid value for field X")` or validate all enum values in Pydantic schema. |
| **Status** | 🔴 Not fixed |


---

## M-35 🔴 Backend — `connection_requests` Unique Constraint Too Strict (No Retry After Decline)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `models/matrimony.py:108-109` — `UniqueConstraint("sender_profile_id", "receiver_profile_id")` plus same-direction + reverse-direction check blocks any new request after the first ever — even after a declined request. |
| **Impact** | If User A sends request to User B and User B declines, User A can never send another request to User B. |
| **Files to Fix** | `backend/app/models/matrimony.py:108-109` |
| **Recommended Fix** | Include `status` in the constraint or allow re-send after decline. |
| **Status** | 🔴 Not fixed |


---

## M-36 🔴 Backend — All Date Columns Lack Bounds CHECK Constraints

| Field | Detail |
|-------|--------|
| **Vulnerability** | No `CheckConstraint` on any `date_of_birth` or `date_of_death` column. Future dates and impossible past dates (e.g., DOB = year 1700) can be stored. |
| **Impact** | Data integrity issues — impossible birth dates. |
| **Files to Fix** | `backend/app/models/profile.py`, `backend/app/models/memorial.py` |
| **Recommended Fix** | Add `CheckConstraint("date_of_birth <= CURRENT_DATE")`. |
| **Status** | 🔴 Not fixed |


---

## M-37 🔴 Backend — JSONB Columns Are Untyped and Unindexed

| Field | Detail |
|-------|--------|
| **Vulnerability** | 6 JSONB columns (`Profile.social_links`, `MatrimonyProfile.hobbies`, `languages`, `additional_photos`, `preferences`, `AuditLog.old_values/new_values`) have no schema validation, size limits, or GIN indexes. |
| **Impact** | Any data shape can be stored. Query performance poor. |
| **Files to Fix** | All model files with JSONB columns |
| **Recommended Fix** | Add schema validation in Pydantic, size limits, and GIN indexes for queried JSONB fields. |
| **Status** | 🔴 Not fixed |


---

## M-38 🔴 Endpoint — No Email Uniqueness Check on Admin Creation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:49-56` — Only `phone_number` uniqueness is checked when creating admin. If email already exists, DB unique constraint causes unhandled 500. |
| **Impact** | Stack trace leakage in debug mode. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:49-56` |
| **Recommended Fix** | Add explicit `select(User).where(User.email == request.email)` check before insert. |
| **Status** | 🔴 Not fixed |


---

## M-39 🔴 Endpoint — User Onboarding Doesn't Actually Change Role

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:341-344` — Comment claims `/onboard` updates user role to `pending`, but no actual role mutation is performed. User remains `unverified`. |
| **Impact** | The verification flow later promotes to `verified_adult`, so this works accidentally, but the comment/code mismatch indicates broken intent. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:341-344` |
| **Recommended Fix** | Either update the role to `pending` or fix the comment. |
| **Status** | 🔴 Not fixed |


---

## M-40 🔴 Frontend — `setTimeout` Redirect Not Captured/Cleaned

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:345` — `setTimeout(() => navigate("/pending-verification"), 2000)` is never captured or cleared. Fires even after unmount. |
| **Impact** | User who navigates away before 2s is forcibly redirected back to `/pending-verification`. |
| **Files to Fix** | `frontend/src/pages/Register.tsx:345` |
| **Recommended Fix** | Store timeout ID in ref and clear in `useEffect` cleanup. |
| **Status** | 🔴 Not fixed |


---

## M-41 🔴 Frontend — Contact Visibility Toggles Are Not Persisted

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Profile.tsx:27-29,114-133` — Contact visibility toggles are local-only `useState` — never sent to backend. Changes lost on reload. |
| **Impact** | Feature appears functional but changes are ephemeral. |
| **Files to Fix** | `frontend/src/pages/Profile.tsx:27-29,114-133` |
| **Recommended Fix** | Wire toggles to backend (PUT `/profiles/me/social` or a new visibility endpoint). |
| **Status** | 🔴 Not fixed |


---

## M-42 🔴 Frontend — Hardcoded Unsplash Photo URLs as Default Avatars

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Registry.tsx:76,106` — Default profile photos point to `images.unsplash.com` external CDN. External dependency — if Unsplash is blocked, all default avatars fail. Same photo for all users without photo. |
| **Impact** | External CDN dependency. All default-avatar users look identical. |
| **Files to Fix** | `frontend/src/pages/Registry.tsx:76,106` |
| **Recommended Fix** | Use local SVG default avatar or gradient-generated placeholder. |
| **Status** | 🔴 Not fixed |


---

## M-43 🔴 Frontend — `contact_locked` Field Defined but Never Used in Rendering

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Registry.tsx:109` — `contact_locked` is computed but the template always renders `profile.contact` unconditionally. |
| **Impact** | Contact info always shown regardless of lock status. |
| **Files to Fix** | `frontend/src/pages/Registry.tsx:109` and template |
| **Recommended Fix** | Either use the flag to mask/hide contact or remove the dead field. |
| **Status** | 🔴 Not fixed |


---

## M-44 🔴 Frontend — Duplicate `/verification` Route

| Field | Detail |
|-------|--------|
| **Vulnerability** | `App.tsx:144-151` — `/verification` route defined twice: once top-level (wrapped in MainLayout) and once nested under `/admin/verification`. |
| **Impact** | Two different paths (`/verification` and `/admin/verification`) map to the same component. |
| **Files to Fix** | `frontend/src/App.tsx:144-151` |
| **Recommended Fix** | Remove the top-level `/verification` route. Keep the one under `/admin/verification`. |
| **Status** | 🔴 Not fixed |


---

## M-45 🔴 Backend — `UserResponse.id` Type Mismatch (int vs UUID)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `schemas/user.py:36` — `UserResponse.id: int` but `User` model PK is `UUID`. `TokenData.user_id: Optional[int]` also wrong. |
| **Impact** | These schemas would break if ever used as response models. Dead code, but indicates schema drift. |
| **Files to Fix** | `backend/app/schemas/user.py:36,52` |
| **Recommended Fix** | Change to `UUID` to match the model. |
| **Status** | 🔴 Not fixed |


---

## M-46 🔴 (NEW) `seed.py` `hobbies` Field Is String, Not JSONB Array

| Field | Detail |
|-------|--------|
| **Vulnerability** | `backend/app/db/seed.py:214` — `hobbies="Trekking, Reading novels"` is a plain string, but the `MatrimonyProfile.hobbies` column is `JSONB`. PostgreSQL will store this as a JSON string, not a JSON array. |
| **Impact** | Frontend code expecting `Array.isArray(hobbies)` will break. Hobbies won't render properly in seed data. |
| **Files to Fix** | `backend/app/db/seed.py:214` |
| **Recommended Fix** | Change to `hobbies=["Trekking", "Reading novels"]`. |
| **Status** | 🔴 New finding |


---

## M-47 🔴 (NEW) Upload Reads Full File Into Memory

| Field | Detail |
|-------|--------|
| **Vulnerability** | `uploads.py:49` — `file.read(MAX_FILE_SIZE + 1)` loads the entire file content into memory before validation. For a 20MB file, this allocates 20MB+ in Python's memory. |
| **Impact** | Memory exhaustion under concurrent uploads. Could be used as a DoS vector. |
| **Files to Fix** | `backend/app/api/v1/endpoints/uploads.py:49` |
| **Recommended Fix** | Read in chunks, or stream directly to storage service. |
| **Status** | 🔴 New finding |


---

## M-48 🔴 (NEW) `safe_enum` Defined Twice in profiles.py

| Field | Detail |
|-------|--------|
| **Vulnerability** | `profiles.py:270-273` and `profiles.py:424-427` — The `safe_enum` helper function is defined inside two different endpoint handlers. Code duplication. |
| **Impact** | Maintenance burden — updating one may miss the other. |
| **Files to Fix** | `backend/app/api/v1/endpoints/profiles.py:270-273,424-427` |
| **Recommended Fix** | Extract to a module-level helper function. |
| **Status** | 🔴 New finding |


---

## M-50 🔴 (NEW) `/admin/regions` Accessible to Unverified Users

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:370` — The `list_regions` endpoint uses `RoleChecker([UserRole.community_admin, UserRole.local_admin, UserRole.unverified])`. Unverified users can list all admin regions. |
| **Impact** | Information disclosure — any unverified user can enumerate all regions with names and PIN codes. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:370` |
| **Recommended Fix** | Keep `unverified` for onboarding flow but consider rate-limiting or removing extra fields like `pin_code` from the response. |
| **Status** | 🔴 New finding |


---

## M-51 🔴 (NEW) Login "Stay Signed In" Checkbox Does Nothing

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Login.tsx:169-193` — The "Stay signed in for 30 days" checkbox updates local `staySignedIn` state but this state is never sent to the API or used in token refresh logic. |
| **Impact** | UI provides false expectation — users think they'll stay logged in longer but nothing changes. |
| **Files to Fix** | `frontend/src/pages/Login.tsx:54` |
| **Recommended Fix** | Send `stay_signed_in` to login endpoint and adjust refresh token expiry server-side, or remove the checkbox. |
| **Status** | 🔴 New finding |


---

## M-57 🔴 (NEW) Chat — 4-Second Polling Lacks Backpressure

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Chat.tsx:121-126` — `setInterval` runs `refetchSessions` / `refetchMessages` every 4 seconds regardless of whether the previous request completed. Under slow network conditions, multiple requests queue up. |
| **Impact** | API server load spikes, stale closure issues, potential for rapid-fire duplicate requests. |
| **Files to Fix** | `frontend/src/pages/Chat.tsx:116-130` |
| **Recommended Fix** | Replace `setInterval` with recursive `setTimeout` that waits for the previous response + 4s. Consider WebSockets for production-grade real-time chat. |
| **Status** | 🔴 New finding |

---

# LOW Severity Findings

---

## L-01 🔴 `decode_jwt_token` Swallows All JWT Errors Into None

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:31-37` — Catch-all `JWTError` collapses expired, invalid-signature, and malformed-token errors into `None`. |
| **Impact** | Cannot distinguish expired (rotate refresh) from tampered (attack signal). |
| **Files to Fix** | `backend/app/core/security.py:31-37` |
| **Recommended Fix** | Catch `ExpiredSignatureError` separately. Log signature failures. |
| **Status** | 🔴 Not fixed |


---

## L-02 🔴 No `jti`, `iat`, `nbf`, `aud`, `iss` in JWT Claims

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:18-28` — JWT has only `sub` and `exp`. No token identifier, no issued-at, no audience. |
| **Impact** | Cannot revoke specific tokens. Cannot enforce token freshness. No audience restriction. |
| **Files to Fix** | `backend/app/core/security.py:18-28` |
| **Recommended Fix** | Add `iat`, `jti=str(uuid.uuid4())`, `aud`, `iss` to all tokens. |
| **Status** | 🔴 Not fixed |


---

## L-03 🔴 `bcrypt` 72-Byte Password Truncation

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:41-45,48-50` — bcrypt silently truncates passwords > 72 bytes. No length guard on input. |
| **Impact** | Two users with same first 72 bytes of a long passphrase hash identically. |
| **Files to Fix** | `backend/app/core/security.py:41-45,48-50` |
| **Recommended Fix** | Pre-hash with SHA-256 before bcrypt, or cap password length at schema validator. |
| **Status** | 🔴 Not fixed |


---

## L-04 🔴 `verify_password` Can Raise on Malformed Hash

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:48-50` — `bcrypt.checkpw` raises `ValueError` on malformed hash strings. Uncaught. |
| **Impact** | 500 error on login if stored hash is corrupted. |
| **Files to Fix** | `backend/app/core/security.py:48-50` |
| **Recommended Fix** | Wrap `checkpw` in try/except, return `False` on error. |
| **Status** | 🔴 Not fixed |


---

## L-05 🔴 `parse_cors_origins` Crashes on Non-JSON Values

| Field | Detail |
|-------|--------|
| **Vulnerability** | `config.py:70-75` — `json.loads(v)` raises `JSONDecodeError` if operator writes `CORS_ORIGINS=https://example.com` (natural) instead of JSON array. |
| **Impact** | Application fails to boot with confusing error. |
| **Files to Fix** | `backend/app/core/config.py:70-75` |
| **Recommended Fix** | Fall back to comma-split on `json.loads` failure. |
| **Status** | 🔴 Not fixed |


---

## L-06 🔴 `Settings` Uses `extra="ignore"` — Silently Absorbs Typos

| Field | Detail |
|-------|--------|
| **Vulnerability** | `config.py:81` — Typos like `SECERT_KEY` are silently ignored; default (insecure) value used. |
| **Impact** | Configuration errors leading to insecure defaults are silent. |
| **Files to Fix** | `backend/app/core/config.py:81` |
| **Recommended Fix** | Use `extra="forbid"` or at minimum log warnings. |
| **Status** | 🔴 Not fixed |


---

## L-07 🔴 Frontend — Hardcoded localhost Fallback for API URL

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:4` — Falls back to `http://localhost:8000/api/v1` if `VITE_API_URL` env var not set. In production, silently connects to localhost. |
| **Impact** | Bad UX in production misconfiguration. |
| **Files to Fix** | `frontend/src/lib/api.ts:4` |
| **Recommended Fix** | Remove fallback or log a warning. |
| **Status** | 🔴 Not fixed |


---

## L-08 🔴 Frontend — `localStorage.removeItem("user")` Is a No-Op

| Field | Detail |
|-------|--------|
| **Vulnerability** | `api.ts:72` — Clears `"user"` from localStorage, but AuthContext never stores `"user"` there. |
| **Impact** | Harmless dead code, but creates false sense of state clearance. |
| **Files to Fix** | `frontend/src/lib/api.ts:72` |
| **Recommended Fix** | Remove the line for clarity. |
| **Status** | 🔴 Not fixed |


---

## L-09 🔴 Frontend — Redundant `as UserRole` Cast

| Field | Detail |
|-------|--------|
| **Vulnerability** | `AuthContext.tsx:135` — `user.role as UserRole` is redundant since `user.role` is already typed as `UserRole`. |
| **Impact** | Unnecessary cast — could mask TypeScript errors if types change. |
| **Files to Fix** | `frontend/src/contexts/AuthContext.tsx:135` |
| **Recommended Fix** | Remove the cast. |
| **Status** | 🔴 Not fixed |


---

## L-11 🔴 `UserResponse.id` Type Mismatch (int vs UUID) — Duplicate

| Field | Detail |
|-------|--------|
| **Vulnerability** | Duplicate of M-45. `schemas/user.py:36` — `UserResponse.id: int`. |
| **Status** | 🔴 Not fixed |


---

## L-14 🔴 (NEW) Chat — Frontend Warning Scanner Regex Differs from Backend Sanitization Regex

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Chat.tsx:145` — Frontend warning uses `/\+?\d{1,3}[-.\s\(]*)?\(?\d{3}\)?[-.\s\)]*\d{3}[-.\s]*\d{4}|\b\d{8,15}\b/` while backend redaction uses `r'\+?\d[\d\s\-\(\)]{7,15}\d'`. These regexes are inconsistent — the frontend warns about patterns the backend may not redact, and vice versa. |
| **Impact** | User confusion: warned about PII that isn't actually masked, or not warned about PII that will be silently masked. |
| **Files to Fix** | `frontend/src/pages/Chat.tsx:145`, `backend/app/api/v1/endpoints/chat.py:37-38` |
| **Recommended Fix** | Share the same regex source between frontend and backend (e.g., an API endpoint that returns the sanitization patterns). |
| **Status** | 🔴 New finding |


---

## L-15 🔴 (ACCEPTED) Chat — No WebSocket Implementation (Polling Only)

| Field | Detail |
|-------|--------|
| **Vulnerability** | Chat relies on 4-second polling. No WebSocket or SSE endpoint exists. Messages are delayed by up to 4 seconds. |
| **Impact** | Poor real-time UX; unnecessary API server load. |
| **Files to Fix** | N/A — WebSockets not supported on GCP Cloud Run |
| **Recommended Fix** | Polling now uses recursive `setTimeout` with backpressure (avoids request pileup). WebSocket upgrade deferred — Cloud Run does not support persistent WebSocket connections natively. Consider Google Cloud Pub/Sub or Firestore real-time listener as alternative. |
| **Status** | 🔴 Accepted — not feasible on current GCP Cloud Run architecture |

---

# INFO / Observations

- **I-01:** `print()`-based logging in `main.py` lifespan instead of `logging.getLogger()` — not a bug but non-standard.
- **I-02:** `seed.py` reimplements bcrypt hashing instead of using `app.core.security.hash_password` — three separate hashing paths exist (seed.py, seed_admin_only.py, security.py).
- **I-03:** `TypeScript ~6.0.2` in `package.json:18` — TypeScript 6.0 does not exist as stable release. Likely a typo for 5.6.2.
- **I-04:** Unused schema classes in `schemas/auth.py` (`EmailRegister`, `EmailVerify`) — `auth.py` defines inline schemas instead.
- **I-05:** `schemas/__init__.py` only re-exports user schemas — namespace inconsistency.
- **I-06:** `MemorialRecord` model exists but no endpoint handles memorial records.
- **I-07:** Global search input in `MainLayout.tsx:244-253` is purely decorative — `searchQuery` state is never used.
- **I-08:** Bell and Lock icons in `MainLayout.tsx:333-338` have no onClick handlers.
- **I-09:** Default avatar URLs from Unsplash CDN — external dependency and tracking vector.
- **I-10:** `Registry.tsx` hardcodes `dependents` and `dependents_overflow` to `[]` and `0` — dead template code.
- **I-11:** `EmailOTPRequest` and `EmailOTPVerify` defined inline in `auth.py:30-37` instead of using existing schemas from `app.schemas.auth`.

---

# Quick-Fix Priority Order


---

*Generated by automated code audit — July 2026*
