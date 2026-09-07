const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const otpService = require("../services/otp-service");

const router = express.Router();


// ======================================
// POST /api/auth/register
// Register new user and initiate OTP verification
// Body: { name, email, phone_number, password }
// ======================================

router.post("/register", async (req, res) => {

    const { name, email: rawEmail, phone_number: rawPhoneNumber, password } = req.body;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : rawEmail;
    const phone_number = typeof rawPhoneNumber === "string"
        ? rawPhoneNumber.replace(/\D/g, "")
        : (rawPhoneNumber || "");

    // Validate required fields (phone_number is optional)
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email, and password are required"
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        });
    }

    // Determine if OTP services are available
    const otpServicesAvailable = !!(
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD &&
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN
    );

    try {

        // Check if email already exists
        db.query(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, results) => {

                if (err) {
                    console.error("Error checking email:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "Email already registered"
                    });
                }

                try {
                    const passwordHash = await bcrypt.hash(password, 10);

                    // If OTP services are not available, auto-verify the account
                    if (!otpServicesAvailable || !phone_number) {
                        // Register without OTP — auto-verify immediately
                        const sqlNoOTP = `
                            INSERT INTO users (name, email, phone_number, password, email_verified, phone_verified)
                            VALUES (?, ?, ?, ?, TRUE, TRUE)
                        `;
                        const phoneVal = phone_number || null;
                        db.query(sqlNoOTP, [name, email, phoneVal, passwordHash], (err, result) => {
                            if (err) {
                                console.error("Error creating user:", err);
                                return res.status(500).json({
                                    success: false,
                                    message: "Registration failed: " + (err.sqlMessage || err.message)
                                });
                            }
                            return res.status(201).json({
                                success: true,
                                message: "Registration successful! You can now log in.",
                                user_id: result.insertId,
                                email_sent: false,
                                sms_sent: false,
                                auto_verified: true
                            });
                        });
                        return;
                    }

                    // OTP services are available — check phone uniqueness and send OTPs
                    db.query(
                        "SELECT id FROM users WHERE phone_number = ?",
                        [phone_number],
                        async (err, phoneResults) => {

                            if (err) {
                                console.error("Error checking phone:", err);
                                return res.status(500).json({
                                    success: false,
                                    message: "Database error"
                                });
                            }

                            if (phoneResults.length > 0) {
                                return res.status(409).json({
                                    success: false,
                                    message: "Phone number already registered"
                                });
                            }

                            try {
                                const emailOTP  = otpService.generateOTP();
                                const phoneOTP  = otpService.generateOTP();
                                const emailOTPHash = await otpService.hashOTP(emailOTP);
                                const phoneOTPHash = await otpService.hashOTP(phoneOTP);
                                const otpExpiry = otpService.calculateOTPExpiry();

                                const sql = `
                                    INSERT INTO users (name, email, phone_number, password, 
                                        email_otp_hash, email_otp_expires_at, email_otp_attempts, email_otp_sent_at,
                                        phone_otp_hash, phone_otp_expires_at, phone_otp_attempts, phone_otp_sent_at,
                                        email_verified, phone_verified)
                                    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, FALSE, FALSE)
                                `;

                                db.query(
                                    sql,
                                    [name, email, phone_number, passwordHash,
                                     emailOTPHash, otpExpiry, new Date(), phoneOTPHash, otpExpiry, new Date()],
                                    async (err, result) => {
                                        if (err) {
                                            console.error("Error creating user:", err);
                                            return res.status(500).json({
                                                success: false,
                                                message: "Registration failed"
                                            });
                                        }

                                        const userId = result.insertId;
                                        const emailResult = await otpService.sendEmailOTP(email, emailOTP);
                                        const smsResult   = await otpService.sendSMSOTP(phone_number, phoneOTP);
                                        const verificationUnavailable = !emailResult.success || !smsResult.success;

                                        const response = {
                                            success: true,
                                            message: verificationUnavailable
                                                ? "Registration created, but OTP delivery failed. Please request a new code."
                                                : "Registration successful! Please verify your email and phone.",
                                            user_id: userId,
                                            email_sent: emailResult.success,
                                            sms_sent: smsResult.success,
                                            auto_verified: false
                                        };

                                        if (verificationUnavailable) {
                                            response.warning = "OTP delivery failed. Contact support or request a new code.";
                                        }

                                        res.status(201).json(response);
                                    }
                                );
                            } catch (error) {
                                console.error("Error in OTP registration process:", error);
                                res.status(500).json({ success: false, message: "Server error during registration" });
                            }
                        }
                    );

                } catch (error) {
                    console.error("Error hashing password:", error);
                    res.status(500).json({ success: false, message: "Server error during registration" });
                }
            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ======================================
// POST /api/auth/login
// Login and verify email + phone OTP completion
// Body: { email, password }
// ======================================

router.post("/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    try {

        db.query(
            "SELECT * FROM users WHERE email = ?",
            [email],
            async (err, results) => {

                if (err) {
                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                // No user found with that email
                if (results.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid email or password"
                    });
                }

                const user = results[0];

                if ((user.email_otp_attempts || 0) >= otpService.MAX_OTP_ATTEMPTS) {
                    return res.status(429).json({ success: false, message: "Too many email OTP attempts. Please request a new code." });
                }

                // Compare entered password with hashed password in DB
                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid email or password"
                    });
                }

                // ─────────────────────────────────────────────────────────
                // Check if email and phone are verified.
                // If OTP services are not configured (no EMAIL_USER /
                // TWILIO credentials), we auto-approve unverified accounts
                // so development / local testing works without real OTPs.
                // ─────────────────────────────────────────────────────────
                const otpServicesConfigured = !!(
                    process.env.EMAIL_USER &&
                    process.env.EMAIL_PASSWORD &&
                    process.env.TWILIO_ACCOUNT_SID &&
                    process.env.TWILIO_AUTH_TOKEN &&
                    process.env.EMAIL_USER !== "your_email@gmail.com"
                );

                if (otpServicesConfigured && (!user.email_verified || !user.phone_verified)) {
                    return res.status(403).json({
                        success: false,
                        message: "Account not verified. Please complete email and phone verification.",
                        email_verified: user.email_verified || false,
                        phone_verified: user.phone_verified || false,
                        user_id: user.id
                    });
                }

                // Auto-approve if OTP services are not configured (dev mode)
                if (!otpServicesConfigured && (!user.email_verified || !user.phone_verified)) {
                    console.log(`[AUTH] Dev mode: auto-approving unverified user ${user.email}`);
                    // Mark as verified in DB for future logins
                    db.query(
                        "UPDATE users SET email_verified = TRUE, phone_verified = TRUE WHERE id = ?",
                        [user.id],
                        () => {} // fire and forget
                    );
                }

                const uid = user.user_id || user.id;

                // Sign JWT token — secret stored in .env only
                const token = jwt.sign(
                    {
                        id:      uid,
                        user_id: uid,
                        name:    user.name,
                        email:   user.email,
                        role:    user.role || 'user'  // include role for admin middleware
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "7d" }
                );

                // Return token and safe user info (no password!)
                res.status(200).json({
                    success: true,
                    message: "Login successful!",
                    token: token,
                    user: {
                        id:       uid,
                        user_id:  uid,
                        name:     user.name,
                        email:    user.email,
                        streak:   user.streak || 0,
                        role:     user.role || 'user'   // expose to frontend for nav visibility
                    }
                });


            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ======================================
