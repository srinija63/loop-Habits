/**
 * Completion Model
 * Records when a habit was completed on a specific date
 */

const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  value: {
    type: Number,
    default: 1
  },
  note: {
    type: String,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique habit+date combination per user
completionSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });

// Index for date range queries
completionSchema.index({ habit: 1, date: 1 });

module.exports = mongoose.model('Completion', completionSchema);
