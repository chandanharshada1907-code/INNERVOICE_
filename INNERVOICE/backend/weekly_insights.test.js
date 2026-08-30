const request = require('supertest');
const express = require('express');
const weeklyInsightsRouter = require('./routes/weekly_insights_v2');

// Mock DB and Auth
jest.mock('./db', () => ({
    promise: () => ({
        query: jest.fn().mockImplementation((query, params) => {
            if (query.includes('FROM moods')) return [[{ mood: 'happy', score: 5 }, { mood: 'sad', score: 2 }]];
            if (query.includes('COUNT(DISTINCT habit_id)')) return [[{ active_habits: 2 }]];
            if (query.includes('COUNT(*) as count FROM habit_completions')) return [[{ count: 5 }]];
            if (query.includes('FROM goals WHERE user_id = ? AND completed = FALSE')) return [[{ active: 1 }]];
            if (query.includes('FROM goals WHERE user_id = ? AND completed = TRUE')) return [[{ completed: 1 }]];
            if (query.includes('FROM goal_milestones')) return [[{ count: 2 }]];
            if (query.includes('FROM daily_plans')) return [[{ id: 1, completion_percentage: 100 }]];
            if (query.includes('FROM daily_plan_items')) return [[{ completed: 1, skipped: 0 }, { completed: 0, skipped: 1 }]];
            if (query.includes('FROM journals')) return [[{ count: 1 }]];
            if (query.includes('FROM reflections')) return [[{ count: 1 }]];
            return [[]];
        })
    })
}));

jest.mock('./middleware/auth', () => (req, res, next) => {
    req.user = { id: 1 };
    next();
});

jest.mock('./services/wellnessAssistantService', () => ({
    generateWellnessInsight: jest.fn().mockResolvedValue("You had a great week! Keep it up. - Stay hydrated - Meditate")
}));

const app = express();
app.use('/api/insights', weeklyInsightsRouter);

describe('Weekly Wellness Insights API (Phase 15)', () => {
    it('GET /api/insights/weekly should return insight metrics', async () => {
        const res = await request(app).get('/api/insights/weekly');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('score');
        expect(res.body.data.score).toHaveProperty('current');
        expect(res.body.data).toHaveProperty('mood');
        expect(res.body.data.mood.average).toBe(3.5);
        expect(res.body.data.aiInsight).toHaveProperty('summary');
    });
});
