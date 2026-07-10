# 🌐 CommunityConnect

A premium, full-stack platform designed to connect and empower local communities. Built with a scalable **FastAPI** (Python) backend, a **React** + **TailwindCSS** frontend, and powered by **PostgreSQL** & **Redis**.

---

## ✨ Comprehensive Feature Set

### 1. Identity & Access Management
- **Secure Authentication**: JWT-based login with bcrypt password hashing.
- **OTP Verification**: Email-based One-Time-Password (OTP) flow for new user verification.
- **Account Recovery**: Fully functional "Forgot Password" workflow utilizing secure expiring OTP tokens.
- **Role-Based Access Control**: Differentiated permissions for Standard Users vs. Administrators.

### 2. Community Profiles
- **Member Directory**: Public and private visibility of community members.
- **Admin Verification**: Admins manually review and verify members (`verified_at`), displaying a blue tick across the platform.
- **Privacy Controls**: Sensitive contact details (phone, email, full address) are masked by default and only visible to approved connections.

### 3. Matrimonial Matchmaking
- **Opt-In System**: Users choose to create a detailed matrimony profile containing professional, physical, lifestyle, and astrological (Gotra/Rashi/Nakshatra) attributes.
- **Swiper Dashboard**: A premium, mobile-first card swiper interface with micro-animations for browsing matches.
- **Interactions (Likes/Dislikes)**: Swipe right to Express Interest, swipe left to dismiss/dislike (persisted in DB).
- **Pagination & Prefetching**: Infinite scrolling architecture with background prefetching for a seamless browsing experience.

### 4. Connection Requests & Network
- **Two-Way Approvals**: Users can send connection requests. Receiving users can approve or decline them.
- **Family Co-Approval**: Wards must have connections approved by both themselves and their linked Guardian.

### 5. Guardian Recommends Feature
- **Dual Perspective**: Guardians can browse matrimonial profiles independently on behalf of their wards.
- **Ward Picker**: Guardians with multiple wards can selectively recommend profiles to specific wards.
- **Inbox Integration**: Wards see a pinned "Recommended for You" section on their dashboard and can view/action guardian recommendations in their dedicated Request Center.

### 6. Security & Infrastructure
- **Redis Rate Limiting**: Centralized global rate limiting (via `slowapi` and Redis) blocking brute-force logins and OTP spammers.
- **Database Migrations**: State-tracked database schema migrations using **Alembic** ensuring safe, repeatable CI/CD deployment logic.

---

## 📁 Project Structure

```
communityconnect/
├── backend/                    # FastAPI Backend
│   ├── alembic/                # Database schema migrations
│   │   └── versions/           # Versioned migration history
│   ├── app/
│   │   ├── api/v1/             # API routes (auth, profiles, matrimony, uploads)
│   │   ├── core/               # Configuration & Limiter
│   │   ├── db/                 # Database session configuration
│   │   ├── models/             # SQLAlchemy ORM models (declarative base)
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app entry point
│   ├── .env                    # Environment variables (DB, SMTP, Redis)
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api/                # Axios API client & interceptors
│   │   ├── components/         # Reusable UI elements (Dialogs, Avatars)
│   │   ├── contexts/           # React Context (Auth, Language, Theme)
│   │   ├── pages/              # Views (Dashboard, Matrimony, Requests, Auth)
│   │   └── index.css           # Global styles & Tailwind configuration
│   ├── package.json            # Node dependencies
│   └── tailwind.config.js      # TailwindCSS styling tokens
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **PostgreSQL** (running locally or remotely)
- **Redis** (running locally or remotely for rate limiting)

---

### Backend Setup

```bash
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure your environment
# Create a .env file containing your DATABASE_URL, REDIS_URL, and EMAIL settings.

# Run database migrations using Alembic
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

📖 **API Documentation**: Available automatically at `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

🌐 **Web Application**: Available at `http://localhost:5173`

---

## 🛠️ Technology Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| **Backend**    | FastAPI, SQLAlchemy (async), Alembic        |
| **Database**   | PostgreSQL (via asyncpg), Redis (Rate Limiting) |
| **Security**   | JWT (python-jose), Passlib (bcrypt), Slowapi |
| **Frontend**   | React 18, Vite 5, React Query v5    |
| **Styling**    | TailwindCSS, Lucide Icons           |
| **State**      | React Context, Axios Interceptors   |
| **Routing**    | React Router DOM v6                 |
