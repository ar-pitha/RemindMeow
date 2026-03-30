const Task = require('../models/Task');
const AIInsights = require('../models/AIInsights');
const TaskSuggestion = require('../models/TaskSuggestion');
const User = require('../models/User');

class AIService {
  /**
   * Analyze user's task patterns and generate insights
   */
  async analyzeUserPatterns(userId) {
    try {
      console.log(`🤖 Analyzing patterns for user: ${userId}`);

      // Fetch user's completed tasks from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const completedTasks = await Task.find({
        createdBy: userId,
        status: 'completed',
        createdAt: { $gte: ninetyDaysAgo },
      }).populate('completedBy');

      if (completedTasks.length === 0) {
        console.log('⚠️ No completed tasks found for analysis');
        return null;
      }

      // Initialize or fetch existing insights
      let insights = await AIInsights.findOne({ userId });
      if (!insights) {
        insights = new AIInsights({ userId });
      }

      // 1. Calculate task durations by category
      const categoryDurations = new Map();

      completedTasks.forEach(task => {
        if (!task.category) return;

        const completedAt = task.completedBy?.[0]?.completedAt || new Date();
        const duration = Math.floor(
          (completedAt - new Date(task.alarmTime)) / (1000 * 60) // Convert to minutes
        );

        if (!categoryDurations.has(task.category)) {
          categoryDurations.set(task.category, []);
        }
        categoryDurations.get(task.category).push(duration);
      });

      // Process duration data
      categoryDurations.forEach((durations, category) => {
        const sorted = durations.sort((a, b) => a - b);
        const average = durations.reduce((a, b) => a + b, 0) / durations.length;

        insights.taskDurations.set(category, {
          average: Math.round(average),
          min: sorted[0],
          max: sorted[sorted.length - 1],
          sampleCount: durations.length,
        });
      });

