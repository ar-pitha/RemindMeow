const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// All routes require authentication
router.use(authenticateUser);

// Insights & Analytics
router.get('/insights', aiController.getInsights);
router.get('/habits', aiController.getHabitInsights);

// Task Suggestions
router.get('/suggestions', aiController.getSuggestions);
router.post('/suggestions/:suggestionId/accept', aiController.acceptSuggestion);
router.post('/suggestions/:suggestionId/reject', aiController.rejectSuggestion);

// Time Estimation
router.get('/estimate-time', aiController.estimateTaskTime);

// Auto-categorization
router.post('/categorize', aiController.categorizeTask);

// Rescheduling Recommendations
router.get('/recommendations/:taskId', aiController.getReschedulingRecommendations);

module.exports = router;
