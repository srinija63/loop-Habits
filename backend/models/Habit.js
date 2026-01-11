/**
 * Habit Model
 */

const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  question: {
    type: String,
    trim: true,
    maxlength: [200, 'Question cannot exceed 200 characters']
  },
  color: {
    type: String,
    default: '#6c5ce7'
  },
  icon: {
    type: String,
    default: '🎯'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'interval'],
    default: 'daily'
  },
  timesPerWeek: {
    type: Number,
    min: 1,
    max: 7,
    default: 3
  },
  interval: {
    type: Number,
    min: 2,
    max: 30,
    default: 2
  },
  archived: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
habitSchema.index({ user: 1, archived: 1 });

module.exports = mongoose.model('Habit', habitSchema);