      // 2. Analyze time-of-day patterns
      const timeOfDayStats = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
      };

      completedTasks.forEach(task => {
        const hour = new Date(task.alarmTime).getHours();
        if (hour >= 6 && hour < 12) timeOfDayStats.morning++;
        else if (hour >= 12 && hour < 18) timeOfDayStats.afternoon++;
        else if (hour >= 18 && hour < 24) timeOfDayStats.evening++;
        else timeOfDayStats.night++;
      });

      insights.preferredTaskTimes = timeOfDayStats;

      // 3. Analyze completion patterns
      const onTimeCount = completedTasks.filter(t => {
        const completedAt = t.completedBy?.[0]?.completedAt || new Date();
        return completedAt <= new Date(t.alarmTime);
      }).length;

      const lateCount = completedTasks.length - onTimeCount;

      insights.completionPatterns = {
        onTimeCount,
        lateCount,
        cancelledCount: 0,
        avgDaysToComplete:
          completedTasks.reduce((sum, t) => {
            const createdDate = new Date(t.createdAt);
            const completedDate = t.completedBy?.[0]?.completedAt || new Date();
            return sum + (completedDate - createdDate) / (1000 * 60 * 60 * 24);
          }, 0) / completedTasks.length,
      };

      insights.completionRate = Math.round(
        (onTimeCount / completedTasks.length) * 100
      );

      // 4. Analyze peak productivity days
      const dayStats = Array(7).fill(0);
      completedTasks.forEach(task => {
        const day = new Date(task.alarmTime).getDay();
        dayStats[day]++;
      });

      const maxTasksPerDay = Math.max(...dayStats);
      insights.peakProductivityDays = dayStats
        .map((count, day) => (count > maxTasksPerDay * 0.7 ? day : -1))
        .filter(day => day !== -1);

      insights.averageTasksPerDay = Math.round(
        completedTasks.length / 90
      );

      // 5. Find best predicted times for categories
      completedTasks.forEach(task => {
        if (!task.category) return;

        const hour = new Date(task.alarmTime).getHours();
        const timeSlot = `${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}:00`;

        if (!insights.bestPredictedTimes.has(task.category)) {
          insights.bestPredictedTimes.set(task.category, timeSlot);
        }
      });

      insights.lastAnalyzed = new Date();
      await insights.save();

      console.log('✅ Patterns analyzed successfully');
      return insights;
    } catch (error) {
      console.error('❌ Error analyzing patterns:', error);
      throw error;
    }
  }

  /**
   * Estimate task duration based on category and history
   */
  async estimateTaskDuration(userId, category) {
    try {
      const insights = await AIInsights.findOne({ userId });

      if (!insights || !insights.taskDurations.has(category)) {
        // Default estimates for common categories
        const defaultEstimates = {
          work: 60,
          personal: 30,
          shopping: 45,
          exercise: 30,
          meeting: 60,
          urgent: 20,
        };
        return defaultEstimates[category?.toLowerCase()] || 30;
      }

      return insights.taskDurations.get(category).average;
    } catch (error) {
      console.error('Error estimating duration:', error);
      return 30; // Default fallback
    }
  }

  /**
   * Auto-categorize a task based on title and description
   */
  async autoCategorizeTask(title, description = '') {
    try {
      const text = `${title} ${description}`.toLowerCase();

      // Category keywords mapping
      const categoryKeywords = {
        work: ['work', 'project', 'meeting', 'report', 'email', 'deadline', 'submit', 'review'],
        personal: ['personal', 'self', 'home', 'family', 'friend', 'hobby', 'relax'],
        shopping: ['shop', 'buy', 'purchase', 'groceries', 'store', 'mall', 'amazon'],
        exercise: ['exercise', 'gym', 'run', 'walk', 'yoga', 'workout', 'sport', 'fitness'],
        health: ['doctor', 'appointment', 'medical', 'health', 'medicine', 'hospital', 'clinic'],
        finance: ['pay', 'bill', 'invoice', 'budget', 'tax', 'loan', 'bank', 'expense'],
        learning: ['learn', 'study', 'course', 'tutorial', 'read', 'educate', 'skill'],
        entertainment: ['movie', 'game', 'watch', 'play', 'entertainment', 'fun', 'music'],
      };

      let bestCategory = 'general';
      let maxMatches = 0;

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        const matches = keywords.filter(keyword => text.includes(keyword)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestCategory = category;
        }
      }

      console.log(`📌 Auto-categorized task as: ${bestCategory} (confidence: ${maxMatches})`);
      return {
        category: bestCategory,
        confidence: Math.min(maxMatches * 20, 100), // 0-100 confidence
      };
    } catch (error) {
      console.error('Error categorizing task:', error);
      return { category: 'general', confidence: 0 };
    }
  }

  /**
   * Generate intelligent rescheduling recommendations
   */
  async getReschedulingRecommendations(userId, taskId) {
    try {
      const task = await Task.findById(taskId);
      const insights = await AIInsights.findOne({ userId });

      if (!task || !insights) {
        return [];
      }

      const recommendations = [];

      // Recommendation 1: Better time of day
      const currentHour = new Date(task.alarmTime).getHours();
      const bestTime = this.findBestTimeOfDay(insights);

      if (bestTime && bestTime.hour !== currentHour) {
        recommendations.push({
          type: 'better_time_of_day',
          reason: `You usually complete tasks like this at ${bestTime.hour}:00-${bestTime.hour + 1}:00`,
          suggestedHour: bestTime.hour,
          confidenceScore: bestTime.confidence,
        });
      }

      // Recommendation 2: Less busy day
      const currentDay = new Date(task.alarmTime).getDay();
      if (insights.peakProductivityDays && insights.peakProductivityDays.includes(currentDay)) {
        const lessBusyDay = this.findLessBusyDay(insights);
        recommendations.push({
          type: 'less_crowded_day',
          reason: `You schedule fewer tasks on ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][lessBusyDay]}`,
          suggestedDayOffset: lessBusyDay - currentDay,
          confidenceScore: 70,
        });
      }

      // Recommendation 3: More realistic deadline
      if (task.category) {
        const estimatedDuration = insights.taskDurations.get(task.category)?.average;
        if (estimatedDuration) {
          recommendations.push({
            type: 'more_realistic_deadline',
            reason: `Similar tasks take ~${estimatedDuration} minutes on average`,
            suggestedDuration: estimatedDuration,
            confidenceScore: 80,
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting rescheduling recommendations:', error);
      return [];
    }
  }

  /**
   * Generate task suggestions based on user patterns
   */
  async generateTaskSuggestions(userId) {
    try {
      console.log(`🧠 Generating AI suggestions for user: ${userId}`);

      const insights = await AIInsights.findOne({ userId });
      if (!insights) {
        return [];
      }

      const suggestions = [];

      // Suggestion 1: Habit reminders
      const completedToday = await Task.countDocuments({
        createdBy: userId,
        status: 'completed',
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      });

      if (completedToday < insights.averageTasksPerDay * 0.7) {
        suggestions.push({
          title: 'Daily Routine Check-in',
          description: 'You usually complete more tasks by now. Ready to tackle a task?',
          suggestedCategory: 'personal',
          reasonType: 'habit_reminder',
          confidenceScore: 75,
        });
      }

      // Suggestion 2: Repeated patterns
      const mostCommonCategory = this.getMostFrequentCategory(insights);
      if (mostCommonCategory) {
        suggestions.push({
          title: `New ${mostCommonCategory} Task`,
          description: `You frequently create ${mostCommonCategory} tasks. Want to add another?`,
          suggestedCategory: mostCommonCategory,
          reasonType: 'repeated_pattern',
          confidenceScore: 65,
        });
      }

      // Save suggestions to database
      for (const suggestion of suggestions) {
        const existingSuggestion = await TaskSuggestion.findOne({
          userId,
          title: suggestion.title,
          actionTaken: 'pending',
        });

        if (!existingSuggestion) {
          await TaskSuggestion.create({
            ...suggestion,
            userId,
          });
        }
      }

      console.log(`✅ Generated ${suggestions.length} suggestions`);
      return suggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Get pending suggestions for user
   */
  async getPendingSuggestions(userId, limit = 5) {
    try {
      const suggestions = await TaskSuggestion.find({
        userId,
        actionTaken: 'pending',
        expiresAt: { $gt: new Date() },
      })
        .sort({ confidenceScore: -1 })
        .limit(limit);

      return suggestions;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  /**
   * Accept or reject suggestion
   */
  async handleSuggestionFeedback(userId, suggestionId, action) {
    try {
      const suggestion = await TaskSuggestion.findByIdAndUpdate(
        suggestionId,
        {
          actionTaken: action,
          feedbackDate: new Date(),
        },
        { new: true }
      );

      return suggestion;
    } catch (error) {
      console.error('Error handling feedback:', error);
      throw error;
    }
  }

  /**
   * Helper: Find best time of day
   */
  findBestTimeOfDay(insights) {
    const times = insights.preferredTaskTimes;
    const maxTime = Math.max(
      times.morning,
      times.afternoon,
      times.evening,
      times.night
    );

    if (times.morning === maxTime) return { timeOfDay: 'morning', hour: 10, confidence: 85 };
    if (times.afternoon === maxTime) return { timeOfDay: 'afternoon', hour: 14, confidence: 85 };
    if (times.evening === maxTime) return { timeOfDay: 'evening', hour: 19, confidence: 85 };
    if (times.night === maxTime) return { timeOfDay: 'night', hour: 2, confidence: 85 };

    return null;
  }

  /**
   * Helper: Find less busy day
   */
  findLessBusyDay(insights) {
    const dayStats = Array(7).fill(0);
    // Would need actual day data here
    return dayStats.indexOf(Math.min(...dayStats));
  }

  /**
   * Helper: Get most frequent category
   */
  getMostFrequentCategory(insights) {
    if (insights.categoryPatterns.size === 0) return null;

    let maxFreq = 0;
    let bestCategory = null;

    insights.categoryPatterns.forEach((data, category) => {
      if (data.frequency > maxFreq) {
        maxFreq = data.frequency;
        bestCategory = category;
      }
    });

    return bestCategory;
  }
}

module.exports = new AIService();
