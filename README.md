# INNERVOICE — Emotional Wellness App

> A full-stack web application for emotional tracking, journaling, habit building, and AI-powered wellness insights.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up the Database](#2-set-up-the-database)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Install Backend Dependencies](#4-install-backend-dependencies)
  - [5. Run the Backend Server](#5-run-the-backend-server)
  - [6. Open the Frontend](#6-open-the-frontend)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Scripts & Utilities](#scripts--utilities)
- [Chart.js — Local Copy](#chartjs--local-copy)
- [Database Migrations](#database-migrations)
- [License](#license)

---

## Overview

INNERVOICE is a personal emotional wellness platform that helps users:

- Log and track daily moods with rich analytics
- Write guided journal entries
- Build and maintain healthy habits
- Set personal goals with milestone tracking
- Receive AI-powered insights and recommendations via Google Gemini
- Visualise wellness trends with interactive charts

---

## Features

| Feature | Description |
|---|---|
| 🔐 Authentication | JWT-based sign-up / login / logout |
| 📓 Journaling | Rich text journal entries with voice journal support |
| 😊 Mood Tracking | Daily mood logs with emoji selection and notes |
| 📊 Analytics & Insights | Weekly reports, emotion patterns, wellness scores |
| 🎯 Goals | Goal creation with milestone tracking |
| ✅ Habits | Daily habit streaks and completion tracking |
| 💬 AI Chat | Gemini-powered wellness assistant chatbot |
| 🔔 Notifications | In-app notification centre |
| 🏆 Achievements | Gamified achievement system |
| 🆘 Emergency | Quick access to emergency wellness resources |
| 📅 Daily Plan | AI-generated smart daily wellness plans |
| 🧘 Focus Mode | Distraction-free focus sessions |

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Markup | HTML5 (single-page, `index.html`) |
| Styling | Vanilla CSS (`style.css`) |
| Logic | Vanilla JavaScript (`script.js`) |
| Charts | **Chart.js v4.4.0** (served locally from `assets/js/`) |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js v5 |
| Database | MySQL 8 (via `mysql2`) |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcrypt` |
| AI | Google Gemini API |
| Dev Server | Nodemon |
| Testing | Jest + Supertest |

---

## Project Structure

```
INNERVOICE_updated/
├── index.html                  # Single-page frontend (all views)
├── script.js                   # Main frontend JS (all logic)
├── style.css                   # Global styles
├── README.md                   # This file
├── assets/
│   └── js/
│       └── chart.umd.min.js    # Chart.js v4.4.0 (local copy)
├── favicon.ico / favicon.svg
│
└── INNERVOICE/
    └── backend/
        ├── server.js           # Express app entry point
        ├── db.js               # MySQL connection pool
        ├── schema.sql          # Full database schema
        ├── package.json
        ├── .env                # Environment variables (see below)
        │
        ├── routes/             # API route handlers (24 modules)
        ├── middleware/         # Auth & other middleware
        └── services/           # Business-logic services
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later — https://nodejs.org
- **MySQL** 8.0 or later — https://dev.mysql.com/downloads/
- A **Google Gemini API key** — https://aistudio.google.com/app/apikey

---

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd INNERVOICE_updated
```

---

### 2. Set Up the Database

```sql
-- In MySQL client or Workbench:
CREATE DATABASE innervoice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then import the schema:

```bash
mysql -u root -p innervoice < INNERVOICE/backend/schema.sql
```

---

### 3. Configure Environment Variables

Edit the `.env` file inside `INNERVOICE/backend/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=innervoice
PORT=5000
JWT_SECRET=your_strong_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

> **⚠️ Never commit `.env` to version control.** It is already listed in `.gitignore`.

---

### 4. Install Backend Dependencies

```bash
cd INNERVOICE/backend
npm install
```

---

### 5. Run the Backend Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The API will be available at `http://localhost:5000`.

---

### 6. Open the Frontend

Open `index.html` directly in your browser, or serve the project root with any static server:

```bash
# Using Node's built-in serve (install once: npm i -g serve)
serve .
# Then visit http://localhost:3000
```

> The frontend expects the backend API at `http://localhost:5000`. No build step required.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `DB_NAME` | MySQL database name | `innervoice` |
| `PORT` | Backend server port | `5000` |
| `JWT_SECRET` | Secret for signing JWT tokens | `a_long_random_string` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |

---

## API Routes

All routes are served from `http://localhost:5000`.

| Path prefix | Module |
|---|---|
| `/api/auth` | Authentication (register, login) |
| `/api/moods` | Mood logs |
| `/api/journals` | Journal entries |
| `/api/habits` | Habit tracking |
| `/api/goals` | Goals & milestones |
| `/api/analytics` | Mood & wellness analytics |
| `/api/dashboard` | Dashboard summary |
| `/api/chat` | AI wellness chatbot |
| `/api/recommendations` | Personalised recommendations |
| `/api/weekly-report` | Weekly wellness report |
| `/api/wellness-insights` | Wellness insights |
| `/api/wellness-journey` | Journey timeline |
| `/api/wellness-scores` | Wellness score calculations |
| `/api/weekly-insights` | Weekly insights v2 |
| `/api/emotion-patterns` | Emotion pattern analysis |
| `/api/daily-plan` | Smart daily plan |
| `/api/achievements` | Achievement system |
| `/api/notifications` | Notification centre |
| `/api/reflections` | Reflections |
| `/api/focus-mode` | Focus mode sessions |
| `/api/emergency` | Emergency resources |
| `/api/ai-memory` | Gemini AI memory context |
| `/api/users` | User profile |
| `/api/voice-journals` | Voice journal entries |

---

## Scripts & Utilities

Located in the project root:

| File | Purpose |
|---|---|
| `test_master_backend_audit.js` | Full backend integration audit (requires server running on port 5000) |
| `test_daily_challenges.js` | Daily challenge endpoint tests |
| `test_insights.js` | Insights endpoint tests |
| `test_meditation_music.js` | Meditation & music feature tests |
| `test_mood_e2e.js` | End-to-end mood flow tests |
| `01_premium_base_css.js` → `08_phase12_frontend.js` | Frontend build / inject scripts |

To syntax-check the main JS file:
```bash
node -c script.js
```

---

## Chart.js — Local Copy

Chart.js v4.4.0 is served from a **local file** to avoid browser Tracking Prevention storage warnings that occur with external CDNs:

```
assets/js/chart.umd.min.js   ← Chart.js 4.4.0 UMD minified build
```

Referenced in `index.html`:
```html
<!-- Chart.js — served locally (v4.4.0 UMD build, avoids CDN tracking-prevention warnings) -->
<script src="assets/js/chart.umd.min.js" defer></script>
```

No chart behavior, data, colors, or API was changed — only the loading source.

---

## Database Migrations

Additional SQL/JS migration files in `INNERVOICE/backend/` for incremental schema updates:

| File | Description |
|---|---|
| `schema.sql` | Full initial schema (run first) |
| `migrate.sql` | General migrations |
| `migrate_new_features.sql` | New feature additions |
| `migrate_habits.sql` | Habits table |
| `migrate_daily_plan.sql` | Daily plan table |
| `migrate_advanced_features.sql` | Advanced feature columns |
| `migrate_phase15.sql` | Phase 15 schema additions |
| `migrate_utf8mb4.sql` | UTF-8 charset upgrade |

Run any SQL migration:
```bash
mysql -u root -p innervoice < INNERVOICE/backend/<migration_file>.sql
```

Run any JS migration:
```bash
node INNERVOICE/backend/migrate_achievements.js
```

---

## License

This project is for personal and educational use. All rights reserved © INNERVOICE 2026.
