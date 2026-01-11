/**
 * Habit Score Calculator
 * 
 * This implements the habit strength algorithm similar to Loop Habit Tracker.
 * 
 * The key insight is that habit strength should:
 * 1. Increase with each completion
 * 2. Decrease (decay) when habits are missed
 * 3. Not reset to zero after a single miss (unlike "don't break the chain")
 * 4. Account for the frequency/schedule of the habit
 */

// Constants for the scoring algorithm
const SCORE_INCREASE = 0.052;  // ~5.2% increase per completion
const SCORE_DECREASE = 0.035;  // ~3.5% decrease per miss
const MAX_SCORE = 1.0;         // Maximum score (100%)
const MIN_SCORE = 0.0;         // Minimum score (0%)

/**
 * Calculate the habit strength score based on completion history
 * 
 * @param {Array<string>} completedDates - Array of dates (YYYY-MM-DD) when habit was completed
 * @param {Object} habit - Habit object with frequency settings
 * @param {number} daysToAnalyze - Number of days to look back (default: 60)
 * @returns {number} - Score between 0 and 1
 */
export function calculateHabitScore(completedDates, habit, daysToAnalyze = 60) {
  const completedSet = new Set(completedDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let score = 0;
  
  // Go through each day from oldest to newest
  for (let i = daysToAnalyze - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    // Check if this day was scheduled based on habit frequency
    const isScheduled = isDayScheduled(date, habit);
    
    if (!isScheduled) {
      // Non-scheduled days don't affect the score
      continue;
    }
    
    const wasCompleted = completedSet.has(dateStr);
    
    if (wasCompleted) {
      // Increase score on completion
      // Using a logistic-like curve to make it harder to reach 100%
      const increase = SCORE_INCREASE * (1 - score * 0.5);
      score = Math.min(MAX_SCORE, score + increase);
    } else {
      // Decrease score on miss
      // Higher scores decay faster
      const decrease = SCORE_DECREASE * (0.5 + score * 0.5);
      score = Math.max(MIN_SCORE, score - decrease);
    }
  }
  
  return score;
}

/**
 * Check if a specific day is scheduled for a habit
 * 
 * @param {Date} date - The date to check
 * @param {Object} habit - Habit with frequency settings
 * @returns {boolean}
 */
export function isDayScheduled(date, habit) {
  const frequency = habit.frequency || 'daily';
  
  switch (frequency) {
    case 'daily':
      return true;
      
    case 'weekly': {
      // X times per week - we consider all days as "schedulable"
      // but track against the weekly target
      return true;
    }
    
    case 'interval': {
      // Every X days
      const interval = habit.interval || 2;
      const habitStartDate = new Date(habit.createdAt);
      habitStartDate.setHours(0, 0, 0, 0);
      
      const daysSinceStart = Math.floor((date - habitStartDate) / (1000 * 60 * 60 * 24));
      return daysSinceStart >= 0 && daysSinceStart % interval === 0;
    }
    
    case 'specific_days': {
      // Specific days of the week
      const days = habit.specificDays || [0, 1, 2, 3, 4, 5, 6];
      return days.includes(date.getDay());
    }
    
    default:
      return true;
  }
}

/**
 * Calculate current streak for a habit
 * 
 * @param {Array<string>} completedDates - Array of completed dates
 * @param {Object} habit - Habit object
 * @returns {number} - Current streak count
 */
export function calculateStreak(completedDates, habit) {
  if (completedDates.length === 0) return 0;
  
  const sortedDates = [...completedDates].sort().reverse();
  const completedSet = new Set(sortedDates);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  // Check if today is completed, if not start from yesterday
  const todayStr = formatDate(today);
  if (!completedSet.has(todayStr) && isDayScheduled(today, habit)) {
    // If today is not completed and it's scheduled, check if it's still early
    // For now, we allow the streak to continue if yesterday was done
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  // Count consecutive scheduled days that were completed
  while (true) {
    const dateStr = formatDate(currentDate);
    const isScheduled = isDayScheduled(currentDate, habit);
    
    if (isScheduled) {
      if (completedSet.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    
    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Don't go back more than a year
    const daysDiff = Math.floor((today - currentDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) break;
  }
  
  return streak;
}

/**
 * Calculate best streak ever for a habit
 * 
 * @param {Array<string>} completedDates - Array of completed dates
 * @param {Object} habit - Habit object
 * @returns {number} - Best streak count
 */
export function calculateBestStreak(completedDates, habit) {
  if (completedDates.length === 0) return 0;
  
  const sortedDates = [...completedDates].sort();
  const completedSet = new Set(sortedDates);
  
  if (sortedDates.length === 0) return 0;
  
  const startDate = new Date(sortedDates[0]);
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  
  let bestStreak = 0;
  let currentStreak = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    const isScheduled = isDayScheduled(currentDate, habit);
    
    if (isScheduled) {
      if (completedSet.has(dateStr)) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return bestStreak;
}

/**
 * Calculate total completions for a habit
 * 
 * @param {Array<string>} completedDates - Array of completed dates
 * @returns {number} - Total count
 */
export function calculateTotal(completedDates) {
  return completedDates.length;
}

/**
 * Calculate completion rate for a period
 * 
 * @param {Array<string>} completedDates - Array of completed dates
 * @param {Object} habit - Habit object
 * @param {number} days - Number of days to analyze
 * @returns {number} - Rate between 0 and 1
 */
export function calculateCompletionRate(completedDates, habit, days = 30) {
  const completedSet = new Set(completedDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let scheduledDays = 0;
  let completedDays = 0;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    if (isDayScheduled(date, habit)) {
      scheduledDays++;
      if (completedSet.has(dateStr)) {
        completedDays++;
      }
    }
  }
  
  return scheduledDays > 0 ? completedDays / scheduledDays : 0;
}

/**
 * Get weekly completion count
 * 
 * @param {Array<string>} completedDates - Array of completed dates
 * @param {Date} weekStart - Start of the week
 * @returns {number} - Number of completions in that week
 */
export function getWeeklyCompletions(completedDates, weekStart) {
  const completedSet = new Set(completedDates);
  let count = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    if (completedSet.has(formatDate(date))) {
      count++;
    }
  }
  
  return count;
}

/**
 * Calculate scores over time for charting
 * 
 * @param {Array<string>} completedDates - Array of completed dates
 * @param {Object} habit - Habit object
 * @param {number} days - Number of days to generate
 * @returns {Array<{date: string, score: number}>}
 */
export function calculateScoreHistory(completedDates, habit, days = 30) {
  const completedSet = new Set(completedDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const history = [];
  let score = 0;
  
  // Calculate from oldest to newest
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);
    
    const isScheduled = isDayScheduled(date, habit);
    
    if (isScheduled) {
      const wasCompleted = completedSet.has(dateStr);
      
      if (wasCompleted) {
        const increase = SCORE_INCREASE * (1 - score * 0.5);
        score = Math.min(MAX_SCORE, score + increase);
      } else {
        const decrease = SCORE_DECREASE * (0.5 + score * 0.5);
        score = Math.max(MIN_SCORE, score - decrease);
      }
    }
    
    history.push({
      date: dateStr,
      score: score
    });
  }
  
  return history;
}

/**
 * Get all habit statistics
 * 
 * @param {Array<string>} completedDates - Array of completed dates
 * @param {Object} habit - Habit object
 * @returns {Object} - Object containing all statistics
 */
export function getHabitStats(completedDates, habit) {
  return {
    score: calculateHabitScore(completedDates, habit),
    currentStreak: calculateStreak(completedDates, habit),
    bestStreak: calculateBestStreak(completedDates, habit),
    total: calculateTotal(completedDates),
    completionRate: calculateCompletionRate(completedDates, habit),
    scoreHistory: calculateScoreHistory(completedDates, habit)
  };
}

// Utility function
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export { formatDate as formatDateScore };
