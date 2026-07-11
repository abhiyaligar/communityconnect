# CommunityConnect — Bug & Vulnerability Report

> **Category:** Partially Fixed Findings
> **Count:** 7 findings

---

## C-08 🔴 7 Database Indexes Dropped and Never Recreated

| Field | Detail |
|-------|--------|
| **Vulnerability** | Migration `032d97cc0f66` dropped 7 indexes on critical tables (profile, memorial, matrimony, connection_requests) and they were never recreated. |
| **Impact** | Severe query performance degradation on all major read paths (profile search, matrimony matching, registry browsing). Full table scans on large tables. |
| **Files to Fix** | `backend/alembic/versions/032d97cc0f66*.py` — write a new migration |
| **Recommended Fix** | Write a hotfix migration that recreates: `ix_profiles_username`, `ix_profiles_email`, `ix_profiles_full_name`, `ix_memorial_date_of_death`, `ix_matrimony_opted_in`, `ix_connection_requests_status`, `ix_connection_requests_receiver`. |
| **Status** | 🟡 Partially fixed — token expiry validation added before use; full migration to in-memory storage pending |


---

## C-11 🟡 local_admin Can Assign community_admin Role via Edit Dialog

| Field | Detail |
|-------|--------|
| **Vulnerability** | The admin user edit dialog (`AdminUsers.tsx:322-331`) exposes ALL roles including `community_admin` in the role `<Select>`. Both `local_admin` and `community_admin` users can access this page. A `local_admin` can promote any user (including themselves) to `community_admin`. |
| **Impact** | Direct privilege escalation — rogue local_admin becomes community_admin with full platform control. |
| **Files to Fix** | `frontend/src/pages/admin/AdminUsers.tsx:322-331` (frontend), `backend/app/api/v1/endpoints/admin.py:231` (backend must also enforce) |
| **Recommended Fix** | Filter role options based on current user's role. Only `community_admin` should see `community_admin`/`local_admin` options. Backend must also enforce: only `community_admin` can assign admin roles. |
| **Status** | 🟡 Partially fixed — backend `update_user_profile_admin` now uses `RoleChecker([UserRole.community_admin])`. Frontend role-select filtering still needs verification. |


---

## H-03 🟡 No Rate Limiting on Auth Endpoints (OTP Brute-Force)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `/register/email`, `/register/verify-email`, `/login`, `/token/refresh` have NO rate limiting. OTP is 6 digits (10^6 space) with no attempt counter. |
| **Impact** | Attacker can brute-force OTP at high speed, achieving account takeover. Credential stuffing on `/login` is unlimited. |
| **Files to Fix** | `backend/app/api/v1/endpoints/auth.py:36,84,156,204` |
| **Recommended Fix** | Add per-identity rate limiting: max 5 OTP verification attempts per OTP lifetime (track in DB), max N login attempts per minute. Use `fastapi-limiter`/slowapi with Redis (already configured). |
| **Status** | 🟡 Partially fixed — `@limiter.limit("5/minute")` on `/register/email`, `@limiter.limit("10/minute")` on `/login`. But `/register/verify-email` (the OTP brute-force vector) still has NO rate limiting. |


---

## H-07 🟡 Missing Role Checks on Matrimony Endpoints

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:257,339,426,502,540,577,632,688,718,765` — All matrimony interaction endpoints (send requests, list requests, approve/reject, manage co-approvers) use only `get_current_user`. |
| **Impact** | Unverified users can fully participate in the matrimony system — send connection requests, approve/reject matches — before any admin verification. |
| **Files to Fix** | All matrimony endpoints listed above |
| **Recommended Fix** | Add `Depends(RoleChecker([UserRole.verified_adult, UserRole.local_admin, UserRole.community_admin]))` to all these endpoints. |
| **Status** | 🟡 Partially fixed — `/matches` endpoint now has `RoleChecker([UserRole.community_admin, UserRole.local_admin, UserRole.verified_adult])`. All other matrimony endpoints still only use `get_current_user`. |


---

## H-09 🟡 No Region Scoping for local_admin (Data Breach)

| Field | Detail |
|-------|--------|
| **Vulnerability** | `admin.py:137,173,271` — All admin list/stats endpoints (`/admin/dashboard`, `/admin/users`, `/admin/matrimony`) use `RoleChecker` that allows `local_admin` but provide NO region scoping. A `local_admin` assigned to one region can see ALL users platform-wide. |
| **Impact** | Massive PII data breach — a local_admin for a small town can export names, phones, addresses, DOBs for the entire national community. |
| **Files to Fix** | `backend/app/api/v1/endpoints/admin.py:137,173,271` |
| **Recommended Fix** | For `local_admin` users, filter all queries by their assigned region IDs from `LocalAdminRegion`. |
| **Status** | 🟡 Partially fixed — `/admin/users` now filters by region for local_admin. `/admin/dashboard` and `/admin/matrimony` still have no region scoping. |


---

## M-03 🟡 No Rate Limiting or Security Headers at Framework Level

| Field | Detail |
|-------|--------|
| **Vulnerability** | `main.py` — Missing: `TrustedHostMiddleware` (host header injection), rate limiting (login/OTP brute-force), security headers (CSP, HSTS, X-Content-Type-Options), request body size limit. |
| **Impact** | Systemic weakness — OTP brute-force possible (H-03), host header injection for password reset phishing (if implemented), SSL stripping without HSTS. |
| **Files to Fix** | `backend/app/main.py` |
| **Recommended Fix** | Add `slowapi`/`fastapi-limiter` for auth endpoints. Add `TrustedHostMiddleware`. Add security headers middleware. |
| **Status** | 🟡 Partially fixed — `slowapi` limiter is now configured in `limiter.py` with Redis backend, and applied to `/register/email` and `/login`. But `TrustedHostMiddleware`, security headers, and body size limit still missing. |


---

## M-18 🟡 Missing Pagination on `/matrimony/matches`

| Field | Detail |
|-------|--------|
| **Vulnerability** | `matrimony.py:116-117` — Matches endpoint now has pagination but no maximum `limit` bound. A caller could set `limit=1000000`. |
| **Impact** | Network congestion, high memory usage, potential DoS. |
| **Files to Fix** | `backend/app/api/v1/endpoints/matrimony.py:45-46` |
| **Recommended Fix** | Add `Field(le=50)` to the `limit` parameter. |
| **Status** | 🟡 Partially fixed — `page` and `limit` parameters added. No max-bound check on `limit`. |



---

*Generated by automated code audit — July 2026*
