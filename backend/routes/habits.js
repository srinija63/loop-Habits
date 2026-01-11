/**
 * Habit Routes
 * CRUD operations for habits
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Habit = require('../models/Habit');
const Completion = require('../models/Completion');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/habits
 * Get all habits for the current user
 */
router.get('/', async (req, res) => {
  try {
    const includeArchived = req.query.archived === 'true';
    
    const query = { user: req.userId };
    if (!includeArchived) {
      query.archived = false;
    }
    
    const habits = await Habit.find(query).sort({ order: 1, createdAt: -1 });
    
    res.json({ habits });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

/**
 * GET /api/habits/:id
 * Get a single habit
 */
router.get('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit' });
  }
});

/**
 * POST /api/habits
 * Create a new habit
 */
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('color').optional().isString(),
  body('icon').optional().isString(),
  body('frequency').optional().isIn(['daily', 'weekly', 'interval'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, question, color, icon, frequency, timesPerWeek, interval } = req.body;
    
    // Get max order for user's habits
    const maxOrderHabit = await Habit.findOne({ user: req.userId }).sort({ order: -1 });
    const newOrder = maxOrderHabit ? maxOrderHabit.order + 1 : 0;
    
    const habit = new Habit({
      user: req.userId,
      name,
      question,
      color,
      icon,
      frequency,
      timesPerWeek,
      interval,
      order: newOrder
    });
    
    await habit.save();
    
    res.status(201).json({
      message: 'Habit created',
      habit
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

/**
 * PUT /api/habits/:id
 * Update a habit
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, question, color, icon, frequency, timesPerWeek, interval, archived, order } = req.body;
    
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        $set: {
          ...(name && { name }),
          ...(question !== undefined && { question }),
          ...(color && { color }),
          ...(icon && { icon }),
          ...(frequency && { frequency }),
          ...(timesPerWeek && { timesPerWeek }),
          ...(interval && { interval }),
          ...(typeof archived === 'boolean' && { archived }),
          ...(typeof order === 'number' && { order })
        }
      },
      { new: true }
    );
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({
      message: 'Habit updated',
      habit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update habit' });
  }
});

/**
 * DELETE /api/habits/:id
 * Delete a habit and all its completions
 */
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    // Delete all completions for this habit
    await Completion.deleteMany({
      habit: req.params.id,
      user: req.userId
    });
    
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

/**
 * PUT /api/habits/reorder
 * Reorder habits
 */
router.put('/reorder', async (req, res) => {
  try {
    const { habitIds } = req.body;
    
    if (!Array.isArray(habitIds)) {
      return res.status(400).json({ error: 'habitIds must be an array' });
    }
    
    // Update order for each habit
    const updates = habitIds.map((id, index) => 
      Habit.updateOne(
        { _id: id, user: req.userId },
        { $set: { order: index } }
      )
    );
    
    await Promise.all(updates);
    
    res.json({ message: 'Habits reordered' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder habits' });
  }
});

module.exports = router;
