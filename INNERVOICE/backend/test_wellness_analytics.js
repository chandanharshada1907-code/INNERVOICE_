const request = require('supertest');
const express = require('express');
const analyticsRoutes = require('./routes/analytics');
const db = require('./db');
const jwt = require('jsonwebtoken');

// Mock DB
jest.mock('./db', () => ({
    promise: jest.fn()
}));

// Mock Auth
jest.mock('./middleware/auth', () => (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, message: "No token provided" });
    
    if (authHeader === 'Bearer valid-token-user1') {
        req.user = { id: 1, email: "test1@test.com" };
        next();
    } else if (authHeader === 'Bearer valid-token-user2') {
        req.user = { id: 2, email: "test2@test.com" };
        next();
    } else {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
});

const app = express();
app.use(express.json());
app.use('/api/wellness-analytics', analyticsRoutes);

describe('Phase 12: Wellness Analytics API Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Unauthorized request returns 401', async () => {
        const response = await request(app).get('/api/wellness-analytics');
        expect(response.statusCode).toBe(401);
    });

    test('2. Invalid period returns 400', async () => {
        const response = await request(app)
            .get('/api/wellness-analytics?period=invalid')
            .set('Authorization', 'Bearer valid-token-user1');
        
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/Invalid period/);
    });

    test('3. Empty user data handles gracefully (30 days)', async () => {
        // Mock all queries to return empty arrays
        const mockDb = {
            query: jest.fn().mockResolvedValue([[]])
        };
        db.promise.mockReturnValue(mockDb);

        const response = await request(app)
            .get('/api/wellness-analytics?period=30')
            .set('Authorization', 'Bearer valid-token-user2');

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.period).toBe('30');
        expect(response.body.wellnessScore.current).toBe(0);
        expect(response.body.mood.mostFrequent).toBe("None");
        expect(response.body.goals.active).toBe(0);
        expect(response.body.summary).toMatch(/Keep using INNERVOICE/);
    });

    test('4. Full Data Aggregation (7 days)', async () => {
        const mockDb = {
            query: jest.fn((sql, params) => {
                if (sql.includes('FROM users')) {
                    return Promise.resolve([[{ streak: 5, xp: 200, level: 3 }]]);
                }
                if (sql.includes('FROM wellness_scores')) {
                    if (sql.includes('MAX(score)')) return Promise.resolve([[{ max_score: 85 }]]);
                    if (sql.includes('LIMIT 1')) return Promise.resolve([[{ score: 70 }]]); // prev score
                    return Promise.resolve([[{ score: 75, score_date: '2023-10-01' }, { score: 80, score_date: '2023-10-02' }]]); // current scores
                }
                if (sql.includes('FROM moods')) {
                    return Promise.resolve([[{ mood: 'Happy', mood_date: '2023-10-01' }, { mood: 'Good', mood_date: '2023-10-02' }]]);
                }
                if (sql.includes('FROM habits')) {
                    return Promise.resolve([[{ id: 1 }, { id: 2 }]]); // 2 active habits
                }
                if (sql.includes('FROM habit_completions')) {
                    return Promise.resolve([[{ id: 1 }, { id: 2 }, { id: 3 }]]); // 3 completions
                }
                if (sql.includes('FROM goals')) {
                    if (sql.includes('COUNT(*)')) return Promise.resolve([[{ c: 10 }]]); // most goals
                    return Promise.resolve([[
                        { completed: 0, target_date: '2023-01-01' }, // overdue
                        { completed: 1 } // completed
                    ]]);
                }
                if (sql.includes('FROM goal_milestones')) {
                    return Promise.resolve([[{ is_completed: 1 }, { is_completed: 0 }]]);
                }
                if (sql.includes('FROM journals')) {
                    return Promise.resolve([[{ journal_date: '2023-10-01' }, { journal_date: '2023-10-02' }, { journal_date: '2023-10-03' }]]);
                }
                if (sql.includes('FROM reflections')) {
                    return Promise.resolve([[{ reflection_date: '2023-10-01' }]]);
                }
                if (sql.includes('FROM daily_plans')) {
                    return Promise.resolve([[{ completion_percentage: 100 }, { completion_percentage: 50 }]]);
                }
                if (sql.includes('FROM user_achievements')) {
                    return Promise.resolve([[{ id: 1 }, { id: 2 }]]);
                }
                return Promise.resolve([[]]);
            })
        };
        db.promise.mockReturnValue(mockDb);

        const response = await request(app)
            .get('/api/wellness-analytics?period=7')
            .set('Authorization', 'Bearer valid-token-user1');

        expect(response.statusCode).toBe(200);
        const d = response.body;
        
        // 1. Score
        expect(d.wellnessScore.current).toBe(80);
        expect(d.wellnessScore.previous).toBe(70);
        expect(d.wellnessScore.change).toBe(10);
        expect(d.wellnessScore.changePct).toBe(14); // round(10/70 * 100) = 14

        // 2. Mood
        expect(d.mood.avgScore).toBe("4.5"); // Happy(5) + Good(4) / 2
        expect(d.mood.positivePct).toBe(100);
        expect(d.mood.consistency).toBe(29); // 2 unique days / 7 days = ~29%

        // 3. Habits
        expect(d.habits.active).toBe(2);
        expect(d.habits.completed).toBe(3);
        // expected: 2 habits * 7 days = 14. 3 / 14 = ~21%
        expect(d.habits.consistency).toBe(21);
        expect(d.habits.streak).toBe(5);

        // 4. Goals
        expect(d.goals.active).toBe(1);
        expect(d.goals.completed).toBe(1);
        expect(d.goals.completionPct).toBe(50);
        expect(d.goals.overdue).toBe(1);
        expect(d.goals.milestonesAchieved).toBe(1);

        // 5. Journals
        expect(d.journals.total).toBe(3);
        expect(d.journals.thisWeek).toBe(3);

        // 6. Plans
        expect(d.dailyPlan.generated).toBe(2);
        expect(d.dailyPlan.completed).toBe(1);
        expect(d.dailyPlan.avgCompletion).toBe(75);

        // 7. Personal Bests
        expect(d.personalBests.highestWellnessScore).toBe(85);
        expect(d.personalBests.mostGoals).toBe(10);

        // 8. Deterministic Summary and Strengths
        expect(d.strengths).toContain("5-Day Streak Active!");
        expect(d.improvements).toContain("1 Overdue Goals");
        
    });

    test('5. Cross-User Isolation Check', async () => {
        // Assert that the userId passed to db queries matches the token
        const mockDb = {
            query: jest.fn().mockResolvedValue([[]])
        };
        db.promise.mockReturnValue(mockDb);

        await request(app)
            .get('/api/wellness-analytics?period=all')
            .set('Authorization', 'Bearer valid-token-user2');

        // Check the first call (users query)
        expect(mockDb.query.mock.calls[0][1][0]).toBe(2); // userId = 2
    });
});
