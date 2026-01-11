/**
 * IndexedDB Database Layer for Loop Habits
 * Handles all persistent storage operations
 */

const DB_NAME = 'LoopHabitsDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  HABITS: 'habits',
  COMPLETIONS: 'completions',
  SETTINGS: 'settings'
};

let db = null;

/**
 * Initialize the database
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Habits store
      if (!database.objectStoreNames.contains(STORES.HABITS)) {
        const habitsStore = database.createObjectStore(STORES.HABITS, {
          keyPath: 'id',
          autoIncrement: true
        });
        habitsStore.createIndex('name', 'name', { unique: false });
        habitsStore.createIndex('createdAt', 'createdAt', { unique: false });
        habitsStore.createIndex('archived', 'archived', { unique: false });
      }

      // Completions store
      if (!database.objectStoreNames.contains(STORES.COMPLETIONS)) {
        const completionsStore = database.createObjectStore(STORES.COMPLETIONS, {
          keyPath: 'id',
          autoIncrement: true
        });
        completionsStore.createIndex('habitId', 'habitId', { unique: false });
        completionsStore.createIndex('date', 'date', { unique: false });
        completionsStore.createIndex('habitDate', ['habitId', 'date'], { unique: true });
      }

      // Settings store
      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      console.log('Database schema created/upgraded');
    };
  });
}

/**
 * Generic database transaction helper
 */
function transaction(storeName, mode = 'readonly') {
  if (!db) throw new Error('Database not initialized');
  return db.transaction(storeName, mode).objectStore(storeName);
}

// ============================================
// HABITS CRUD OPERATIONS
// ============================================

/**
 * Create a new habit
 * @param {Object} habit - Habit data
 * @returns {Promise<number>} - The new habit ID
 */
export async function createHabit(habit) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.HABITS, 'readwrite');
    const newHabit = {
      ...habit,
      createdAt: new Date().toISOString(),
      archived: false
    };
    
    const request = store.add(newHabit);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all habits
 * @param {boolean} includeArchived - Whether to include archived habits
 * @returns {Promise<Array>}
 */
export async function getAllHabits(includeArchived = false) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.HABITS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      let habits = request.result;
      if (!includeArchived) {
        habits = habits.filter(h => !h.archived);
      }
      // Sort by creation date (newest first) or custom order
      habits.sort((a, b) => (a.order || 0) - (b.order || 0));
      resolve(habits);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single habit by ID
 * @param {number} id - Habit ID
 * @returns {Promise<Object>}
 */
export async function getHabit(id) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.HABITS);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update a habit
 * @param {Object} habit - Habit data with ID
 * @returns {Promise<void>}
 */
export async function updateHabit(habit) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.HABITS, 'readwrite');
    const request = store.put(habit);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a habit and all its completions
 * @param {number} id - Habit ID
 * @returns {Promise<void>}
 */
