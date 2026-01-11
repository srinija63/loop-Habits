/**
 * Utility Functions for Loop Habits
 */

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's date at midnight
 * @returns {Date}
 */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Check if two dates are the same day
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  return formatDate(date1) === formatDate(date2);
}

/**
 * Check if a date is today
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isToday(date) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return isSameDay(d, getToday());
}

/**
 * Check if a date is in the future
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isFuture(date) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return d > getToday();
}

/**
 * Check if a date is in the past
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isPast(date) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return d < getToday();
}

/**
 * Get day name (short)
 * @param {Date} date
 * @returns {string}
 */
export function getDayName(date, short = true) {
  const days = short 
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Get month name
 * @param {Date} date
 * @param {boolean} short
 * @returns {string}
 */
export function getMonthName(date, short = false) {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[date.getMonth()];
}

/**
 * Format date for display
 * @param {Date|string} date
 * @param {boolean} includeYear
 * @returns {string}
 */
export function formatDateDisplay(date, includeYear = false) {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const today = getToday();
  
  if (isSameDay(d, today)) {
    return 'Today';
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(d, yesterday)) {
    return 'Yesterday';
  }
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(d, tomorrow)) {
    return 'Tomorrow';
  }
  
  const month = getMonthName(d, true);
  const day = d.getDate();
  
  if (includeYear || d.getFullYear() !== today.getFullYear()) {
    return `${month} ${day}, ${d.getFullYear()}`;
  }
  
  return `${month} ${day}`;
}

/**
 * Get the start of the week containing the given date
 * @param {Date} date
 * @param {number} startDay - 0 for Sunday, 1 for Monday
 * @returns {Date}
 */
export function getWeekStart(date, startDay = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get an array of dates for a week
 * @param {Date} weekStart
 * @returns {Date[]}
 */
export function getWeekDates(weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

/**
 * Get calendar days for a month (including padding days)
 * @param {number} year
 * @param {number} month - 0-indexed
 * @param {number} startDay - 0 for Sunday, 1 for Monday
 * @returns {Array<{date: Date|null, isCurrentMonth: boolean}>}
 */
export function getCalendarDays(year, month, startDay = 0) {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Add padding days from previous month
  const firstDayOfWeek = firstDay.getDay();
  const paddingBefore = (firstDayOfWeek - startDay + 7) % 7;
  
  for (let i = paddingBefore - 1; i >= 0; i--) {
    const date = new Date(firstDay);
    date.setDate(date.getDate() - i - 1);
    days.push({ date, isCurrentMonth: false });
  }
  
  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  // Add padding days from next month
  const paddingAfter = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= paddingAfter; i++) {
    const date = new Date(lastDay);
    date.setDate(date.getDate() + i);
    days.push({ date, isCurrentMonth: false });
  }
  
  return days;
}

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func
 * @param {number} limit
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Download a file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} type - MIME type
 */
export function downloadFile(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read a file as text
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Clamp a number between min and max
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Linear interpolation
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Format a percentage
 * @param {number} value - Value between 0 and 1
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercent(value, decimals = 0) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Check if running as PWA
 * @returns {boolean}
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Check if device is iOS
 * @returns {boolean}
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Check if device is Android
 * @returns {boolean}
 */
export function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

/**
 * Check if device is mobile
 * @returns {boolean}
 */
export function isMobile() {
  return isIOS() || isAndroid() || window.innerWidth < 768;
}

/**
 * Vibrate device (if supported)
 * @param {number|number[]} pattern
 */
export function vibrate(pattern = 10) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get contrasting text color for a background
 * @param {string} hexColor - Background color in hex
 * @returns {string} - 'white' or 'black'
 */
export function getContrastColor(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Adjust color brightness
 * @param {string} hexColor
 * @param {number} amount - Positive to lighten, negative to darken
 * @returns {string}
 */
export function adjustColor(hexColor, amount) {
  const hex = hexColor.replace('#', '');
  
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  r = clamp(r + amount, 0, 255);
  g = clamp(g + amount, 0, 255);
  b = clamp(b + amount, 0, 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
