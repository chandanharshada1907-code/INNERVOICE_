const express = require('express');
const router = express.Router();
const _db = require('../db');
const db = _db.promise(); // Use promise-based API (db.js exports a callback pool)
const verifyToken = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// GET /api/reports/wellness/pdf
router.get('/pdf', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Fetch user basic info
        const [users] = await db.execute('SELECT name FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userName = users[0].name;

        // 2. Fetch Wellness Overview
        const [scores] = await db.execute('SELECT score FROM wellness_scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
        const currentScore = scores.length > 0 ? scores[0].score : 'N/A';
        const [userStreak] = await db.execute('SELECT streak FROM users WHERE id = ?', [userId]);
        const streak = userStreak.length > 0 ? userStreak[0].streak : 0;

        // 3. Fetch Mood Summary
        const [moods] = await db.execute('SELECT mood, note, mood_date FROM moods WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId]);
        
        // 4. Fetch Journal Summary
        const [journals] = await db.execute('SELECT count(*) as count FROM journals WHERE user_id = ?', [userId]);
        const journalCount = journals[0].count;
        const [latestJournals] = await db.execute('SELECT title, journal_date FROM journals WHERE user_id = ? ORDER BY created_at DESC LIMIT 3', [userId]);

        // 5. Fetch Goals
        const [goals] = await db.execute('SELECT title, completed, current_progress, target_value FROM goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId]);

        // 6. Fetch Sleep Summary
        const [sleeps] = await db.execute('SELECT sleep_date, sleep_duration, sleep_quality FROM sleep_records WHERE user_id = ? ORDER BY sleep_date DESC LIMIT 5', [userId]);
        const [sleepAvg] = await db.execute('SELECT AVG(sleep_duration) as avg_duration FROM sleep_records WHERE user_id = ?', [userId]);

        // 7. Fetch Mental Wellness Assessments
        const [phq9] = await db.execute('SELECT total_score, severity, created_at FROM mental_wellness_assessments WHERE user_id = ? AND assessment_type = "phq9" ORDER BY created_at DESC LIMIT 1', [userId]);
        const [gad7] = await db.execute('SELECT total_score, severity, created_at FROM mental_wellness_assessments WHERE user_id = ? AND assessment_type = "gad7" ORDER BY created_at DESC LIMIT 1', [userId]);

        // 8. Fetch Achievements and Habits
        const [habits] = await db.execute('SELECT name, active FROM habits WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId]);
        const [achievements] = await db.execute('SELECT a.name, a.description FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = ? ORDER BY ua.unlocked_at DESC LIMIT 5', [userId]);

        // ==========================================
        // CREATE PDF DOCUMENT
        // ==========================================
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="INNERVOICE_Wellness_Report.pdf"');
        
        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('INNERVOICE WELLNESS REPORT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`User Name: ${userName}`);
        doc.text(`Report Generation Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown(2);

        // Section Helper
        const addSection = (title) => {
            doc.fontSize(14).font('Helvetica-Bold').text(title);
            doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).stroke();
            doc.moveDown();
            doc.fontSize(11).font('Helvetica');
        };

        // 1. WELLNESS OVERVIEW
        addSection('1. WELLNESS OVERVIEW');
        doc.text(`Wellness Score: ${currentScore}`);
        doc.text(`Current Streak: ${streak} days`);
        doc.moveDown();

        // 2. MOOD SUMMARY
        addSection('2. MOOD SUMMARY');
        if (moods.length > 0) {
            moods.forEach(m => {
                doc.text(`- ${new Date(m.mood_date).toLocaleDateString()}: ${m.mood}`);
            });
        } else {
            doc.text('No data available');
        }
        doc.moveDown();

        // 3. JOURNAL SUMMARY
        addSection('3. JOURNAL SUMMARY');
        doc.text(`Total Journal Entries: ${journalCount}`);
        if (latestJournals.length > 0) {
            doc.text('Recent Entries:');
            latestJournals.forEach(j => {
                doc.text(`- ${new Date(j.journal_date).toLocaleDateString()}: ${j.title}`);
            });
        } else {
            doc.text('No data available');
        }
        doc.moveDown();

        // 4. GOALS
        addSection('4. GOALS');
        if (goals.length > 0) {
            goals.forEach(g => {
                const status = g.completed ? 'Completed' : `In Progress (${g.current_progress || 0}/${g.target_value || 0})`;
                doc.text(`- ${g.title}: ${status}`);
            });
        } else {
            doc.text('No data available');
        }
        doc.moveDown();

        // 5. SLEEP SUMMARY
        addSection('5. SLEEP SUMMARY');
        if (sleeps.length > 0) {
            const avg = sleepAvg[0].avg_duration ? parseFloat(sleepAvg[0].avg_duration).toFixed(1) : 0;
            doc.text(`Average Sleep Duration: ${avg} hours`);
            doc.text('Recent Sleep Records:');
            sleeps.forEach(s => {
                doc.text(`- ${new Date(s.sleep_date).toLocaleDateString()}: ${parseFloat(s.sleep_duration).toFixed(1)} hrs (${s.sleep_quality})`);
            });
        } else {
            doc.text('No data available');
        }
        doc.moveDown();

        // 6. MENTAL WELLNESS ASSESSMENT
        addSection('6. MENTAL WELLNESS ASSESSMENT');
        if (phq9.length > 0 || gad7.length > 0) {
            if (phq9.length > 0) {
                doc.text(`PHQ-9 (Depression): Score ${phq9[0].total_score} - ${phq9[0].severity} (Taken on: ${new Date(phq9[0].created_at).toLocaleDateString()})`);
            }
            if (gad7.length > 0) {
                doc.text(`GAD-7 (Anxiety): Score ${gad7[0].total_score} - ${gad7[0].severity} (Taken on: ${new Date(gad7[0].created_at).toLocaleDateString()})`);
            }
        } else {
            doc.text('No data available');
        }
        doc.moveDown();

        // 7. ACHIEVEMENTS / HABITS
        addSection('7. ACHIEVEMENTS / HABITS');
        if (habits.length > 0) {
            doc.font('Helvetica-Bold').text('Active Habits:');
            doc.font('Helvetica');
            habits.forEach(h => {
                doc.text(`- ${h.name} (${h.active ? 'Active' : 'Inactive'})`);
            });
            doc.moveDown();
        }
        if (achievements.length > 0) {
            doc.font('Helvetica-Bold').text('Recent Achievements:');
            doc.font('Helvetica');
            achievements.forEach(a => {
                doc.text(`- ${a.name}: ${a.description}`);
            });
        }
        if (habits.length === 0 && achievements.length === 0) {
            doc.text('No data available');
        }
        doc.moveDown(2);

        // Disclaimer
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('gray');
        doc.text('Disclaimer: PHQ-9 and GAD-7 results are wellness screening information for self-awareness and are not medical diagnoses. If you are in crisis, please seek immediate professional help.', { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    }
});

module.exports = router;
