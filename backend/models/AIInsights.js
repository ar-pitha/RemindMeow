const mongoose = require('mongoose');

const aiInsightsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Time estimation data
    taskDurations: {
      // Map of category -> { average, min, max, sampleCount }
      type: Map,
      of: {
        average: Number,      // Average duration in minutes
        min: Number,
        max: Number,
        sampleCount: { type: Number, default: 0 },
      },
      default: new Map(),
    },

    // Category prediction model
    categoryPatterns: {
      type: Map,
      of: {
        frequency: Number,    // How often this category is used
        commonWords: [String], // Common words in titles
        avgDuration: Number,
      },
      default: new Map(),
    },

    // Time-of-day patterns
    preferredTaskTimes: {
      morning: { type: Number, default: 0 },      // 6am-12pm
      afternoon: { type: Number, default: 0 },    // 12pm-6pm
      evening: { type: Number, default: 0 },      // 6pm-12am
      night: { type: Number, default: 0 },        // 12am-6am
    },

    // Completion patterns
    completionPatterns: {
      onTimeCount: { type: Number, default: 0 },
      lateCount: { type: Number, default: 0 },
      cancelledCount: { type: Number, default: 0 },
      avgDaysToComplete: { type: Number, default: 0 },
    },

    // Habit insights
    habitStreak: {
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      lastCompleted: Date,
    },

    // Task patterns
    peakProductivityDays: {
      // Days when user completes most tasks (0=Monday, 6=Sunday)
      type: [Number],
      default: [],
    },

    averageTasksPerDay: {
      type: Number,
      default: 0,
    },

    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ML features for scheduling
    bestPredictedTimes: {
      // Categories and their best completion times
      type: Map,
      of: String, // e.g., "14:00-16:00" (2pm-4pm)
      default: new Map(),
    },

    // Last updated insights
    lastAnalyzed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
aiInsightsSchema.index({ userId: 1, lastAnalyzed: -1 });

module.exports = mongoose.model('AIInsights', aiInsightsSchema);
