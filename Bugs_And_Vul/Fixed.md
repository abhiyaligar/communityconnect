# CommunityConnect — Bug & Vulnerability Report

> **Category:** Fixed Findings
> **Count:** 33 findings

---

## C-01 🔴 Hardcoded Default JWT Secret Key

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Settings.SECRET_KEY` defaults to `"your-super-secret-key-change-in-production"` — a publicly-known string. No validator rejects this in production. |
| **Impact** | Attacker can forge arbitrary HS256 JWTs with any `sub` (user UUID) and any `role`. Full account takeover and privilege escalation. No token-type or audience checks exist. |
| **Files to Fix** | `backend/app/core/config.py:30` (default value), `backend/app/core/security.py:27,34` (uses secret) |
| **Recommended Fix** | Add `@field_validator("SECRET_KEY")` that raises if value equals the default or `len < 32` when `ENVIRONMENT == "production"`. Document generation via `secrets.token_urlsafe(64)`. |
| **Status** | 🟢 Fixed |


---

## C-02 🟡 Refresh Tokens Accepted as Access Tokens

| Field | Detail |
|-------|--------|
| **Vulnerability** | `get_current_user` in deps.py decodes any valid JWT with a `sub` claim, never checking `payload.get("type") == "access"`. Refresh tokens (7-day expiry) are fully valid as Bearer tokens on all endpoints. |
| **Impact** | Stolen refresh cookie → full API access for 7 days without needing to call `/token/refresh`. Nullifies the access-token short expiry (30 min). |
| **Files to Fix** | `backend/app/api/deps.py:34-50` (auth check), `backend/app/core/security.py:18-28` (token creation) |
| **Recommended Fix** | Add `"type": "access"` to access JWTs at creation. In `get_current_user`, reject any token whose `type != "access"`. |
| **Status** | 🟢 Fixed — access tokens now carry `"type":"access"`; `get_current_user` rejects any token whose `type` is `"refresh"` |


---

## C-03 🔴 OTP Master Bypass Code `"123456"`

| Field | Detail |
|-------|--------|
| **Vulnerability** | When `SMS_PROVIDER` is `"mock"`, any OTP verification with `"123456"` succeeds. If production ever has `SMS_PROVIDER=mock` (misconfiguration), any phone number can be authenticated with this static code. |
| **Impact** | Complete authentication bypass — attacker can login as any user by entering `123456` as the OTP. |
| **Files to Fix** | `backend/app/services/otp.py:43-46` |
| **Recommended Fix** | Add gating check: `if settings.ENVIRONMENT == "production": raise RuntimeError("Mock provider not allowed")`. Wrap bypass in `if settings.DEBUG`. |
| **Status** | 🟢 Fixed |


---

## C-04 🔴 Self-Approval of Verification Requests

| Field | Detail |
|-------|--------|
| **Vulnerability** | The `approve_verification` endpoint never checks whether the approver is the same user as the target. An admin can approve their own verification request. |
| **Impact** | A `local_admin` can self-approve and gain `verified_adult` status without peer review. Combined with duplicate-vote inflation (C-05), they could grant themselves any role. |
| **Files to Fix** | `backend/app/api/v1/endpoints/verification.py:136-214` |
| **Recommended Fix** | Add `if current_user.id == req.target_user_id: raise HTTPException(403, detail="Cannot approve your own verification.")` |
| **Status** | 🟢 Fixed |


---

## C-05 🔴 Duplicate Vote Inflation — Missing Unique Constraint on Approvals

| Field | Detail |
|-------|--------|
| **Vulnerability** | `VerificationApproval` model has no unique constraint on `(verification_request_id, approver_user_id)`. Vote counting uses `len(...) + 1`, so a single admin can call approve multiple times to inflate the count. |
| **Impact** | Single rogue `local_admin` can reach the 4-vote threshold and self-approve, gaining `verified_adult` role without actual peer review. |
| **Files to Fix** | `backend/app/models/verification.py` (add constraint), `backend/app/api/v1/endpoints/verification.py:192-198` (counting logic) |
| **Recommended Fix** | Add `UniqueConstraint("verification_request_id", "approver_user_id", name="uq_approval_per_admin")`. Use `count(distinct approver_user_id)` in queries. |
| **Status** | 🟢 Fixed |


---

## C-06 🔴 Hardcoded Password in Seed Script

| Field | Detail |
|-------|--------|
| **Vulnerability** | `backend/app/db/seed.py:41` hardcodes `raw_password = "Password@123".encode("utf-8")` for all seeded users including super admins. This is committed to source. |
| **Impact** | Anyone with access to the repo (or the running seed) knows the default password for all seeded accounts including community_admin. |
| **Files to Fix** | `backend/app/db/seed.py:41`, `backend/app/db/seed_admin_only.py:24` |
| **Recommended Fix** | Read password from environment variable. Use `from app.core.security import hash_password` instead of reimplementing bcrypt. |
| **Status** | 🟢 Fixed |


---

## C-07 🔴 FamilyUnit `delete-orphan` Cascade Destroys All Member Profiles

| Field | Detail |
|-------|--------|
| **Vulnerability** | `family_unit.members` relationship uses `cascade="all, delete-orphan"`. Deleting a `FamilyUnit` deletes ALL member `Profile` rows from the database. |
| **Impact** | If a family unit is deleted (planned or accidental), all profiles of all family members are permanently destroyed — no SET NULL, no protection. |
| **Files to Fix** | `backend/app/models/family.py:33` |
| **Recommended Fix** | Change cascade to `cascade="all"` (remove `delete-orphan`) so the DB `SET NULL` rule fires instead. |
| **Status** | 🟢 Fixed |


---

## C-09 🔴 JWT Access Token Stored in `localStorage` (XSS-Exposed)

| Field | Detail |
|-------|--------|
| **Vulnerability** | The access token is written to and read from `localStorage` via `api.ts` and `AuthContext.tsx`. Any XSS vulnerability (unsanitized profile photo URL, social link, third-party script) can steal the JWT. |
| **Impact** | Full account takeover — attacker steals `access_token` from localStorage and calls any API as the victim until token expiry (30 min). Refresh cookies are also exfiltratable. |
| **Files to Fix** | `frontend/src/lib/api.ts:18,67` • `frontend/src/contexts/AuthContext.tsx:28,81,116,123` • `frontend/src/pages/Register.tsx:240` |
| **Recommended Fix** | Store access token in HttpOnly, Secure, SameSite cookie (like refresh token). Avoid `localStorage` entirely. If unavoidable, use in-memory with short TTL + refresh. |
| **Status** | 🟢 Fixed |


---

## C-10 🟡 Fake "Verified Adult" Badge Shown to ALL Users

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Dashboard.tsx:406-408` unconditionally renders a green `CheckCircle` checkmark next to every user's name in the matrimony card, regardless of verification status. |
| **Impact** | Unverified users can falsely appear "verified" on shared screens or screenshots. Undermines the entire verification system and community trust. |
| **Files to Fix** | `frontend/src/pages/Dashboard.tsx:406-408` |
| **Recommended Fix** | Only show the verification checkmark badge for `verified_adult` and admin roles. |
| **Status** | 🟢 Fixed — checkmark now only renders for verified_adult, community_admin, and local_admin |


