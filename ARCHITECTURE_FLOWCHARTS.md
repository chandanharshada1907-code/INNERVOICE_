# INNERVOICE OTP Implementation - Architecture & Flowcharts

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        INNERVOICE PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  FRONTEND (HTML/CSS/JS)                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ • Registration Form                                     │   │
│  │   - Name, Email, Phone, Password                       │   │
│  │ • OTP Verification Section                             │   │
│  │   - Email OTP Input                                    │   │
│  │   - Phone OTP Input                                    │   │
│  │   - Verify & Resend Buttons                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              BACKEND (Node.js/Express)                  │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Routes (auth.js):                                       │   │
│  │ • POST /register        → Create user + send OTPs      │   │
│  │ • POST /verify-email-otp → Verify email                │   │
│  │ • POST /verify-phone-otp → Verify phone                │   │
│  │ • POST /resend-otp      → Resend with rate limiting    │   │
│  │ • POST /login           → Check verification status    │   │
│  │                                                         │   │
│  │ Services (otp-service.js):                              │   │
│  │ • generateOTP()         → 6-digit random number         │   │
│  │ • hashOTP()             → bcrypt hashing                │   │
│  │ • verifyOTP()           → compare with stored hash      │   │
│  │ • sendEmailOTP()        → Nodemailer integration        │   │
│  │ • sendSMSOTP()          → Twilio integration            │   │
│  │ • isOTPExpired()        → Check 5-min window            │   │
│  │ • canResendOTP()        → Check 60-sec cooldown         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           DATABASE (MySQL - users table)                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ Existing Columns:        New Columns:                   │   │
│  │ • id (PK)               • phone_number (VARCHAR)       │   │
│  │ • name                  • email_verified (BOOL)         │   │
│  │ • email (UNIQUE)        • phone_verified (BOOL)         │   │
│  │ • password (bcrypt)     • email_otp_hash (VARCHAR)      │   │
│  │ • streak               • email_otp_expires_at (DT)     │   │
│  │ • created_at           • phone_otp_hash (VARCHAR)       │   │
│  │ • xp                   • phone_otp_expires_at (DT)      │   │
│  │ • level                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ↕                                   │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   Nodemailer │  │     Twilio       │  │   JWT Token     │  │
│  │ (Email OTP)  │  │  (SMS OTP)       │  │ (Authentication)│  │
│  └──────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Registration Flow Diagram

