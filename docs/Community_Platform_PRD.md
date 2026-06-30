# Product Requirements Document (PRD)
## Community Registry & Matrimonial Platform

**Version:** 1.0 (MVP Scope)
**Author:** Abhishek J Yaligar
**Status:** Draft for Community Trust Review

---

## 1. Overview

### 1.1 Problem Statement
The community currently relies on WhatsApp groups and word-of-mouth to track members (births, marriages, deaths) and to facilitate matrimonial matches. This is unstructured, hard to search, has no verification, and offers no privacy control. Survey data indicates real frustration among unmarried community members with the current matchmaking process.

### 1.2 Solution
A closed, trust-backed digital platform with two core modules:
1. **Community Registry** — a verified record of all community members across all ages, with tiered visibility and family-based access control.
2. **Matrimonial Module** — an opt-in, privacy-first matching layer built on top of verified registry profiles, modeled on a private-account request/approval flow.

### 1.3 Backing & Legitimacy
The platform is officially backed by the Community Trust, which provides legitimacy, governance authority, and a path to seed initial data and users.

### 1.4 Out of Scope (v1)
- Funding/collections module (weddings, funerals, medical, startups) — deferred to a future phase.
- Cross-sell/vendor marketplace — deferred, requires explicit opt-in design and trust sign-off before consideration.
- Multi-community / white-label expansion — long-term vision only, not part of MVP architecture decisions.

---

## 2. Goals & Success Metrics

### 2.1 Goals
- Digitize and centralize community member records with strong privacy and verification controls.
- Provide a trusted, in-community alternative to matrimony platforms and informal matchmaking.
- Establish a reusable trust/verification model that could extend to other communities later.

### 2.2 Success Metrics (first 6 months post-launch)
- Number of verified profiles created (target: meaningful % of the ~10,000-person community).
- Number of matrimony opt-ins among eligible (unmarried adult) members.
- Number of successful connection requests (mutual approval) via the matrimony module.
- Verification turnaround time (request → admin decision).
- Monthly active users (login/browse activity, not just signups).

---

## 3. User Roles

| Role | Description |
|---|---|
| **Community Admin (Head)** | Final authority. Resolves escalations/tie-breaks between Local Admins. Full visibility into admin dashboard. |
| **Local Admin** | Regional admins (4–5 minimum). Verify new members in their area. Verified themselves by peer Local Admins. |
| **Family Head / Verified Adult Family Member** | Can manage family members' profiles, co-approve minors' data, and act as matrimony co-approver if selected. |
| **Self (Verified Adult, 18+)** | Full control of own profile, can edit own data (self-edit takes priority in conflicts), can opt into matrimony module. |
| **Minor (Under 18)** | View-only access. Cannot edit, post, or initiate connection requests. Profile managed by parent/family head. |
| **Unverified User** | Can create an account but has no access to view registry or connect with others until verification is complete. |

---

## 4. Functional Requirements

### 4.1 Community Registry Module

#### 4.1.1 Profile Data (v1 — Simple Profile)
**Mandatory fields:**
- Full Name
- Date of Birth
- Gender
- Marital Status
- One Profile Photo
- Contact Number
- Address
- Family/Parent Linkage (or "Orphan/No Family" → routed to Admin for manual handling)

**Optional fields (v1):**
- Occupation

> Note: Profile schema is intentionally minimal for v1 and designed to expand in future versions (family tree depth, education, additional photos, etc.).

#### 4.1.2 Family Structure
- Flat profiles grouped by Family Unit (not a full multi-generational tree in v1).
- Each profile links to a Family Unit and, where applicable, to a Family Head.

#### 4.1.3 Minors (Under 18)
- Added/edited by parent or family head only.
- Minor accounts are view-only — no edit rights, no connection requests, no posting.
- At age 18: the platform unlocks **dual access** — the now-adult gains their own login/edit control *in addition to* continued family head access (not a full handoff/replacement).

#### 4.1.4 Visibility Tiers
- **Public (to all verified community members):** Age, Full Name, One Photo.
- **Restricted (not publicly visible):** DOB (exact), address, contact number, occupation, family linkage details — visible only to the profile owner, family head, and admins, unless explicitly shared via a connection request.

#### 4.1.5 Edit Permissions
- Edit access granted to: **Family Head + Self + Community Admin.**
- Conflict resolution: **self-edit takes priority** over family-head edits.

#### 4.1.6 Death Handling
- Upon death announcement (verified by admin/family), account is **deactivated** and converted into a **Memorial Record** — retained, not deleted, with restricted edit access (effectively archived).

---

### 4.2 Verification System

#### 4.2.1 Verification Levels
A new account is created in a **locked state**: the user can sign up but **cannot view the registry or initiate any connections** until verification is complete.

**Verification requires:**
1. Community Admin approval, **and**
2. Local Admin approval, **and**
3. (If applicable) confirmation from an already-verified Family Member.

#### 4.2.2 Local Admin Structure
- Local Admins are **regional** (authority scoped to their assigned area).
- Local Admins are themselves verified by peer Local Admins (minimum 4–5 admins cross-check each other) — prevents unilateral/fraudulent approval.

