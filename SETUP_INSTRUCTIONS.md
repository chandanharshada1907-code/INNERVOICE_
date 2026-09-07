# INNERVOICE OTP Verification - Setup Instructions

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Backend Setup](#backend-setup)
3. [Environment Configuration](#environment-configuration)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 🗄️ Database Setup

### Step 1: Run Migration (Automated)

```bash
cd INNERVOICE/backend
node run_otp_migration.js
```

**Expected Output:**
```
✅ MySQL connected successfully!
✓ [1]: Check database connection
✓ [2]: Add phone_number column
✓ [3]: Add email_verified column
✓ [4]: Add phone_verified column
✓ [5]: Add email_otp_hash column
✓ [6]: Add email_otp_expires_at column
✓ [7]: Add phone_otp_hash column
✓ [8]: Add phone_otp_expires_at column
✅ OTP verification migration complete!
```

**Verification**: All 8 columns should be added to users table

### Step 2: Manual Verification

```bash
# Connect to MySQL
mysql -u root -p

# Run commands
USE innervoice;
DESCRIBE users;

# Should show columns at bottom:
# - phone_number (VARCHAR 20)
# - email_verified (TINYINT 1)
# - phone_verified (TINYINT 1)
# - email_otp_hash (VARCHAR 255)
# - email_otp_expires_at (DATETIME)
# - phone_otp_hash (VARCHAR 255)
# - phone_otp_expires_at (DATETIME)
```

---

## 🔧 Backend Setup

### Step 1: Install Dependencies

```bash
cd INNERVOICE/backend
npm install nodemailer@^6.9.7 twilio@^4.10.0
```

**Verification**: Should complete without errors

### Step 2: Verify Installation

```bash
npm list nodemailer twilio
```

**Expected Output:**
```
backend@1.0.0 /path/to/backend
├── nodemailer@6.9.7
└── twilio@4.10.0
```

---

## ⚙️ Environment Configuration

### Step 1: Open .env File

```bash
cd INNERVOICE/backend
nano .env  # or use VS Code
```

### Step 2: Add Email Configuration

```env
# ========== EMAIL OTP CONFIGURATION ==========

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

#### For Gmail Users:
1. Go to myaccount.google.com
2. Enable 2-Factor Authentication
3. Generate App Password for Gmail
4. Use the 16-character password in EMAIL_PASSWORD
5. **Important**: Use app-specific password, NOT your Google account password

#### For Other Email Providers:
```env
# Example for Outlook
EMAIL_SERVICE=outlook

# Example for custom SMTP
EMAIL_SERVICE=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=true
```

### Step 3: Add SMS Configuration

```env
# ========== SMS OTP CONFIGURATION (TWILIO) ==========

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE=+1234567890
```

#### For Twilio Users:
1. Sign up at twilio.com
2. Get Account SID and Auth Token from dashboard
3. Verify/add phone number to send SMS
4. Add verified phone number with country code (e.g., +1 for US)
5. Ensure account has SMS credits

### Step 4: Verify .env File

```bash
cat .env

# Should show:
# - EMAIL_SERVICE
# - EMAIL_USER
# - EMAIL_PASSWORD
# - EMAIL_FROM
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN
# - TWILIO_PHONE
```

### Step 5: Test Credentials (Optional)

```bash
# Create test-credentials.js
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
transporter.verify((err, success) => {
  if (err) console.log('Email Error:', err);
  else console.log('Email OK');
});
"
```

---

## 🚀 Running the Application

### Step 1: Start Backend Server

```bash
cd INNERVOICE/backend

# Production mode
npm start

# Development mode (auto-reload on file changes)
npm run dev
```

**Expected Output:**
```
🌿 INNERVOICE Backend Server
✅ MySQL connected successfully!
Server running on port 5000
```

### Step 2: Verify Server is Running

Open browser:
```
http://localhost:5000
```

Should see INNERVOICE homepage with registration/login options

### Step 3: Check Console

**Backend Console** should show:
```
✅ MySQL connected successfully!
Server running on port 5000
```

**Browser Console** should show:
```
🌿 INNERVOICE JavaScript Loaded
```

---

## 🧪 Testing

### Test 1: Complete Registration Flow

**Steps:**
1. Navigate to http://localhost:5000
2. Click "Create Account"
3. Fill in:
   - Name: `Test User`
   - Email: `test@youremail.com` (your actual email)
   - Phone: `1234567890` (at least 10 digits)
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`
4. Click "Sign Up"

**Expected Results:**
- ✅ Form submitted
- ✅ Notification: "Account created! Verification codes sent."
- ✅ OTP verification form appears
- ✅ Email received in inbox with 6-digit code
- ✅ SMS received on phone with 6-digit code

### Test 2: Email OTP Verification

**Steps:**
1. Check email inbox
2. Copy 6-digit code
3. Paste in "Email Verification Code" field
4. Leave Phone code blank (for now)

**Expected Results:**
- ✅ Code accepted if correct
- ✅ Error message if wrong: "Invalid email OTP"
- ✅ Error message if expired (after 5 min): "OTP expired"

### Test 3: Phone OTP Verification

**Steps:**
1. Check phone for SMS
2. Copy 6-digit code
3. Paste in "Phone Verification Code" field
4. Enter email code again
5. Click "Verify Both OTPs"

**Expected Results:**
- ✅ Both OTPs verified successfully
- ✅ Notification: "Account verified successfully!"
- ✅ Redirected to login page

### Test 4: Login with Verified Account

**Steps:**
1. On login page, enter:
   - Email: `test@youremail.com`
   - Password: `TestPass123`
2. Click "Log In"

**Expected Results:**
- ✅ Login successful
- ✅ Notification: "Welcome back, Test User!"
- ✅ Redirected to dashboard
- ✅ All features accessible (mood, journal, chatbot, etc.)

### Test 5: Resend OTP Functionality

**Steps:**
1. Register new user (email2@test.com)
2. Before verifying, click "Resend OTP"

**Expected Results:**
- ✅ Notification: "Verification codes resent!"
- ✅ Cooldown timer shows: "You can resend in 60 seconds"
- ✅ After 60 seconds, can resend again
- ✅ New OTP codes received in email/SMS

### Test 6: Duplicate Email Prevention

**Steps:**
1. Register user1: `duplicate@test.com`
2. Complete verification and login
3. Logout
4. Try registering again with same email

**Expected Results:**
- ✅ Error: "Email already registered"
- ✅ Form not submitted

### Test 7: Duplicate Phone Prevention

**Steps:**
1. Register user2: phone `1234567890`
2. Complete verification
3. Try registering new user with same phone

**Expected Results:**
- ✅ Error: "Phone number already registered"
- ✅ Form not submitted

### Test 8: Verify Existing Functionality

After login, test all features:

**Mood Tracker:**
```
1. Click "Mood Tracker"
2. Select mood emoji
3. Add mood entry
4. Verify it appears in history
```

**Journal:**
```
1. Click "Journal"
2. Write entry
3. Save
4. Verify in history
```

**Chatbot:**
```
1. Click "Chat with AI"
2. Send message
3. Verify AI responds
```

**Dashboard:**
```
1. Check streak counter
2. Check mood analytics
3. Check recommendations
4. Check notifications
```

---

## 🐛 Troubleshooting

### Issue: Database Migration Fails

**Error:**
```
Error: ER_BAD_FIELD_ERROR: Unknown column 'X' in 'users'
```

**Solution:**
```bash
# Verify database is running
mysql -u root -p -e "USE innervoice; SELECT 1;"

# Check current schema
mysql -u root -p -e "USE innervoice; DESCRIBE users;"

# Run migration again
node run_otp_migration.js
```

### Issue: Email OTP Not Sending

**Error:**
```
Error: Invalid login: invalid username
```

**Solutions:**
1. Verify EMAIL_USER is correct in .env
2. For Gmail: Use app-specific password (not account password)
3. Check if email account has 2FA enabled
4. Try disabling "Less secure app access" settings
5. Test credentials directly:

```bash
npm install nodemailer
node -e "
const nm = require('nodemailer');
const t = nm.createTransport({
  service: 'gmail',
  auth: { user: 'YOUR_EMAIL', pass: 'YOUR_PASSWORD' }
});
t.verify((e,s) => console.log(e ? 'FAIL: '+e.message : 'OK'));
"
```

### Issue: SMS OTP Not Sending

**Error:**
```
Error: Twilio API returned HTTP 401: Unauthorized
```

**Solutions:**
1. Verify TWILIO_ACCOUNT_SID is correct
2. Verify TWILIO_AUTH_TOKEN is correct
3. Verify TWILIO_PHONE includes country code (e.g., +1)
4. Test at twilio.com dashboard
5. Check account has SMS credits

### Issue: OTP Verification Always Fails

**Error:**
```
Invalid email OTP
```

**Solutions:**
1. Check OTP hasn't expired (5 minute limit)
2. Verify OTP is exactly 6 digits
3. Check database has otp_hash values:

```sql
SELECT email_otp_hash, email_otp_expires_at 
FROM users WHERE email='test@test.com';
```

4. Check server logs for hash verification errors

### Issue: Can't Login After Verification

**Error:**
```
Account not verified. Please complete email and phone verification.
```

**Solutions:**
1. Check both columns are TRUE:

```sql
SELECT email_verified, phone_verified 
FROM users WHERE email='test@test.com';
```

2. If FALSE, manually set:

```sql
UPDATE users 
SET email_verified=TRUE, phone_verified=TRUE 
WHERE email='test@test.com';
```

3. Try logging in again

### Issue: Backend Not Starting

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
1. Verify MySQL is running:

```bash
# Windows
net start MySQL80

# Mac/Linux
sudo service mysql start
```

2. Check connection string in .env:

```env
DB_HOST=localhost  # or 127.0.0.1
DB_USER=root
DB_PASSWORD=YourPassword
```

3. Verify database exists:

```bash
mysql -u root -p -e "SHOW DATABASES LIKE 'innervoice';"
```

### Issue: Frontend Shows Blank Page

**Error:** White screen, no content

**Solutions:**
1. Check browser console for errors (F12)
2. Verify backend is running (check terminal)
3. Verify frontend file exists: index.html
4. Try clearing browser cache (Ctrl+Shift+Delete)
5. Try different browser

---

## ✅ Final Verification Checklist

After setup, verify:

- [ ] MySQL running and database exists
- [ ] `node run_otp_migration.js` completed successfully
- [ ] npm packages installed (nodemailer, twilio)
- [ ] .env file has all required fields
- [ ] Email credentials tested and working
- [ ] Twilio credentials tested and working
- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5000
- [ ] Registration form shows phone field
- [ ] OTP verification section appears after registration
- [ ] Email OTP received in inbox
- [ ] Phone OTP received as SMS
- [ ] Login works after OTP verification
- [ ] Dashboard and all features accessible
- [ ] No console errors in browser

---

## 🎯 Next: Run Tests

Once everything is set up, see [OTP_QUICK_REFERENCE.md](OTP_QUICK_REFERENCE.md) for quick test scenarios.

---

## 📞 Getting Help

**Check logs:**
```bash
# Backend logs (terminal where npm start is running)
tail -f INNERVOICE/backend/logs/*.log

# Browser logs (F12 → Console)
# Redux/App errors appear here
```

**Test API directly:**
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test",
    "email":"test@test.com",
    "phone_number":"1234567890",
    "password":"Pass123"
  }'
```

**Check database:**
```bash
mysql -u root -p innervoice
DESCRIBE users;
SELECT * FROM users LIMIT 1;
```

---

**Setup Complete!** 🎉

You're ready to test the OTP verification system.