```
START: User Registration
     ↓
   ┌─────────────────────────────────────┐
   │ User Fills Registration Form        │
   │ • Name                              │
   │ • Email                             │
   │ • Phone (NEW)                       │
   │ • Password                          │
   │ • Confirm Password                  │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ Client-Side Validation              │
   │ • All fields required?              │
   │ • Password ≥ 6 chars?               │
   │ • Phone ≥ 10 digits?                │
   │ • Passwords match?                  │
   └─────────────────────────────────────┘
     ↓ Valid
   ┌─────────────────────────────────────┐
   │ Backend: /register Endpoint         │
   │                                     │
   │ 1. Check email uniqueness           │
   │    ├─ Not unique? → Error 409       │
   │    └─ Unique → Continue             │
   │                                     │
   │ 2. Check phone uniqueness           │
   │    ├─ Not unique? → Error 409       │
   │    └─ Unique → Continue             │
   │                                     │
   │ 3. Hash password (bcrypt)           │
   │                                     │
   │ 4. Generate email OTP (6-digit)     │
   │                                     │
   │ 5. Generate phone OTP (6-digit)     │
   │                                     │
   │ 6. Hash both OTPs (bcrypt)          │
   │                                     │
   │ 7. Create user record               │
   │    email_verified = FALSE           │
   │    phone_verified = FALSE           │
   │                                     │
   │ 8. Send email OTP via Nodemailer    │
   │    ├─ Success → Continue            │
   │    └─ Failed → Delete user, error   │
   │                                     │
   │ 9. Send SMS OTP via Twilio          │
   │    (optional, graceful if fails)    │
   │                                     │
   │ 10. Return user_id                  │
   └─────────────────────────────────────┘
     ↓ Success
   ┌─────────────────────────────────────┐
   │ Frontend: Show OTP Verification     │
   │                                     │
   │ • Email OTP Input (6 digits)        │
   │ • Phone OTP Input (6 digits)        │
   │ • Verify Button                     │
   │ • Resend OTP Button                 │
   │ • Back to Register Button           │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ User Receives Email with OTP        │
   │                                     │
   │ "Your verification code is: XXXXXX" │
   │ "Valid for 5 minutes"               │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ User Receives SMS with OTP          │
   │                                     │
   │ "Your verification code is: XXXXXX" │
   │ "Do not share with anyone"          │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ User Enters Both OTPs               │
   │ • Pastes email OTP (6 digits)       │
   │ • Pastes phone OTP (6 digits)       │
   │ • Clicks "Verify Both OTPs"         │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ Backend: Verify Email OTP           │
   │                                     │
   │ 1. Fetch user record                │
   │                                     │
   │ 2. Check email_verified = FALSE?    │
   │    └─ If TRUE → Already verified    │
   │                                     │
   │ 3. Check OTP not expired            │
   │    ├─ Expired? → Error              │
   │    └─ Valid → Continue              │
   │                                     │
   │ 4. Compare OTP with hash            │
   │    ├─ Match? → Continue             │
   │    └─ No match → Error              │
   │                                     │
   │ 5. Set email_verified = TRUE        │
   │                                     │
   │ 6. Clear OTP hash                   │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ Backend: Verify Phone OTP           │
   │                                     │
   │ 1. Fetch user record                │
   │                                     │
   │ 2. Check phone_verified = FALSE?    │
   │    └─ If TRUE → Already verified    │
   │                                     │
   │ 3. Check OTP not expired            │
   │    ├─ Expired? → Error              │
   │    └─ Valid → Continue              │
   │                                     │
   │ 4. Compare OTP with hash            │
   │    ├─ Match? → Continue             │
   │    └─ No match → Error              │
   │                                     │
   │ 5. Set phone_verified = TRUE        │
   │                                     │
   │ 6. Clear OTP hash                   │
   └─────────────────────────────────────┘
     ↓ Both Verified
   ┌─────────────────────────────────────┐
   │ Frontend: Show Success Message      │
   │                                     │
   │ "✓ Account verified successfully!"  │
   │ "Redirecting to login..."           │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ Redirect to Login Page              │
   │                                     │
   │ User now has:                       │
   │ • email_verified = TRUE             │
   │ • phone_verified = TRUE             │
   │ • Can login with email & password   │
   └─────────────────────────────────────┘
     ↓
END: Ready to Login
```

---

## 🔐 Login Flow Diagram

```
START: User Login
     ↓
   ┌─────────────────────────────────────┐
   │ User Fills Login Form               │
   │ • Email                             │
   │ • Password                          │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ Backend: /login Endpoint            │
   │                                     │
   │ 1. Fetch user by email              │
   │    ├─ Not found → Error 401         │
   │    └─ Found → Continue              │
   │                                     │
   │ 2. Compare password with bcrypt     │
   │    ├─ No match → Error 401          │
   │    └─ Match → Continue              │
   │                                     │
   │ 3. Check email_verified             │
   │    ├─ FALSE → Error 403             │
   │    │   "Account not verified"       │
   │    │   Offer to verify now          │
   │    └─ TRUE → Continue               │
   │                                     │
   │ 4. Check phone_verified             │
   │    ├─ FALSE → Error 403             │
   │    │   "Account not verified"       │
   │    │   Offer to verify now          │
   │    └─ TRUE → Continue               │
   │                                     │
   │ 5. Generate JWT token               │
   │    • user_id, name, email           │
   │    • Expiry: 7 days                 │
   │                                     │
   │ 6. Return token                     │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ Frontend: Store JWT & Login         │
   │                                     │
   │ 1. Save token to localStorage       │
   │ 2. Save user data                   │
   │ 3. Show welcome message             │
   │ 4. Redirect to dashboard            │
   └─────────────────────────────────────┘
     ↓
   ┌─────────────────────────────────────┐
   │ Access Dashboard                    │
   │                                     │
   │ • All features available            │
   │ • Mood tracker                      │
   │ • Journal                           │
   │ • Chatbot                           │
   │ • Goals                             │
   │ • Notifications                     │
   │ • Etc.                              │
   └─────────────────────────────────────┘
     ↓
END: Logged In Successfully
```