---

## C-12 🔴 `setInterval` Countdown Timer Never Cleaned Up on Unmount

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Register.tsx:200-204` — `startCountdown` creates a `setInterval` that decrements the OTP countdown timer. The interval is never cleared on component unmount. |
| **Impact** | Memory leak (interval keeps firing), stale closure, React warning about setState on unmounted component after React 18. |
| **Files to Fix** | `frontend/src/pages/Register.tsx:200-204` |
| **Recommended Fix** | Use `useEffect` with cleanup returning `clearInterval(timer)`. Track timer via `useRef`. |
| **Status** | 🟢 Fixed |


---

## C-13 🔴 `email_verifications.id` Column Has No DB Default

| Field | Detail |
|-------|--------|
| **Vulnerability** | The `EmailVerification` model's `id` column is a UUID PK with no `server_default=gen_random_uuid()`. If the application layer fails to provide a UUID, the INSERT fails at the DB level. |
| **Impact** | Registration flow can fail silently with 500 errors. OTP verification requests might be lost. |
| **Files to Fix** | `backend/app/models/email_verification.py:15` |
| **Recommended Fix** | Add `server_default=text("gen_random_uuid()")` as a hotfix migration. |
| **Status** | 🟢 Fixed |


---

## C-14 🔴 `/register/verify-email` Issues Tokens for Existing Users (OTP-Only Takeover)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:132-150` — When verifying an OTP, if `user` already exists (found by email), the endpoint **still issues access + refresh tokens** without verifying the user's password. The supplied password in the request body is ignored for existing users. |
| **Impact** | Attacker who phishes or brute-forces an OTP (6-digit, no rate limit on verify) can get authenticated access to any existing account without knowing the password. OTP-only account takeover. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:132-150` |
| **Recommended Fix** | Either (a) always verify the password against stored hash even for existing users, or (b) refuse to issue tokens if user already exists — return "Already registered, please login." |
| **Status** | 🟢 Fixed |


---

## C-15 🔴 (NEW) OTP Verify Endpoint Has No Rate Limiting

| Field | Detail |
|-------|--------|
| **Vulnerability** | `/register/verify-email` has no `@limiter.limit()` decorator. Combined with C-14, an attacker can brute-force OTP codes (6-digit = 10^6 space) with unlimited attempts against any registered email. |
| **Impact** | Account takeover via OTP brute-force. No rate limit, no attempt counter, no lockout mechanism. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:107` |
| **Recommended Fix** | Add `@limiter.limit("5/minute")` on the verify endpoint. Track failed attempts per email in DB; lock out after 5 failures. |
| **Status** | 🟢 Fixed |

