const mongoose = require('mongoose');

const taskSuggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Suggestion details
    title: {
      type: String,
      required: true,
    },
    description: String,
    suggestedCategory: String,
    suggestedPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    suggestedDuration: {
      type: Number, // in minutes
      default: 30,
    },

    // Recommendation reason
    reasonType: {
      type: String,
      enum: [
        'habit_reminder',           // Regular habit this user should do
        'repeated_pattern',         // Task they do regularly
        'time_optimization',        // Better time for this task
        'missing_routine',          // Routine task is missing
        'smart_recommendation',     // ML-based recommendation
      ],
      required: true,
    },

    confidenceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50, // 0-100% confidence in suggestion
    },

    // Reference to related tasks
    relatedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],

    // User feedback
    actionTaken: {
      type: String,
      enum: ['accepted', 'rejected', 'ignored', 'pending'],
      default: 'pending',
    },

    taskCreatedFromSuggestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },

    feedbackDate: Date,

    // Metadata
    suggestedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true }
);

// Index for efficient querying
taskSuggestionSchema.index({ userId: 1, actionTaken: 1 });
taskSuggestionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('TaskSuggestion', taskSuggestionSchema);