---

## ⏱️ OTP Lifecycle Diagram

```
Time: T=0 (OTP Generation)
┌─────────────────────────────────────┐
│ 1. OTP Generated: 123456            │
│ 2. Hash OTP: bcrypt(123456)         │
│ 3. Store email_otp_hash             │
│ 4. Set expires_at = T + 5 minutes   │
│ 5. Send OTP to user                 │
└─────────────────────────────────────┘
         ↓
Time: T=1min (User Receives OTP)
┌─────────────────────────────────────┐
│ User receives "Your OTP is 123456"  │
│ • Email inbox (Nodemailer)          │
│ • SMS message (Twilio)              │
│ • OTP is valid for 4 more minutes   │
└─────────────────────────────────────┘
         ↓
Time: T=2min (User Tries Resend - Cooldown)
┌─────────────────────────────────────┐
│ User clicks "Resend OTP"            │
│ • Only 1 minute elapsed             │
│ • Cooldown is 60 seconds            │
│ • Message: "Wait 59 seconds"        │
│ • Request rejected                  │
│ • Original OTP still valid          │
└─────────────────────────────────────┘
         ↓
Time: T=3min (User Tries Resend - Success)
┌─────────────────────────────────────┐
│ User clicks "Resend OTP"            │
│ • 60+ seconds have passed           │
│ • Generate NEW OTP: 654321          │
│ • Send NEW OTP to user              │
│ • Cooldown resets                   │
│ • Old OTP hash replaced             │
│ • Expires at T=8min                 │
└─────────────────────────────────────┘
         ↓
Time: T=3:30min (User Enters Wrong OTP)
┌─────────────────────────────────────┐
│ User enters: 111111                 │
│ • Not expired (4:30 left)           │
│ • Hash comparison: FAIL             │
│ • Error: "Invalid OTP"              │
│ • OTP still valid                   │
│ • User can try again                │
└─────────────────────────────────────┘
         ↓
Time: T=4min (User Enters Correct OTP)
┌─────────────────────────────────────┐
│ User enters: 654321                 │
│ • Not expired (1 minute left)       │
│ • Hash comparison: SUCCESS          │
│ • Set phone_verified = TRUE         │
│ • Clear OTP hash                    │
│ • Clear OTP expiry                  │
│ • Success!                          │
└─────────────────────────────────────┘
         ↓
Time: T=5:30min (Original OTP Expired)
┌─────────────────────────────────────┐
│ If user hadn't verified:            │
│ • Original OTP would be expired     │
│ • Error: "OTP expired"              │
│ • User must request new OTP         │
│ • Hash still in database            │
│ • But verification check rejects it │
└─────────────────────────────────────┘
```

---

## 🔄 Resend OTP Cooldown Diagram

```
Time: T=0
User clicks "Resend OTP"
         ↓
   ┌─────────────────┐
   │ 60 Second Timer │
   │ "Wait 60 sec"   │
   │ Button disabled │
   └─────────────────┘
         ↓
Time: T=10sec
Timer: "Wait 50 sec"
         ↓
Time: T=30sec
Timer: "Wait 30 sec"
         ↓
Time: T=50sec
Timer: "Wait 10 sec"
Button still disabled
         ↓
Time: T=60sec
Timer disappears
Button enabled
         ↓
User can "Resend OTP" again
Cooldown resets
         ↓
Time: T=60sec + new OTP time
2 active timers:
• Resend cooldown: 60 sec
• OTP expiry: 5 min
```

---

## 🔒 Security Flow Diagram

```
User Input (Plaintext OTP)
         ↓
   ┌─────────────────────────────────────┐
   │ Never Logged or Displayed           │
   │ Never Stored in Browser Storage     │
   │ Only used for hash comparison       │
   └─────────────────────────────────────┘
         ↓
   ┌─────────────────────────────────────┐
   │ Backend Receives OTP                │
   │ 1. Immediately hash with bcrypt     │
   │ 2. Compare with stored hash         │
   │ 3. Clear from memory                │
   │ 4. Never log to console             │
   └─────────────────────────────────────┘
         ↓
Database Storage
   ┌─────────────────────────────────────┐
   │ email_otp_hash: $2b$10$XYZ...       │
   │ (Not plaintext 123456)              │
   │                                     │
   │ phone_otp_hash: $2b$10$ABC...       │
   │ (Not plaintext 654321)              │
   │                                     │
   │ Hashes cleared after verification   │
   └─────────────────────────────────────┘
         ↓
On Verification
   ┌─────────────────────────────────────┐
   │ 1. OTP hashes deleted               │
   │ 2. Expiry timestamps cleared        │
   │ 3. Only verified flags remain       │
   │ 4. Complete cleanup                 │
   └─────────────────────────────────────┘
```