---

# HIGH Severity Findings

---

## H-05 🔴 OTP Stored in Plaintext in Database

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:87-94` — OTP codes are stored as-is in the `EmailVerification` table. Anyone with DB read access (SQL injection elsewhere, backup leak, DBA) can read live OTPs. |
| **Impact** | DB-level plaintext OTPs allow anyone with DB access to authenticate as any user. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:87-94`, `backend/app/models/email_verification.py:17` |
| **Recommended Fix** | Hash OTPs at rest using HMAC-SHA256 with a server-side derived key. |
| **Status** | 🟢 Fixed |


---

## H-10 🔴 Self-Deletion of Admin Account

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:307-324` — `delete_user_account_admin` does not check whether `current_admin.id == user_id`. A community_admin can delete their own account. |
| **Impact** | Permanent self-DoS — if the only community_admin deletes their account, the platform has no remaining admin to restore or manage it. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:316` |
| **Recommended Fix** | Add `if current_admin.id == user_id: raise HTTPException(400, detail="Cannot delete your own account.")` |
| **Status** | 🟢 Fixed |


---

## H-11 🔴 Email Verification Code Leaked to Logs on SMTP Failure

| Field | Detail |
|-------|--------|
| **Vulnerability** | `utils/email.py:48,82` — When SMTP sending fails, the fallback logs: `logger.info(f"SIMULATION FALLBACK: Code is {code}")`. The full OTP is written to application logs. |
| **Impact** | Anyone with log access (operators, log aggregation service, SIEM) can extract plaintext OTPs and authenticate as any user who experienced a failed email. |
| **Files to Fix** | `backend/app/utils/email.py:48,82` |
| **Recommended Fix** | Log only a masked code (`code[:2] + "****"`). Never log secrets even in fallback paths. |
| **Status** | 🟢 Fixed |


---

## H-14 🔴 `DEBUG=True` by Default in Production

| Field | Detail |
|-------|--------|
| **Vulnerability** | `config.py:19` — `DEBUG: bool = True` is the default. `session.py:16` uses `echo=settings.DEBUG`, dumping all SQL with bound parameters (emails, OTPs, UUIDs) to logs. |
| **Impact** | PII and authentication secrets (OTPs) in plaintext application logs — privacy and compliance violation. SQL parameter logging can expose all user data. |
| **Files to Fix** | `backend/app/core/config.py:19`, `backend/app/db/session.py:16` |
| **Recommended Fix** | Default `DEBUG = False`. Gate `echo=True` behind `ENVIRONMENT == "development"`. |
| **Status** | 🟢 Fixed |


---

## H-29 🔴 Backend — `AuditLog` Model Is Never Written

| Field | Detail |
|-------|--------|
| **Vulnerability** | A full `AuditLog` table/model exists but NO endpoint, service, or event handler ever writes to it. Admin actions (user update/delete, verification approve/reject, role changes) are not audited. |
| **Impact** | No audit trail for compliance. Cannot investigate who changed what or when. Violates basic security logging requirements. |
| **Files to Fix** | `backend/app/models/audit.py` (exists, unused) |
| **Recommended Fix** | Implement SQLAlchemy `before_flush` event or a service-layer `audit_log()` helper. Call from every mutating endpoint. |
| **Status** | 🟢 Fixed |


---

## H-30 🔴 (NEW) `seed_admin_only.py` Also Hardcodes Password

| Field | Detail |
|-------|--------|
| **Vulnerability** | `backend/app/db/seed_admin_only.py:24` hardcodes `password = "Password@123"` for the community admin account. Same known password as `seed.py`. |
| **Impact** | Anyone with repo access knows the admin password for seeded installations. |
| **Files to Fix** | `backend/app/db/seed_admin_only.py:24` |
| **Recommended Fix** | Read password from environment variable. Use `from app.core.security import hash_password`. |
| **Status** | 🟢 Fixed |