export async function deleteHabit(id) {
  return new Promise(async (resolve, reject) => {
    try {
      // Delete completions first
      await deleteCompletionsForHabit(id);
      
      // Then delete the habit
      const store = transaction(STORES.HABITS, 'readwrite');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================
// COMPLETIONS CRUD OPERATIONS
// ============================================

/**
 * Toggle completion for a habit on a specific date
 * @param {number} habitId - Habit ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>} - New completion status
 */
export async function toggleCompletion(habitId, date) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.COMPLETIONS, 'readwrite');
    const index = store.index('habitDate');
    const request = index.get([habitId, date]);
    
    request.onsuccess = () => {
      if (request.result) {
        // Remove completion
        const deleteRequest = store.delete(request.result.id);
        deleteRequest.onsuccess = () => resolve(false);
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } else {
        // Add completion
        const addRequest = store.add({
          habitId,
          date,
          timestamp: new Date().toISOString(),
          value: 1
        });
        addRequest.onsuccess = () => resolve(true);
        addRequest.onerror = () => reject(addRequest.error);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get completion status for a habit on a specific date
 * @param {number} habitId - Habit ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>}
 */
export async function getCompletion(habitId, date) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.COMPLETIONS);
    const index = store.index('habitDate');
    const request = index.get([habitId, date]);
    
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all completions for a habit
 * @param {number} habitId - Habit ID
 * @returns {Promise<Array>}
 */
export async function getCompletionsForHabit(habitId) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.COMPLETIONS);
    const index = store.index('habitId');
    const request = index.getAll(habitId);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get completions for a habit within a date range
 * @param {number} habitId - Habit ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export async function getCompletionsInRange(habitId, startDate, endDate) {
  const completions = await getCompletionsForHabit(habitId);
  return completions.filter(c => c.date >= startDate && c.date <= endDate);
}

/**
 * Get all completions (for all habits)
 * @returns {Promise<Array>}
 */
export async function getAllCompletions() {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.COMPLETIONS);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all completions for a habit
 * @param {number} habitId - Habit ID
 * @returns {Promise<void>}
 */
export async function deleteCompletionsForHabit(habitId) {
  const completions = await getCompletionsForHabit(habitId);
  
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.COMPLETIONS, 'readwrite');
    let remaining = completions.length;
    
    if (remaining === 0) {
      resolve();
      return;
    }
    
    completions.forEach(completion => {
      const request = store.delete(completion.id);
      request.onsuccess = () => {
        remaining--;
        if (remaining === 0) resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}

// ============================================
// SETTINGS OPERATIONS
// ============================================

/**
 * Get a setting value
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if not found
 * @returns {Promise<*>}
 */
export async function getSetting(key, defaultValue = null) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.SETTINGS);
    const request = store.get(key);
    
    request.onsuccess = () => {
      resolve(request.result ? request.result.value : defaultValue);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Set a setting value
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.SETTINGS, 'readwrite');
    const request = store.put({ key, value });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all settings
 * @returns {Promise<Object>}
 */
export async function getAllSettings() {
  return new Promise((resolve, reject) => {
    const store = transaction(STORES.SETTINGS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const settings = {};
      request.result.forEach(item => {
        settings[item.key] = item.value;
      });
      resolve(settings);
    };
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// DATA EXPORT/IMPORT
// ============================================

/**
 * Export all data to JSON
 * @returns {Promise<Object>}
 */
export async function exportAllData() {
  const habits = await getAllHabits(true);
  const completions = await getAllCompletions();
  const settings = await getAllSettings();
  
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    habits,
    completions,
    settings
  };
}

/**
 * Export data to CSV format
 * @returns {Promise<string>}
 */
export async function exportToCSV() {
  const habits = await getAllHabits(true);
  const completions = await getAllCompletions();
  
  // Create completions lookup
  const completionsMap = {};
  completions.forEach(c => {
    if (!completionsMap[c.habitId]) {
      completionsMap[c.habitId] = new Set();
    }
    completionsMap[c.habitId].add(c.date);
  });
  
  // Get date range
  const allDates = completions.map(c => c.date).sort();
  const startDate = allDates[0] || formatDate(new Date());
  const endDate = formatDate(new Date());
  
  // Generate date array
  const dates = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  // Build CSV
  let csv = 'Habit,' + dates.join(',') + '\n';
  
  habits.forEach(habit => {
    const row = [habit.name];
    const habitCompletions = completionsMap[habit.id] || new Set();
    
    dates.forEach(date => {
      row.push(habitCompletions.has(date) ? '1' : '0');
    });
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

/**
 * Import data from JSON
 * @param {Object} data - Exported data object
 * @returns {Promise<void>}
 */
export async function importData(data) {
  if (!data.habits || !data.completions) {
    throw new Error('Invalid import data format');
  }
  
  // Clear existing data
  await clearAllData();
  
  // Import habits
  for (const habit of data.habits) {
    const { id, ...habitData } = habit;
    await createHabit(habitData);
  }
  
  // We need to re-map habit IDs since they might be different
  // For simplicity, this assumes habits are imported in the same order
  const newHabits = await getAllHabits(true);
  const habitIdMap = {};
  data.habits.forEach((oldHabit, index) => {
    if (newHabits[index]) {
      habitIdMap[oldHabit.id] = newHabits[index].id;
    }
  });
  
  // Import completions with mapped IDs
  for (const completion of data.completions) {
    const newHabitId = habitIdMap[completion.habitId];
    if (newHabitId) {
      const store = transaction(STORES.COMPLETIONS, 'readwrite');
      store.add({
        habitId: newHabitId,
        date: completion.date,
        timestamp: completion.timestamp,
        value: completion.value
      });
    }
  }
  
  // Import settings
  if (data.settings) {
    for (const [key, value] of Object.entries(data.settings)) {
      await setSetting(key, value);
    }
  }
}

/**
 * Clear all data
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.HABITS, STORES.COMPLETIONS, STORES.SETTINGS], 'readwrite');
    
    tx.objectStore(STORES.HABITS).clear();
    tx.objectStore(STORES.COMPLETIONS).clear();
    tx.objectStore(STORES.SETTINGS).clear();
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Export the formatDate utility
export { formatDate };