---

## 📧 Email Flow Diagram

```
Backend generates OTP
         ↓
   ┌──────────────────────────────────┐
   │ Nodemailer Configuration         │
   │ • Service: Gmail (or other SMTP) │
   │ • Auth: EMAIL_USER + PASSWORD    │
   │ • From: EMAIL_FROM               │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │ Email Message                    │
   │ • To: user@example.com           │
   │ • Subject: INNERVOICE Verification
   │ • Body: HTML template            │
   │ • Shows 6-digit code             │
   │ • Shows 5-min expiry             │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │ SMTP Server (Gmail)              │
   │ • Authenticates sender           │
   │ • Validates email format         │
   │ • Routes to recipient            │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │ User Receives Email              │
   │ • Email inbox (Gmail, Outlook)   │
   │ • Copy verification code         │
   │ • Paste into app                 │
   └──────────────────────────────────┘
```

---

## 📱 SMS Flow Diagram

```
Backend generates OTP
         ↓
   ┌──────────────────────────────────┐
   │ Twilio Configuration             │
   │ • Account SID                    │
   │ • Auth Token                     │
   │ • From Phone: TWILIO_PHONE       │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │ SMS Message                      │
   │ • To: +1-234-567-8900            │
   │ • Body: Your OTP is 654321       │
   │ • Valid for 5 minutes            │
   │ • Don't share with anyone        │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │ Twilio API                       │
   │ • Authenticates request          │
   │ • Routes to SMS gateway          │
   │ • Sends SMS to carrier           │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │ User Receives SMS                │
   │ • Phone notification             │
   │ • Copy verification code         │
   │ • Paste into app                 │
   └──────────────────────────────────┘
```

---

## 🗄️ Database State Transitions

```
UNREGISTERED USER
     ↓

Step 1: POST /register
┌─────────────────────────────────────┐
│ INSERT INTO users:                  │
│ • name: "John Doe"                  │
│ • email: "john@example.com"         │
│ • email: UNIQUE constraint          │
│ • password: bcrypt hash             │
│ • phone_number: "1234567890"        │
│ • phone_number: UNIQUE constraint   │
│ • email_verified: FALSE             │
│ • phone_verified: FALSE             │
│ • email_otp_hash: bcrypt(123456)    │
│ • email_otp_expires_at: NOW+5min    │
│ • phone_otp_hash: bcrypt(654321)    │
│ • phone_otp_expires_at: NOW+5min    │
└─────────────────────────────────────┘
         ↓
UNVERIFIED USER (awaiting email OTP)
     ↓

Step 2: POST /verify-email-otp
┌─────────────────────────────────────┐
│ UPDATE users:                       │
│ • email_verified: FALSE → TRUE      │
│ • email_otp_hash: bcrypt(...) → NULL
│ • email_otp_expires_at: ... → NULL  │
└─────────────────────────────────────┘
         ↓
PARTIALLY VERIFIED (email done, awaiting phone OTP)
     ↓

Step 3: POST /verify-phone-otp
┌─────────────────────────────────────┐
│ UPDATE users:                       │
│ • phone_verified: FALSE → TRUE      │
│ • phone_otp_hash: bcrypt(...) → NULL
│ • phone_otp_expires_at: ... → NULL  │
└─────────────────────────────────────┘
         ↓
FULLY VERIFIED USER (can login)
     ↓

Step 4: POST /login
┌─────────────────────────────────────┐
│ Check:                              │
│ • email_verified = TRUE ✓           │
│ • phone_verified = TRUE ✓           │
│ • Compare password with bcrypt ✓    │
│ • Generate JWT token                │
│ • Return token to client            │
└─────────────────────────────────────┘
         ↓
AUTHENTICATED USER (with JWT token)
```

---