---

## H-31 🔴 (NEW) Forgot Password Endpoint Leaks Account Existence

| Field | Detail |
|-------|--------|
| **Vulnerability** | `auth.py:454-458` — `/forgot-password` returns 404 "No account associated" vs 200 "Reset code sent". An attacker can enumerate registered emails. |
| **Impact** | Email enumeration + potential phishing vector. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:454-458` |
| **Recommended Fix** | Always return 200 with a generic message regardless of whether the email exists. |
| **Status** | 🟢 Fixed |


---

## H-32 🔴 (NEW) Chat `sanitize_message` Phone Regex Is Broken

| Field | Detail |
|-------|--------|
| **Vulnerability** | `chat.py:37-39` — Phone regex `r'\+?\(?\d\)?(?:\s*[-.\(\)]?\s*\d){7,14}\b'` has a malformed character class `\(?` after `\d` which matches incorrectly. The regex won't reliably match standard phone formats. |
| **Impact** | Phone numbers in chat messages may not be properly redacted, leaking PII through the chat system. |
| **Files to Fix** | `backend/app/api/v1/endpoints/chat.py:37-39` |
| **Recommended Fix** | Use a well-tested regex like `r'\+?\d[\d\s\-\(\)]{7,15}\d'` or a phone-number parsing library. |
| **Status** | 🟢 Fixed |


---

## H-33 🟢 (FIXED) Chat Send Message Endpoint Has No Rate Limiting

| Field | Detail |
|-------|--------|
| **Vulnerability** | `chat.py:208` — `POST /chat/messages` has no `@limiter.limit()` decorator. Combined with no role check (H-34), any unverified user can spam unlimited messages. |
| **Impact** | Spam, phishing, and DoS vector against chat recipients. No throttling at application level. |
| **Files to Fix** | `backend/app/api/v1/endpoints/chat.py:208` |
| **Recommended Fix** | Add `@limiter.limit("10/minute")` on the send-message endpoint. Consider connection-level rate limit per conversation. |
| **Status** | 🟢 Fixed |


---

## H-34 🟢 (FIXED) Chat Endpoints Have No Role Check — Unverified Users Can Chat

| Field | Detail |
|-------|--------|
| **Vulnerability** | `chat.py:81,156,208,249` — All four chat endpoints (`GET /sessions`, `GET /{profile_id}/messages`, `POST /messages`, `POST /{profile_id}/read`) use only `get_current_user`. No `RoleChecker` is applied. Users with `unverified` role can fully participate in matrimony chat. |
| **Impact** | Unverified users bypass the verification system entirely — they can send, receive, and read messages in the matrimony network before admin approval. Overlaps with H-07. |
| **Files to Fix** | `backend/app/api/v1/endpoints/chat.py:81,156,208,249` |
| **Recommended Fix** | Add `Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))` to all four endpoints. |
| **Status** | 🟢 Fixed |

---

# MEDIUM Severity Findings

---

## M-22 🟢 Frontend — Dead "Forgot Password?" Link

| Field | Detail |
|-------|--------|
| **Vulnerability** | `Login.tsx:150` — "Forgot password?" link now correctly points to `/forgot-password`. Backend implements `/forgot-password` and `/reset-password` endpoints. |
| **Impact** | FIXED — Password reset flow now exists end-to-end. |
| **Files to Fix** | N/A |
| **Recommended Fix** | Already implemented. |
| **Status** | 🟢 Fixed |


---

## M-49 🔴 (NEW) Chat Messages Lack XSS Sanitization

| Field | Detail |
|-------|--------|
| **Vulnerability** | `chat.py:233` — The `sanitize_message` function only redacts PII (phones, PINs, addresses) but does NOT strip HTML/script tags, markdown injection, or other XSS vectors. |
| **Impact** | If chat messages are rendered with `dangerouslySetInnerHTML` or similar on the frontend, XSS is possible. |
| **Files to Fix** | `backend/app/api/v1/endpoints/chat.py:233` |
| **Recommended Fix** | Add HTML escaping or use a library like `bleach` to strip dangerous content server-side. |
| **Status** | 🟢 Fixed |


---

## M-52 🔴 (NEW) Chat — PIN Regex Overly Broad (False Positives on Any 5–6 Digit Number)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `chat.py:43` — PIN regex `r'\b\d{5,6}\b'` matches ANY 5-6 digit number, not just postal codes. Numbers like "123456" (order ID), "500000" (salary), "98765" (employee ID) are all falsely redacted. |
| **Impact** | Poor UX — legitimate numeric content (prices, quantities, IDs) is masked as "[REDACTED PIN]". |
| **Files to Fix** | `backend/app/api/v1/endpoints/chat.py:43` |
| **Recommended Fix** | Use a more specific Indian-PIN pattern like `r'\b[1-9]\d{2}\s?\d{3}\b'` or a dedicated library. |
| **Status** | 🟢 Fixed |


---

## M-53 🔴 (NEW) Chat — Address Keyword "cross" Causes False Positives

| Field | Detail |
|-------|--------|
| **Vulnerability** | `chat.py:47-50` — The word "cross" is in the address-keyword blacklist. Common non-address phrases like "I'm cross with you", "cross-check the details", "cross that out" trigger address redaction. |
| **Impact** | Confusing UX — ordinary conversation is silently masked as "[REDACTED ADDRESS]". |
| **Files to Fix** | `backend/app/api/v1/endpoints/chat.py:47-50` |
| **Recommended Fix** | Remove "cross" from keywords, or require adjacent context (e.g., "cross road", "cross street"). |
| **Status** | 🟢 Fixed |


---

## M-54 🔴 (NEW) Chat — No Backend `max_length` on Message Content

| Field | Detail |
|-------|--------|
| **Vulnerability** | `schemas/chat.py:9` — `ChatMessageCreate.content` is `str` with no `max_length` validator. The frontend enforces `maxLength={1000}` (Chat.tsx:404) but this is trivially bypassed via direct API calls. An attacker can send arbitrarily large messages. |
| **Impact** | Memory exhaustion, potential DoS, inflated database storage. |
| **Files to Fix** | `backend/app/schemas/chat.py:9` |
| **Recommended Fix** | Add `max_length=1000` to the `content` field in `ChatMessageCreate`. |
| **Status** | 🟢 Fixed |


---

## M-55 🔴 (NEW) Chat — No Composite Index on (sender, receiver, created_at)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `models/chat.py:17-18` — Only single-column indexes exist on `sender_profile_id` and `receiver_profile_id`. The main query pattern (chat.py:196-203) filters by `(sender, receiver)` pairs and orders by `created_at ASC`, which would benefit from a composite index. |
| **Impact** | Query performance degrades as chat message volume grows. Full index scans on large conversations. |
| **Files to Fix** | `backend/app/models/chat.py:17-18` |
| **Recommended Fix** | Add `Index("ix_chat_sender_receiver_created", "sender_profile_id", "receiver_profile_id", "created_at")`. |
| **Status** | 🟢 Fixed |


---

## M-56 🔴 (NEW) Chat — No Pagination on `get_chat_messages`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `chat.py:196-203` — Returns ALL messages in a conversation with no `offset`/`limit` parameter. Active chats with thousands of messages cause high memory usage and slow response times. |
| **Impact** | API timeout and OOM risk for long-running conversations. |
| **Files to Fix** | `backend/app/api/v1/endpoints/chat.py:196-203` |
| **Recommended Fix** | Add `limit` (default 50) and `offset` or `before`-timestamp query parameters. |
| **Status** | 🟢 Fixed |


---

## L-10 🔴 `uuid` Import Unused in security.py

| Field | Detail |
|-------|--------|
| **Vulnerability** | `security.py:8` — `import uuid` is unused. |
| **Impact** | Dead import. |
| **Files to Fix** | `backend/app/core/security.py:8` |
| **Recommended Fix** | Remove unused import. |
| **Status** | 🟢 Fixed |


---

## L-12 🔴 Version Mismatch (main.py 1.2.0 vs config.py 1.0.0)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py:30` hardcodes `version="1.2.0"` while `config.py:18` is `APP_VERSION="1.0.0"`. |
| **Impact** | OpenAPI docs show one version, root endpoint returns another. |
| **Files to Fix** | `backend/app/main.py:30` |
| **Recommended Fix** | Use `version=settings.APP_VERSION`. |
| **Status** | 🟢 Fixed |


---

## L-13 🔴 (NEW) Chat — `ChatMessage` Model Missing `server_default` for UUID `id`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `models/chat.py:16` — `id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)` has no `server_default=text("gen_random_uuid()")`. Same issue as C-13 for email_verifications. |
| **Impact** | If application layer fails to supply a UUID, INSERT fails. |
| **Files to Fix** | `backend/app/models/chat.py:16` |
| **Recommended Fix** | Add `server_default=text("gen_random_uuid()")`. |
| **Status** | 🟢 Fixed |



---

*Generated by automated code audit — July 2026*
