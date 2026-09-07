# INNERVOICE — How to Start

## Quick Start (3 Steps)

### Step 1: Start XAMPP MySQL
1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. Wait for the green indicator ✅

### Step 2: Set Up the Database
1. Open your browser → go to `http://localhost/phpmyadmin`
2. Click **"New"** in the left sidebar to create a new database
3. OR click **"SQL"** tab at the top and paste the contents of:
   ```
   INNERVOICE/backend/database/setup_complete.sql
   ```
4. Click **"Go"** / **Execute**
5. The `innervoice` database with all 25 tables will be created ✅

### Step 3: Start the Backend Server
Open **Command Prompt** or **PowerShell**, navigate to the backend folder:

```bash
cd "C:\Users\HP\Downloads\INNERVOICE_updated\INNERVOICE_updated\INNERVOICE\backend"
node server.js
```

You should see:
```
─────────────────────────────────────────────
🌿 INNERVOICE SERVER STARTED
─────────────────────────────────────────────
📡 Backend URL  : http://localhost:5000
🌐 Frontend URL : http://localhost:5000/index.html
🗄️  DB Test      : http://localhost:5000/test-db
🔐 Auth Mode    : ⚡ DEV MODE — OTP auto-verified
─────────────────────────────────────────────
✅ MySQL connected successfully!
```

### Step 4: Open the Frontend
Open your browser and go to:
```
http://localhost:5000/index.html
```

---

## 🔑 Credentials

### Database
| Setting | Value |
|---|---|
| Host | localhost |
| User | root |
| Password | Harshada@423104 |
| Database | innervoice |
| Port | 3306 |

### JWT Secret
Set in `.env` file: `innervoice_jwt_secret_key_2026_secure_random`

---

## ⚡ DEV MODE (Default)

Since real Gmail/Twilio OTP credentials are not configured, the app runs in **DEV MODE**:
- **Registration** creates accounts immediately (no OTP needed)
- **Login** works right after registration
- No email/SMS codes required

To enable real OTP, update these in `INNERVOICE/backend/.env`:
```env
EMAIL_USER=your_real_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE=+1234567890
```

---

## 🧪 Test All APIs

```bash
cd "C:\Users\HP\Downloads\INNERVOICE_updated\INNERVOICE_updated\INNERVOICE\backend"
node test_all_apis.js
```

Expected output: **28 PASS | 0 WARN | 0 FAIL**

---

## 🗄️ Database Tables (25 total)

| # | Table | Purpose |
|---|---|---|
| 1 | `users` | User accounts with OTP fields |
| 2 | `moods` | Mood check-ins |
| 3 | `journals` | Journal entries |
| 4 | `reflections` | Self-reflection entries |
| 5 | `goals` | Wellness goals |
| 6 | `goal_milestones` | Goal sub-targets |
| 7 | `goal_progress_history` | Goal progress tracking |
| 8 | `user_daily_challenges` | Daily challenges |
| 9 | `achievements` | Achievement catalog |
| 10 | `user_achievements` | Unlocked achievements per user |
| 11 | `achievement_xp_transactions` | XP history |
| 12 | `wellness_activity_log` | General activity log |
| 13 | `notifications` | User notifications |
| 14 | `user_preferences` | User settings |
| 15 | `chat_messages` | AI chat history |
| 16 | `voice_journals` | Voice journal transcripts |
| 17 | `emotion_triggers` | Emotion trigger catalog |
| 18 | `mood_triggers` | Mood-trigger mappings |
| 19 | `focus_sessions` | Focus mode sessions |
| 20 | `ai_memory` | AI personalization memory |
| 21 | `habits` | Habit definitions |
| 22 | `habit_completions` | Daily habit completions |
| 23 | `wellness_scores` | Daily wellness scores |
| 24 | `daily_plans` | AI-generated daily plans |
| 25 | `daily_plan_items` | Daily plan tasks |

---

## 📡 API Endpoints (Complete List)

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| POST | `/api/auth/verify-email-otp` | Verify email OTP |
| POST | `/api/auth/verify-phone-otp` | Verify phone OTP |
| POST | `/api/auth/resend-otp` | Resend OTP codes |
| PUT | `/api/auth/streak` | Update streak |

### Mood Tracker
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/moods` | Log new mood |
| GET | `/api/moods` | Get mood history |
| GET | `/api/moods/today` | Get today's mood |
| GET | `/api/moods/analytics` | Mood analytics + insights |
| GET | `/api/moods/calendar?month=YYYY-MM` | Monthly mood calendar |
| GET | `/api/moods/day-details?date=YYYY-MM-DD` | Day details |

### Journal
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/journals` | Create journal entry |
| GET | `/api/journals` | Get all journal entries |
| GET | `/api/journals/:id` | Get single entry |
| PUT | `/api/journals/:id` | Update entry |
| DELETE | `/api/journals/:id` | Delete entry |

### Reflections
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reflections` | Create reflection |
| GET | `/api/reflections` | Get all reflections |
| GET | `/api/reflections/:id` | Get single reflection |
| PUT | `/api/reflections/:id` | Update reflection |
| DELETE | `/api/reflections/:id` | Delete reflection |

### Goals
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/goals` | Create goal |
| GET | `/api/goals` | Get all goals |
| GET | `/api/goals/challenges` | Today's daily challenges |
| PUT | `/api/goals/:id` | Update/complete goal |
| DELETE | `/api/goals/:id` | Delete goal |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Full dashboard data |

### Chat (AI)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat/message` | Send message to AI |
| GET | `/api/chat/history` | Get chat history |
| GET | `/api/chat/daily-message` | Daily motivational message |
| DELETE | `/api/chat/history` | Clear chat history |

### Achievements
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/achievements` | All achievements with progress |
| GET | `/api/achievements/summary` | XP + level info |
| GET | `/api/achievements/history` | XP transaction history |

### Notifications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get all notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Recommendations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recommendations` | Personalized recommendations |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/streak` | Update streak |

### Emergency
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/emergency/resources` | Emergency help resources (public) |

### Habits
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/habits` | Get all habits |
| POST | `/api/habits` | Create habit |
| PUT | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Delete habit |
| POST | `/api/habits/:id/complete` | Mark habit complete |

### Additional Advanced Routes
| Endpoint | Description |
|---|---|
| `/api/wellness-score` | Wellness score tracking |
| `/api/voice-journals` | Voice journal entries |
| `/api/ai-memory` | AI personalization memory |
| `/api/emotion-patterns` | Emotion pattern analysis |
| `/api/focus` | Focus mode sessions |
| `/api/weekly-report` | Weekly wellness report |
| `/api/wellness-insights` | Wellness insights |
| `/api/wellness-journey` | Wellness journey timeline |
| `/api/insights/weekly` | Weekly insights V2 |
| `/api/daily-plan` | AI-generated daily plan |
| `/api/wellness-analytics` | Advanced analytics |

---

## ✅ Test Results

All 28 API endpoints tested and passing:
```
28 PASS | 0 WARN | 0 FAIL
🎉 All critical APIs are working correctly!
```