## 🔗 Endpoint Dependency Diagram

```
Frontend Registration Form
     ↓
POST /api/auth/register
     ├─ Check email uniqueness (DB query)
     ├─ Check phone uniqueness (DB query)
     ├─ Hash password (bcrypt)
     ├─ Generate OTPs (crypto)
     ├─ Hash OTPs (bcrypt)
     ├─ Create user (DB insert)
     ├─ Send email OTP (Nodemailer)
     └─ Send SMS OTP (Twilio)
         ↓
Show OTP Verification Form
     ↓
POST /api/auth/verify-email-otp
     ├─ Fetch user (DB query)
     ├─ Compare OTP hash (bcrypt)
     ├─ Check expiry (date comparison)
     └─ Update verified flag (DB update)
         ↓
POST /api/auth/verify-phone-otp
     ├─ Fetch user (DB query)
     ├─ Compare OTP hash (bcrypt)
     ├─ Check expiry (date comparison)
     └─ Update verified flag (DB update)
         ↓
Show Success & Redirect to Login
     ↓
POST /api/auth/login
     ├─ Fetch user (DB query)
     ├─ Compare password (bcrypt)
     ├─ Check email_verified flag ← NEW
     ├─ Check phone_verified flag ← NEW
     ├─ Generate JWT (jsonwebtoken)
     └─ Return token
         ↓
Frontend Stores JWT & Redirects to Dashboard
         ↓
Access Protected Features
     (All existing features with JWT authentication)
```

---

## 📦 Code Structure

```
INNERVOICE/backend/
│
├── routes/
│   └── auth.js
│       ├── POST /register (MODIFIED)
│       ├── POST /login (MODIFIED)
│       ├── POST /verify-email-otp (NEW)
│       ├── POST /verify-phone-otp (NEW)
│       ├── POST /resend-otp (NEW)
│       └── PUT /streak (UNCHANGED)
│
├── services/
│   └── otp-service.js (NEW)
│       ├── generateOTP()
│       ├── hashOTP()
│       ├── verifyOTP()
│       ├── sendEmailOTP()
│       ├── sendSMSOTP()
│       ├── isOTPExpired()
│       ├── canResendOTP()
│       └── calculateOTPExpiry()
│
├── middleware/
│   └── auth.js (UNCHANGED)
│
├── db.js (UNCHANGED)
├── server.js (UNCHANGED)
│
├── .env (MODIFIED)
│   └── Added email & SMS credentials
│
├── package.json (MODIFIED)
│   ├── nodemailer: ^6.9.7 (NEW)
│   └── twilio: ^4.10.0 (NEW)
│
├── migrate_otp_verification.sql (NEW)
└── run_otp_migration.js (NEW)

Frontend/
│
├── index.html (MODIFIED)
│   ├── #register section
│   │   └── Added phone input
│   └── #otp-verification section (NEW)
│       ├── Email OTP input
│       ├── Phone OTP input
│       ├── Verify button
│       └── Resend button
│
└── script.js (MODIFIED)
    ├── Registration flow (UPDATED)
    │   └── Now includes phone & OTP
    ├── OTP verification flow (NEW)
    │   ├── Verify email OTP
    │   ├── Verify phone OTP
    │   └── Resend with cooldown
    └── Login flow (UPDATED)
        └── Check verification status
```

---

## ✅ Implementation Completeness

```
                 BACKEND          FRONTEND         DATABASE
                   |                 |                 |
Required Field:    |                 |                 |
✓ OTP Generation   |                 |                 |
✓ OTP Hashing      |                 |                 |
✓ OTP Verification |                 |                 |
✓ Email Sending    |                 |                 |
✓ SMS Sending      |                 |                 |
✓ Expiration Check |                 |                 |
✓ Rate Limiting    |                 |                 |
                   |                 |                 |
✓ Registration     |   ✓ Form        |   ✓ Phone field
✓ OTP Endpoints    |   ✓ UI section  |   ✓ Verified flags
✓ Error Handling   |   ✓ Messages    |   ✓ OTP hashes
✓ JWT Check        |   ✓ Resend      |   ✓ Expirations
                   |                 |                 |
COMPLETENESS:    100%              100%              100%
```

---

This architecture documentation provides a complete visual reference for understanding how the OTP verification system works at every level of the application.
