const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();


// ======================================
// POST /api/auth/register
// ======================================

router.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
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

                if (results.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: "Email already registered"
                    });
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                const sql = `
                    INSERT INTO users (name, email, password)
                    VALUES (?, ?, ?)
                `;

                db.query(
                    sql,
                    [name, email, hashedPassword],
                    (err, result) => {

                        if (err) {
                            console.error(err);

                            return res.status(500).json({
                                success: false,
                                message: "Registration failed"
                            });
                        }

                        res.status(201).json({
                            success: true,
                            message: "Registration successful!",
                            user_id: result.insertId
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
// POST /api/auth/login
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

                // Compare entered password with hashed password in DB
                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid email or password"
                    });
                }

                const uid = user.user_id || user.id;

                // Sign JWT token — secret stored in .env only
                const token = jwt.sign(
                    {
                        id: uid,
                        user_id: uid,
                        name: user.name,
                        email: user.email
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
                        id: uid,
                        user_id: uid,
                        name: user.name,
                        email: user.email,
                        streak: user.streak || 0
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