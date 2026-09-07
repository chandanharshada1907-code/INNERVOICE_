const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * OTP Service for Email and Phone verification
 * Handles OTP generation, hashing, and verification
 */

// ====================================
// Configuration from environment
// ====================================

const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "gmail";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "";
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

// Twilio SMS configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_PHONE = process.env.TWILIO_PHONE || "";

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5; // OTP valid for 5 minutes
const RESEND_COOLDOWN_SECONDS = 60; // Can resend after 60 seconds
const MAX_OTP_ATTEMPTS = 5; // Max verification attempts

// ====================================
// Email Transporter Setup
// ====================================

let emailTransporter;

if (EMAIL_USER && EMAIL_PASSWORD) {
    emailTransporter = nodemailer.createTransport({
        service: EMAIL_SERVICE,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD
        }
    });
}

// ====================================
// OTP Generation & Hashing
// ====================================

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using bcrypt
 * @param {string} otp - Plain OTP to hash
 * @returns {Promise<string>} Hashed OTP
 */
async function hashOTP(otp) {
    return await bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against hashed value
 * @param {string} otp - Plain OTP
 * @param {string} hashedOTP - Hashed OTP from database
 * @returns {Promise<boolean>} Whether OTP matches
 */
async function verifyOTP(otp, hashedOTP) {
    return await bcrypt.compare(otp, hashedOTP);
}

// ====================================
// Email OTP Sending
// ====================================

/**
 * Send Email OTP
 * @param {string} email - Recipient email
 * @param {string} otp - OTP to send
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendEmailOTP(email, otp) {
    try {
        if (!emailTransporter) {
            return {
                success: false,
                message: "Email service not configured"
            };
        }

        const mailOptions = {
            from: EMAIL_FROM,
            to: email,
            subject: "INNERVOICE Email Verification",
            html: `
                <html>
                    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7faf8; padding: 20px;">
                        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="font-size: 48px; margin-bottom: 15px;">🌿</div>
                                <h2 style="color: #6c63ff; margin: 0;">INNERVOICE Email Verification</h2>
                            </div>
                            
                            <p style="color: #202124; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                Welcome to INNERVOICE! To complete your registration, please verify your email address using the code below:
                            </p>
                            
                            <div style="background-color: #f5f3ff; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                                <div style="font-size: 32px; font-weight: bold; color: #6c63ff; letter-spacing: 4px;">
                                    ${otp}
                                </div>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 20px 0;">
                                This verification code is valid for 5 minutes.
                            </p>
                            
                            <div style="border-top: 1px solid #f3f4f6; margin-top: 30px; padding-top: 20px;">
                                <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                    If you didn't request this verification code, please ignore this email or contact support.
                                </p>
                                <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">
                                    &copy; 2026 INNERVOICE. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </body>
                </html>
            `
        };

        await emailTransporter.sendMail(mailOptions);

        return {
            success: true,
            message: "Email OTP sent successfully"
        };

    } catch (error) {
        console.error("Error sending email OTP:", error);
        return {
            success: false,
            message: "Failed to send email OTP"
        };
    }
}

// ====================================
// SMS OTP Sending (Twilio)
// ====================================

/**
 * Send SMS OTP via Twilio
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - OTP to send
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendSMSOTP(phoneNumber, otp) {
    try {
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
            return {
                success: false,
                message: "SMS service not configured"
            };
        }

        // Import Twilio (lazy load)
        const twilio = require("twilio");
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const message = await client.messages.create({
            body: `Your INNERVOICE verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.`,
            from: TWILIO_PHONE,
            to: phoneNumber
        });

        return {
            success: true,
            message: "SMS OTP sent successfully",
            messageSid: message.sid
        };

    } catch (error) {
        console.error("Error sending SMS OTP:", error);
        return {
            success: false,
            message: "Failed to send SMS OTP"
        };
    }
}

// ====================================
// OTP Data Management
// ====================================

/**
 * Check if OTP resend is allowed (rate limiting)
 * @param {Date} lastResendTime - Timestamp of last resend
 * @returns {boolean} Whether resend is allowed
 */
function canResendOTP(lastResendTime) {
    if (!lastResendTime) return true;
    
    const secondsElapsed = (Date.now() - lastResendTime.getTime()) / 1000;
    return secondsElapsed >= RESEND_COOLDOWN_SECONDS;
}

/**
 * Check if OTP has expired
 * @param {Date} expiryTime - OTP expiry timestamp
 * @returns {boolean} Whether OTP is expired
 */
function isOTPExpired(expiryTime) {
    if (!expiryTime) return true;
    return Date.now() > expiryTime.getTime();
}

/**
 * Calculate OTP expiry time
 * @returns {Date} Expiry timestamp
 */
function calculateOTPExpiry() {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + OTP_EXPIRY_MINUTES);
    return expiryTime;
}

// ====================================
// Exports
// ====================================

module.exports = {
    generateOTP,
    hashOTP,
    verifyOTP,
    sendEmailOTP,
    sendSMSOTP,
    canResendOTP,
    isOTPExpired,
    calculateOTPExpiry,
    OTP_LENGTH,
    OTP_EXPIRY_MINUTES,
    RESEND_COOLDOWN_SECONDS,
    MAX_OTP_ATTEMPTS
};
