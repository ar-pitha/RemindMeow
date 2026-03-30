const aiService = require('../services/aiService');
const TaskSuggestion = require('../models/TaskSuggestion');

class AIController {
  /**
   * Get AI insights for user
   */
  async getInsights(req, res, next) {
    try {
      const userId = req.userId;

      // Generate insights if needed
      const insights = await aiService.analyzeUserPatterns(userId);

      res.status(200).json({
        success: true,
        insights,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending task suggestions
   */
  async getSuggestions(req, res, next) {
    try {
      const userId = req.userId;
      const { limit = 5 } = req.query;

      // Generate fresh suggestions
      await aiService.generateTaskSuggestions(userId);

      // Fetch pending suggestions
      const suggestions = await aiService.getPendingSuggestions(userId, parseInt(limit));

      res.status(200).json({
        success: true,
        suggestions,
        count: suggestions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept suggestion (create task from it)
   */
  async acceptSuggestion(req, res, next) {
    try {
      const userId = req.userId;
      const { suggestionId } = req.params;
      const { alarmTime, reminderTimes } = req.body;

      const suggestion = await TaskSuggestion.findById(suggestionId);

      if (!suggestion || suggestion.userId.toString() !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Suggestion not found',
        });
      }

      // Create task from suggestion
      const Task = require('../models/Task');
      const task = new Task({
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.suggestedCategory,
        priority: suggestion.suggestedPriority,
        alarmTime: alarmTime || new Date(Date.now() + suggestion.suggestedDuration * 60000),
        reminderTimes: reminderTimes || [30, 15],
        createdBy: userId,
      });

      await task.save();

      // Update suggestion
      await TaskSuggestion.findByIdAndUpdate(suggestionId, {
        actionTaken: 'accepted',
        taskCreatedFromSuggestion: task._id,
        feedbackDate: new Date(),
      });

      res.status(201).json({
        success: true,
        task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject suggestion
   */
  async rejectSuggestion(req, res, next) {
    try {
      const userId = req.userId;
      const { suggestionId } = req.params;

      const suggestion = await TaskSuggestion.findById(suggestionId);

      if (!suggestion || suggestion.userId.toString() !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Suggestion not found',
        });
      }

      await aiService.handleSuggestionFeedback(userId, suggestionId, 'rejected');

      res.status(200).json({
        success: true,
        message: 'Suggestion rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get time estimation for task
   */
  async estimateTaskTime(req, res, next) {
    try {
      const userId = req.userId;
      const { category } = req.query;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required',
        });
      }

      const estimatedMinutes = await aiService.estimateTaskDuration(userId, category);

      res.status(200).json({
        success: true,
        category,
        estimatedMinutes,
        estimatedHours: (estimatedMinutes / 60).toFixed(1),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Auto-categorize task
   */
  async categorizeTask(req, res, next) {
    try {
      const { title, description } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'Task title is required',
        });
      }

      const { category, confidence } = await aiService.autoCategorizeTask(title, description);

      res.status(200).json({
        success: true,
        category,
        confidence,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rescheduling recommendations
   */
  async getReschedulingRecommendations(req, res, next) {
    try {
      const userId = req.userId;
      const { taskId } = req.params;

      const recommendations = await aiService.getReschedulingRecommendations(
        userId,
        taskId
      );

      res.status(200).json({
        success: true,
        recommendations,
        count: recommendations.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get habit insights
   */
  async getHabitInsights(req, res, next) {
    try {
      const userId = req.userId;
      const AIInsights = require('../models/AIInsights');

      const insights = await AIInsights.findOne({ userId });

      if (!insights) {
        return res.status(404).json({
          success: false,
          message: 'No habit insights available yet',
        });
      }

      res.status(200).json({
        success: true,
        habits: {
          completionRate: insights.completionRate,
          currentStreak: insights.habitStreak?.currentStreak || 0,
          longestStreak: insights.habitStreak?.longestStreak || 0,
          peakProductivityDays: insights.peakProductivityDays,
          averageTasksPerDay: insights.averageTasksPerDay,
          preferredTimes: insights.preferredTaskTimes,
          completionPatterns: insights.completionPatterns,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();
