# CommunityConnect — Membership, Access Control & Legal Plan

## Phase 1: Auto-Create Free 1-Month Membership for New Users

**Goal:** Every new user gets a free 30-day active membership starting today.

**Toggle Control:**
- Add a `auto_create_free_membership` boolean setting (stored in DB settings table or env var)
- Before creating membership, check if toggle is ON
- Allows turning off the free offer permanently without code changes

**Files to modify:**
- `backend/app/api/v1/endpoints/auth.py`
  - After user is created in `/register/verify-email` (~line 158), insert:
    ```python
    from datetime import timedelta, date
    if get_setting("auto_create_free_membership"):  # toggle check
        membership = Membership(
            user_id=user.id,
            username=user.email.split("@")[0],
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status=MembershipStatus.active,
        )
        db.add(membership)
    ```
  - Same for Google OAuth `/google/callback` after user creation (~line 415)
- **Skip for admins** (role `community_admin` or `local_admin`)

**DB Setting:**
- New table or row: `settings(key='auto_create_free_membership', value='true')`
- Admin endpoint: `POST /admin/settings` to toggle

---

## Phase 2: Gate Chat & Profile Viewing Behind Active Membership

### 2a. Backend — Create Membership Check Dependency

**File:** `backend/app/api/deps.py`
- New dependency `require_active_membership`:
  - Admins bypass the check
  - Checks `current_user.membership` exists, `status == "active"`, and `end_date >= today`
  - Returns `403` with message if not met

### 2b. Apply to Endpoints

| Endpoint | File | Dependency Change |
|---|---|---|
| `GET /chat/sessions` | `chat.py` | Add `require_active_membership` |
| `GET /chat/{id}/messages` | `chat.py` | Same |
| `POST /chat/messages` | `chat.py` | Same |
| `GET /profiles/by-username/{username}` | `profiles.py` | Same |
| `GET /matrimony/entries` | `matrimony.py` | Same |
| `POST /matrimony/requests` | `matrimony.py` | Same |

### 2c. Frontend — Show Locked State

| Page | File | Change |
|---|---|---|
| Chat | `frontend/src/pages/Chat.tsx` | Check `user.membership`; if inactive/missing show overlay |
| Profile view | `frontend/src/pages/UsernameProfileView.tsx` | Catch `403` and show "Membership required" |
| Dashboard | `frontend/src/pages/Dashboard.tsx` | Show membership status banner (Active till X / Expired / No membership) |

---

## Phase 3: Legal Pages

### Terms & Conditions (`/terms`)
- **File:** `frontend/src/pages/Terms.tsx`
- Static page with key sections:
  - Acceptance of Terms
  - User Eligibility
  - Account Registration & Security
  - Membership & Subscription (free trial, future paid plans)
  - User Conduct (no harassment, no fake info)
  - Content Ownership & Image Protection
  - Limitation of Liability
  - Termination
  - Governing Law

### NDA for Image Protection (`/nda-policy`)
- **File:** `frontend/src/pages/NdaPolicy.tsx`
- Static page explaining:
  - All profile photos and gallery images are protected
  - Watermark overlay (viewer name + date)
  - Screenshotting, downloading, or sharing images is prohibited
  - Legal consequences of unauthorized distribution
  - How to report violations

### Routing & Links
- **`App.tsx`:** Add public routes `/terms` and `/nda-policy` (no auth required)
- **Landing page footer:** Add links to Terms & NDA pages
- **Login/Register footer:** Add same links
- **Registration page:** Add checkbox "I agree to Terms & NDA" (optional for now)

---

## Phase 4: Offers & Coupon Code System

**Goal:** Admin can create discount codes (percentage or flat) for membership plans.

### Database Schema
```sql
-- offers table
id UUID PK
code VARCHAR(50) UNIQUE          -- e.g. "WELCOME15", "FRIEND20"
discount_type VARCHAR(10)        -- "percent" or "flat"
discount_value INTEGER           -- 15 (for 15%), or amount in cents for flat
max_uses INTEGER                 -- total redemption limit (null = unlimited)
current_uses INTEGER DEFAULT 0
expires_at DATE                  -- null = never expires
is_active BOOLEAN DEFAULT true
created_by UUID FK (admin user)
created_at TIMESTAMP
```

### Backend Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /admin/offers` | Create a new offer/coupon code (admin only) |
| `GET /admin/offers` | List all offers with usage stats |
| `PATCH /admin/offers/{id}` | Update offer (toggle active, change discount, etc.) |
| `POST /payment/apply-coupon` | Validate & apply coupon code (returns discount info) |

### Flow
1. Admin creates offer via `POST /admin/offers` with code, discount, expiry, max uses
2. User enters coupon code on pricing/checkout page
3. Frontend calls `POST /payment/apply-coupon` to validate
4. If valid → discount reflected in checkout session
5. Webhook confirms payment → `current_uses` incremented on the offer

---

## Phase 5: Payment Integration (Future — Stripe / Razorpay)

### Database Schema
```sql
-- membership_plans table
id UUID PK
name VARCHAR(100)          -- e.g. "Monthly", "Yearly"
price_cents INTEGER        -- price in smallest currency unit
duration_days INTEGER      -- 30, 365
gateway_product_id VARCHAR -- Stripe Price ID / Razorpay Plan ID
is_active BOOLEAN
created_at TIMESTAMP

-- payment_transactions table
id UUID PK
user_id UUID FK
plan_id UUID FK
gateway VARCHAR(20)        -- "stripe" or "razorpay"
gateway_txn_id VARCHAR
amount_cents INTEGER
currency VARCHAR(3)        -- "INR" or "USD"
status VARCHAR(20)         -- "pending", "completed", "failed", "refunded"
created_at TIMESTAMP
```

### Backend Endpoints
| Endpoint | Purpose |
|---|---|
| `GET /payment/plans` | List active membership plans |
| `POST /payment/create-checkout-session` | Create Stripe Checkout / Razorpay order |
| `POST /payment/webhook` | Stripe/Razorpay webhook to confirm payment |
| `POST /payment/portal` | Redirect to Stripe Customer Portal for managing subscription |

### Flow
1. User visits Pricing page → sees plans
2. Clicks "Subscribe" → `POST /payment/create-checkout-session`
3. Redirected to Stripe Checkout (or Razorpay checkout)
4. User completes payment → webhook fires
5. Webhook handler:
   - Creates `payment_transactions` record
   - Updates user's `membership.end_date` (extends by plan duration)
   - Sets `membership.status = "active"`
6. User can now access chat/profiles

### Auto-Renewal & Expiry
- Webhook also handles subscription renewal events
- Daily cron/APScheduler task:
  - Find memberships expiring in 7 days → send reminder email
  - Find expired memberships → set `status = "inactive"`

---

## Implementation Order

1. ✅ Fix `logger` undefined name (flake8 failure)
2. ⬜ Phase 1: Auto-create free 1-month membership in auth.py (with toggle)
3. ⬜ Phase 2a: Create `require_active_membership` dependency
4. ⬜ Phase 2b: Apply dependency to chat + profile endpoints
5. ⬜ Phase 2c: Frontend membership gate UI (Chat, ProfileView, Dashboard)
6. ⬜ Phase 3: Create Terms.tsx, NdaPolicy.tsx, routes, footer links (user provides NDA/Terms content)
7. ⬜ Phase 4: Offers & Coupon Code System
8. ⬜ Phase 5: Payment integration (when Stripe/Razorpay is ready)
