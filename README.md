# 🌐 CommunityConnect

A full-stack platform to connect and empower local communities. Built with **FastAPI** (Python) on the backend and **React** + **TailwindCSS** on the frontend.

---

## 📁 Project Structure

```
communityconnect/
├── backend/                    # FastAPI Backend
│   ├── alembic/                # Database migrations
│   │   ├── versions/           # Migration files
│   │   ├── env.py              # Alembic environment config
│   │   └── script.py.mako      # Migration template
│   ├── app/
│   │   ├── api/v1/             # API routes (versioned)
│   │   │   ├── endpoints/      # Individual endpoint modules
│   │   │   └── router.py       # API v1 router aggregator
│   │   ├── core/               # Configuration & settings
│   │   ├── db/                 # Database session & base
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app entry point
│   ├── venv/                   # Python virtual environment
│   ├── .env                    # Environment variables
│   ├── alembic.ini             # Alembic configuration
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # Axios API client
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components
│   │   ├── App.jsx             # Root app with routing
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles & Tailwind
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # TailwindCSS configuration
│   └── postcss.config.js       # PostCSS configuration
│
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **PostgreSQL** (running locally or remotely)

---

### Backend Setup

```bash
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies (already installed)
pip install -r requirements.txt

# Update .env with your database credentials

# Run database migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

📖 API docs available at: **http://localhost:8000/docs**

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

🌐 App available at: **http://localhost:5173**

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Backend    | FastAPI, SQLAlchemy, Alembic        |
| Database   | PostgreSQL (async via asyncpg)      |
| Auth       | JWT (python-jose), Passlib (bcrypt) |
| Frontend   | React 18, Vite 5                    |
| Styling    | TailwindCSS 3                       |
| HTTP       | Axios                               |
| Routing    | React Router v6                     |
