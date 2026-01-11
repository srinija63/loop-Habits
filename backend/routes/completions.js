/**
 * Completion Routes
 * Track habit completions
 */

const express = require('express');
const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/completions
 * Get all completions for the current user
 * Query params: habitId, startDate, endDate
 */
router.get('/', async (req, res) => {
  try {
    const { habitId, startDate, endDate } = req.query;
    
    const query = { user: req.userId };
    
    if (habitId) {
      query.habit = habitId;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }
    
    const completions = await Completion.find(query).sort({ date: -1 });
    
    res.json({ completions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

/**
 * GET /api/completions/habit/:habitId
 * Get all completions for a specific habit
 */
router.get('/habit/:habitId', async (req, res) => {
  try {
    const completions = await Completion.find({
      user: req.userId,
      habit: req.params.habitId
    }).sort({ date: -1 });
    
    // Return just the dates for easier client-side processing
    const dates = completions.map(c => c.date);
    
    res.json({ completions, dates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

/**
 * POST /api/completions/toggle
 * Toggle completion for a habit on a specific date
 */
router.post('/toggle', async (req, res) => {
  try {
    const { habitId, date } = req.body;
    
    if (!habitId || !date) {
      return res.status(400).json({ error: 'habitId and date are required' });
    }
    
    // Verify habit belongs to user
    const habit = await Habit.findOne({ _id: habitId, user: req.userId });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Check if completion exists
    const existingCompletion = await Completion.findOne({
      user: req.userId,
      habit: habitId,
      date
    });
    
    if (existingCompletion) {
      // Remove completion
      await existingCompletion.deleteOne();
      res.json({
        completed: false,
        message: 'Completion removed'
      });
    } else {
      // Add completion
      const completion = new Completion({
        user: req.userId,
        habit: habitId,
        date
      });
      await completion.save();
      res.json({
        completed: true,
        message: 'Habit completed',
        completion
      });
    }
  } catch (error) {
    console.error('Toggle completion error:', error);
    res.status(500).json({ error: 'Failed to toggle completion' });
  }
});

/**
 * POST /api/completions
 * Add a completion (alternative to toggle)
 */
router.post('/', async (req, res) => {
  try {
    const { habitId, date, value, note } = req.body;
    
    if (!habitId || !date) {
      return res.status(400).json({ error: 'habitId and date are required' });
    }
    
    // Verify habit belongs to user
    const habit = await Habit.findOne({ _id: habitId, user: req.userId });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Use upsert to add or update
    const completion = await Completion.findOneAndUpdate(
      { user: req.userId, habit: habitId, date },
      {
        user: req.userId,
        habit: habitId,
        date,
        value: value || 1,
        note
      },
      { upsert: true, new: true }
    );
    
    res.json({
      message: 'Completion added',
      completion
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add completion' });
  }
});

/**
 * DELETE /api/completions
 * Remove a completion
 */
router.delete('/', async (req, res) => {
  try {
    const { habitId, date } = req.body;
    
    if (!habitId || !date) {
      return res.status(400).json({ error: 'habitId and date are required' });
    }
    
    await Completion.findOneAndDelete({
      user: req.userId,
      habit: habitId,
      date
    });
    
    res.json({ message: 'Completion removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove completion' });
  }
});

/**
 * GET /api/completions/stats
 * Get completion statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get completions in range
    const completions = await Completion.find({
      user: req.userId,
      date: { $gte: startDateStr, $lte: endDateStr }
    });
    
    // Group by date
    const byDate = {};
    completions.forEach(c => {
      byDate[c.date] = (byDate[c.date] || 0) + 1;
    });
    
    // Group by day of week
    const byDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    completions.forEach(c => {
      const date = new Date(c.date);
      byDayOfWeek[date.getDay()]++;
    });
    
    res.json({
      totalCompletions: completions.length,
      byDate,
      byDayOfWeek,
      startDate: startDateStr,
      endDate: endDateStr
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