#### 4.2.3 Tie-Break / Escalation
- If Local Admins disagree on a verification decision, the case **escalates to the Community Admin (Head)**, whose decision is final.

#### 4.2.4 What Verification Unlocks
- Pre-verification: account exists, but no registry visibility, no browsing, no connection requests.
- Post-verification: full registry browsing (within visibility-tier rules) and ability to initiate/receive connection requests.

---

### 4.3 Matrimonial Module

#### 4.3.1 Opt-In Model
- Matrimony visibility is **not automatic** — eligible (unmarried, adult, verified) members must explicitly opt in.

#### 4.3.2 Profile Visibility (Private-Account Model)
- Functions like a private Instagram account: base profile (age, name, one photo) is visible per registry rules; full matrimony profile details require an approved connection request.

#### 4.3.3 Connection Request Flow
1. User A sends a connection/interest request to User B.
2. **Self-approval:** User B reviews and approves/declines.
3. **Optional double approval:** If User B has enabled this setting, the request also requires approval from a **specific family member User B has designated** (selected by username/photo at setup — not required to be the Family Head specifically).
4. Upon all required approvals, **access is granted** (richer profile + contact details revealed, per agreed terms).

#### 4.3.4 Configuration
- Each user independently chooses:
  - Whether to opt into the matrimony module at all.
  - Whether double approval (family co-approval) is required for their connection requests.
  - Which specific family member acts as their co-approver, if enabled.

---

## 5. Non-Functional Requirements

### 5.1 Privacy & Data Protection
- Minimal data collection (simple profile, expand later only with clear justification).
- Tiered visibility strictly enforced at the API level, not just UI-level hiding.
- Minor data protection: no edit/connection capability until 18; parental consent assumed via Family Head account creation.
- Memorial records: read-only, no further edits except by Community Admin if a correction is needed.

### 5.2 Trust & Anti-Fraud
- Multi-party verification (Admin + Local Admin + Family, where applicable) prevents fake/duplicate profiles.
- Peer cross-verification of Local Admins prevents single-point admin abuse.
- Escalation path ensures disputes don't stall indefinitely.

### 5.3 Localization
- Language support: English + Kannada (and Hindi if needed) — to be confirmed based on community age-range tech comfort.
- Consider simplified UI mode for elderly/low-tech-literacy users.

### 5.4 Performance & Scale
- Designed for ~10,000 users initially; architecture should not require redesign for growth to 20–50k within the same community instance.

---

## 6. Technical Architecture (Proposed)

### 6.1 Stack
- **Backend:** FastAPI (Python)
- **Frontend:** React
- **Database:** PostgreSQL
- **Hosting:** GCP (Cloud Run + Cloud SQL), leveraging existing GCP credits through August 2026
- **Auth:** OTP-based phone verification (e.g., MSG91/Twilio)
- **Storage:** Cloud Storage for profile photos

### 6.2 Core Data Entities (high-level)
- `User` — auth identity, role, verification status
- `Profile` — registry data, linked to User and FamilyUnit
- `FamilyUnit` — groups related profiles, defines Family Head
- `VerificationRequest` — tracks admin/local-admin/family approval state, escalation status
- `AdminRegion` — maps Local Admins to geographic scope
- `MatrimonyProfile` — opt-in extension of Profile, approver configuration
- `ConnectionRequest` — tracks self-approval + optional family-approval state machine
- `MemorialRecord` — archived state of a deactivated Profile

### 6.3 Access Control
- Role-based access control (RBAC) enforced server-side for all visibility tiers.
- Edit conflict resolution: self-edit overrides family-head edit (last-write semantics favor profile owner).

---

## 7. Open Questions (To Resolve During Build)

- Exact list of admin actions logged for audit purposes (recommend full audit trail for all verification and profile-edit actions).
- Specific process for handling disputed/incorrect data after verification (correction request flow).
- Whether Kannada/Hindi localization is needed for MVP launch or can follow in v1.1.
- Final decision on whether matrimony co-approver must be an adult verified family member (recommended, not yet explicitly confirmed).

---

## 8. Phased Roadmap (Indicative)

| Phase | Scope |
|---|---|
| **MVP (v1)** | Registry + Verification system + Matrimonial module (as specified above) |
| **v1.1** | Expanded profile fields, family tree depth, localization |
| **v2** | Funding/collections module (weddings, funerals, medical) — pending compliance review |
| **v3 (long-term vision)** | Multi-community licensing model (white-label trust deployments), community-vendor marketplace (opt-in only), startup-funding/grant tracking module |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Low adoption despite community trust backing | Manual onboarding of first 50–100 pilot users; trust-led promotion at community events |
| Fake/duplicate profiles | Multi-party verification + peer-verified admins |
| Trust erosion from data misuse perception | Strict opt-in for matrimony visibility; no cross-selling or data use beyond stated purpose without explicit consent |
| Admin collusion or abuse | Minimum 4–5 peer-verified Local Admins + escalation path to Community Admin |
| Minor data mishandling | Hard view-only restriction until 18; no edit/connection capability pre-18 |
| Registry data going stale | Self-edit priority + family-head maintenance responsibility; periodic admin review (process TBD) |

---

*End of PRD — v1.0*
