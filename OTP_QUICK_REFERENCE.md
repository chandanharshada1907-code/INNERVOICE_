# INNERVOICE OTP - Quick Reference Guide

## 🚀 Quick Start

### 1. Install & Setup (One-time)
```bash
# Navigate to backend
cd INNERVOICE/backend

# Install dependencies
npm install

# Run database migration
node run_otp_migration.js

# Verify output: "✅ OTP verification migration complete!"
```

### 2. Configure Environment (.env)

```env
# Required for Email OTP
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Required for SMS OTP
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE=+1234567890
```

### 3. Start Server
```bash
npm start  # Production mode
npm run dev  # Development mode with auto-reload
```

---

## 🧪 Quick Test Scenarios

### Scenario 1: Full Registration & Verification (5 min)
```
1. Go to http://localhost:5000
2. Click "Create Account" or "#register"
3. Enter:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
   - Password: TestPass123
   - Confirm: TestPass123
4. Click "Sign Up"
5. Get OTP from:
   - Email inbox for email OTP
   - SMS on phone for phone OTP
6. Paste both OTPs
7. Click "Verify Both OTPs"
8. See: "Account verified successfully!"
9. Login with credentials
```

### Scenario 2: Wrong OTP (1 min)
```
1. Register
2. Enter wrong OTP (e.g., 000000)
3. Click "Verify"
4. See: "❌ Invalid email OTP"
5. Resend and enter correct OTP
```

### Scenario 3: OTP Expiration (5 min)
```
1. Register
2. Wait 5 minutes
3. Try to verify with correct OTP
4. See: "❌ Email OTP expired"
5. Click "Resend OTP"
6. Use new OTP
```

### Scenario 4: Resend Cooldown (2 min)
```
1. Register
2. Click "Resend OTP"
3. See: "✓ Verification codes resent!"
4. Try immediately: "Please wait 60 seconds..."
5. After 60 seconds: Can resend again
```

### Scenario 5: Duplicate Email (1 min)
```
1. Register with user1@test.com (complete verification)
2. Try register again with user1@test.com
3. See: "❌ Email already registered"
```

---

## 📋 New Registration Form Fields

| Field | Validation | Format |
|-------|-----------|--------|
| Name | Required | Text, any length |
| Email | Required, unique | Valid email |
| Phone | Required, unique, ≥10 digits | Digits only |
| Password | Required, ≥6 chars | Any characters |
| Confirm | Must match password | Any characters |

---

## 🔐 User States

### State 1: Unverified
```javascript
{
  email_verified: false,
  phone_verified: false,
  email_otp_hash: "bcrypt-hash",
  phone_otp_hash: "bcrypt-hash"
}
// Can't login
```

### State 2: Email Verified Only
```javascript
{
  email_verified: true,
  phone_verified: false,
  email_otp_hash: null,
  phone_otp_hash: "bcrypt-hash"
}
// Can't login yet
```

### State 3: Both Verified
```javascript
{
  email_verified: true,
  phone_verified: true,
  email_otp_hash: null,
  phone_otp_hash: null
}
// Can login, gets JWT
```

---

## 🔑 API Quick Reference

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "john@test.com",
    "phone_number": "1234567890",
    "password": "pass123"
  }'
```

### Verify Email OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "email_otp": "123456"
  }'
```

### Verify Phone OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-phone-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "phone_otp": "654321"
  }'
```

### Resend OTP
```bash
curl -X POST http://localhost:5000/api/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "type": "both"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "pass123"
  }'
```

---

## 🐛 Debugging

### Check Database
```sql
-- Show users table with OTP fields
SELECT id, email, phone_number, email_verified, phone_verified 
FROM users;

-- Show specific user
SELECT * FROM users WHERE email='test@example.com';
```

### Check Backend Logs
```
1. Look for "🌿 INNERVOICE JavaScript Loaded" in console
2. Check for "Backend not reachable" warnings
3. Check Node.js terminal for errors
```

### Check Email Configuration
1. Test SMTP: Use online SMTP tester
2. Check email password: Use app-specific password, not account password
3. Enable "Less secure app access" if needed

### Check Twilio Configuration
1. Verify account SID and token
2. Verify phone number includes country code
3. Check SMS credits available
4. Test in Twilio dashboard

---

## ⚠️ Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Email OTP not sending" | Invalid credentials | Update .env with correct email/password |
| "SMS OTP not sending" | Twilio not configured | Add Twilio credentials to .env |
| "OTP expired" | Waited >5 minutes | Click "Resend OTP" for new codes |
| "Please wait 60 seconds" | Resend cooldown active | Wait 1 minute before resending |
| "Account not verified" | Email/phone not verified | Complete OTP verification |
| "Invalid email or password" | Wrong credentials | Check email and password |
| "Email already registered" | Duplicate email | Use different email |
| "Phone already registered" | Duplicate phone | Use different phone |

---

## 📊 Database Migration Verification

After running `node run_otp_migration.js`, verify:

```sql
-- Check columns exist
DESCRIBE users;

-- Should show these 7 new columns:
-- phone_number, email_verified, phone_verified,
-- email_otp_hash, email_otp_expires_at,
-- phone_otp_hash, phone_otp_expires_at
```

---

## 🔄 Development Workflow

```
1. Make code changes
2. npm run dev (auto-restart on changes)
3. Test in browser (http://localhost:5000)
4. Check browser console for errors
5. Check Node.js terminal for backend errors
6. Repeat
```

---

## 📱 Email OTP Template

User receives email with subject:
```
INNERVOICE Email Verification
```

Content includes:
```
Welcome to INNERVOICE!

Your verification code is: 123456

This verification code is valid for 5 minutes.

If you didn't request this, please ignore this email.
```

---

## 📞 SMS OTP Template

User receives SMS:
```
Your INNERVOICE verification code is: 123456

This code is valid for 5 minutes. 
Do not share this code with anyone.
```

---

## ✅ Testing Checklist

- [ ] Registration form loads
- [ ] Email validation works
- [ ] Phone validation works  (≥10 digits)
- [ ] Password validation works (≥6 chars)
- [ ] Email OTP received in inbox
- [ ] Phone OTP received as SMS
- [ ] Correct OTP verifies successfully
- [ ] Wrong OTP shows error
- [ ] Expired OTP shows error
- [ ] Resend OTP works
- [ ] 60-second cooldown enforced
- [ ] Duplicate email rejected
- [ ] Duplicate phone rejected
- [ ] Can login after verification
- [ ] Can't login before verification
- [ ] All existing features still work
- [ ] Dashboard accessible after login
- [ ] JWT token stored in localStorage
- [ ] Mood tracker works
- [ ] Journal works
- [ ] Chatbot works
- [ ] Goals/challenges work

---

**Total Time to Complete Setup**: ~10 minutes  
**Time to Test All Features**: ~15 minutes  
**Estimated Full Testing**: ~30 minutes