// POST /api/auth/verify-email-otp
// Verify email OTP
// Body: { user_id, email_otp }
// ======================================

router.post("/verify-email-otp", async (req, res) => {

    const { user_id, email_otp } = req.body;

    if (!user_id || !email_otp) {
        return res.status(400).json({
            success: false,
            message: "user_id and email_otp are required"
        });
    }

    try {

        db.query(
            "SELECT * FROM users WHERE id = ?",
            [user_id],
            async (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                const user = results[0];

                // Check if email is already verified
                if (user.email_verified) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already verified"
                    });
                }

                // Check if OTP is expired
                if (!user.email_otp_expires_at || otpService.isOTPExpired(user.email_otp_expires_at)) {
                    return res.status(400).json({
                        success: false,
                        message: "Email OTP expired. Please request a new one."
                    });
                }

                // Verify OTP
                if (!user.email_otp_hash) {
                    return res.status(400).json({
                        success: false,
                        message: "No OTP found for this user"
                    });
                }

                const isOTPValid = await otpService.verifyOTP(email_otp, user.email_otp_hash);

                if (!isOTPValid) {
                    db.query("UPDATE users SET email_otp_attempts = email_otp_attempts + 1 WHERE id = ?", [user_id]);
                    return res.status(400).json({
                        success: false,
                        message: "Invalid email OTP"
                    });
                }

                // Clear OTP and mark email as verified
                db.query(
                    `UPDATE users SET email_verified = TRUE, email_otp_hash = NULL, email_otp_expires_at = NULL, email_otp_attempts = 0, email_otp_sent_at = NULL WHERE id = ?`,
                    [user_id],
                    (err) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                success: false,
                                message: "Failed to verify email"
                            });
                        }

                        res.status(200).json({
                            success: true,
                            message: "Email verified successfully!"
                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ======================================
// POST /api/auth/verify-phone-otp
// Verify phone OTP
// Body: { user_id, phone_otp }
// ======================================

router.post("/verify-phone-otp", async (req, res) => {

    const { user_id, phone_otp } = req.body;

    if (!user_id || !phone_otp) {
        return res.status(400).json({
            success: false,
            message: "user_id and phone_otp are required"
        });
    }

    try {

        db.query(
            "SELECT * FROM users WHERE id = ?",
            [user_id],
            async (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                const user = results[0];

                if ((user.phone_otp_attempts || 0) >= otpService.MAX_OTP_ATTEMPTS) {
                    return res.status(429).json({ success: false, message: "Too many phone OTP attempts. Please request a new code." });
                }

                // Check if phone is already verified
                if (user.phone_verified) {
                    return res.status(400).json({
                        success: false,
                        message: "Phone already verified"
                    });
                }

                // Check if OTP is expired
                if (!user.phone_otp_expires_at || otpService.isOTPExpired(user.phone_otp_expires_at)) {
                    return res.status(400).json({
                        success: false,
                        message: "Phone OTP expired. Please request a new one."
                    });
                }

                // Verify OTP
                if (!user.phone_otp_hash) {
                    return res.status(400).json({
                        success: false,
                        message: "No OTP found for this user"
                    });
                }

                const isOTPValid = await otpService.verifyOTP(phone_otp, user.phone_otp_hash);

                if (!isOTPValid) {
                    db.query("UPDATE users SET phone_otp_attempts = phone_otp_attempts + 1 WHERE id = ?", [user_id]);
                    return res.status(400).json({
                        success: false,
                        message: "Invalid phone OTP"
                    });
                }

                // Clear OTP and mark phone as verified
                db.query(
                    `UPDATE users SET phone_verified = TRUE, phone_otp_hash = NULL, phone_otp_expires_at = NULL, phone_otp_attempts = 0, phone_otp_sent_at = NULL WHERE id = ?`,
                    [user_id],
                    (err) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                success: false,
                                message: "Failed to verify phone"
                            });
                        }

                        res.status(200).json({
                            success: true,
                            message: "Phone verified successfully!"
                        });

                    }
                );

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});


// ======================================
// POST /api/auth/resend-otp
// Resend OTP (both email and phone, or specific type)
// Body: { user_id, type: "email" | "phone" | "both" }
// ======================================

router.post("/resend-otp", async (req, res) => {

    const { user_id, type } = req.body;

    if (!user_id) {
        return res.status(400).json({
            success: false,
            message: "user_id is required"
        });
    }

    const otpType = type || "both";

    if (!["email", "phone", "both"].includes(otpType)) {
        return res.status(400).json({
            success: false,
            message: "type must be 'email', 'phone', or 'both'"
        });
    }

    try {

        db.query(
            "SELECT * FROM users WHERE id = ?",
            [user_id],
            async (err, results) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                const user = results[0];

                const resendAt = otpType === "email" ? user.email_otp_sent_at : user.phone_otp_sent_at;
                if (otpType === "both" && user.email_otp_sent_at && user.phone_otp_sent_at) {
                    if (!otpService.canResendOTP(new Date(Math.max(new Date(user.email_otp_sent_at).getTime(), new Date(user.phone_otp_sent_at).getTime())))) {
                        return res.status(429).json({ success: false, message: "Please wait before requesting another OTP." });
                    }
                } else if (resendAt && !otpService.canResendOTP(new Date(resendAt))) {
                    return res.status(429).json({ success: false, message: "Please wait before requesting another OTP." });
                }

                try {

                    let emailResult = { success: true, message: "" };
                    let smsResult = { success: true, message: "" };

                    // Generate new OTPs
                    const newEmailOTP = otpService.generateOTP();
                    const newPhoneOTP = otpService.generateOTP();
                    const newEmailOTPHash = await otpService.hashOTP(newEmailOTP);
                    const newPhoneOTPHash = await otpService.hashOTP(newPhoneOTP);
                    const newOTPExpiry = otpService.calculateOTPExpiry();

                    // Update database
                    let updateQuery = "UPDATE users SET ";
                    let updateValues = [];

                    if (otpType === "email" || otpType === "both") {
                        updateQuery += "email_otp_hash = ?, email_otp_expires_at = ?, email_otp_attempts = 0, email_otp_sent_at = ?";
                        updateValues.push(newEmailOTPHash, newOTPExpiry, new Date());
                    }

                    if (otpType === "phone" || otpType === "both") {
                        if (updateValues.length > 0) updateQuery += ", ";
                        updateQuery += "phone_otp_hash = ?, phone_otp_expires_at = ?, phone_otp_attempts = 0, phone_otp_sent_at = ?";
                        updateValues.push(newPhoneOTPHash, newOTPExpiry, new Date());
                    }

                    updateQuery += " WHERE id = ?";
                    updateValues.push(user_id);

                    db.query(updateQuery, updateValues, async (err) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                success: false,
                                message: "Failed to resend OTP"
                            });
                        }

                        // Send OTPs
                        if (otpType === "email" || otpType === "both") {
                            emailResult = await otpService.sendEmailOTP(user.email, newEmailOTP);
                        }

                        if (otpType === "phone" || otpType === "both") {
                            smsResult = await otpService.sendSMSOTP(user.phone_number, newPhoneOTP);
                        }

                        res.status(200).json({
                            success: emailResult.success || smsResult.success,
                            message: "OTP resent successfully!",
                            email_sent: emailResult.success,
                            sms_sent: smsResult.success
                        });

                    });

                } catch (error) {
                    console.error("Error in resend process:", error);
                    res.status(500).json({
                        success: false,
                        message: "Server error during resend"
                    });
                }

            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});



// ======================================
// PUT /api/auth/streak
// Update the logged-in user's streak
// in MySQL. JWT protected.
// Body: { streak }
// ======================================

const verifyToken = require("../middleware/auth");

router.put("/streak", verifyToken, (req, res) => {

    const userId = req.user.id;
    const { streak } = req.body;

    if (streak === undefined || isNaN(parseInt(streak, 10))) {
        return res.status(400).json({
            success: false,
            message: "streak (number) is required"
        });
    }

    const sql = "UPDATE users SET streak = ? WHERE id = ?";

    db.query(sql, [parseInt(streak, 10), userId], (err, result) => {

        if (err) {
            console.error("Error updating streak:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to update streak"
            });
        }

        res.status(200).json({
            success: true,
            message: "Streak updated",
            streak:  parseInt(streak, 10)
        });

    });

});


module.exports = router;