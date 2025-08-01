/**
 * Date utilities for monthly sheet management
 */

/**
 * Get current sheet name in YYYY-MM format
 * @returns {string} Current month sheet name
 */
function getCurrentSheetName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get last month sheet name in YYYY-MM format
 * @returns {string} Last month sheet name
 */
function getLastMonthName() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get date components for expense tracking
 * @param {Date} date - Date to process (defaults to now)
 * @returns {Object} Date components
 */
function getDateComponents(date = new Date()) {
  return {
    timestamp: date.toISOString(),
    dayOfMonth: date.getDate(),
    weekOfMonth: Math.ceil(date.getDate() / 7),
    monthName: date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  };
}

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

module.exports = {
  getCurrentSheetName,
  getLastMonthName,
  getDateComponents,
  isToday
};
