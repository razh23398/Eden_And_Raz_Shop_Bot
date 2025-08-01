/**
 * Expense data model and validation
 */

const { detectCategory } = require('./categoryModel');
const { getDateComponents } = require('../utils/dateUtils');

/**
 * Create expense object from user input
 * @param {string} item - Item name
 * @param {number} price - Item price
 * @param {string} userName - User's name
 * @param {Object} location - Location coordinates {latitude, longitude}
 * @returns {Object} Expense object
 */
function createExpense(item, price, userName, location = null) {
  const dateInfo = getDateComponents();
  const category = detectCategory(item);
  const locationString = location ? `${location.latitude},${location.longitude}` : '';

  return {
    timestamp: dateInfo.timestamp,
    item: item.trim(),
    price: parseFloat(price),
    category,
    location: locationString,
    user: userName || 'Unknown',
    dayOfMonth: dateInfo.dayOfMonth,
    weekOfMonth: dateInfo.weekOfMonth
  };
}

/**
 * Convert expense object to sheet row array
 * @param {Object} expense - Expense object
 * @returns {Array} Row data for Google Sheets
 */
function expenseToSheetRow(expense) {
  return [
    expense.timestamp,
    expense.item,
    expense.price,
    expense.category,
    expense.location,
    expense.user,
    expense.dayOfMonth,
    expense.weekOfMonth
  ];
}

/**
 * Convert sheet row to expense object
 * @param {Array} row - Sheet row data
 * @returns {Object} Expense object
 */
function sheetRowToExpense(row) {
  if (!row || row.length < 3) return null;

  return {
    timestamp: row[0],
    item: row[1],
    price: parseFloat(row[2]) || 0,
    category: row[3] || 'אחר',
    location: row[4] || '',
    user: row[5] || 'Unknown',
    dayOfMonth: parseInt(row[6]) || 1,
    weekOfMonth: parseInt(row[7]) || 1
  };
}

/**
 * Validate expense data
 * @param {string} item - Item name
 * @param {string} priceStr - Price as string
 * @returns {Object} Validation result {isValid, error, item, price}
 */
function validateExpense(item, priceStr) {
  if (!item || item.trim().length === 0) {
    return { isValid: false, error: 'שם הפריט לא יכול להיות רק' };
  }

  const price = parseFloat(priceStr);
  if (isNaN(price) || price <= 0) {
    return { isValid: false, error: 'המחיר חייב להיות מספר חיובי' };
  }

  if (price > 10000) {
    return { isValid: false, error: 'המחיר גבוה מדי (מעל ₪10,000)' };
  }

  return {
    isValid: true,
    item: item.trim(),
    price: price
  };
}

/**
 * Get sheet headers for expense data
 * @returns {Array} Headers for Google Sheets
 */
function getSheetHeaders() {
  return ['זמן', 'פריט', 'מחיר', 'קטגוריה', 'מיקום', 'משתמש', 'יום בחודש', 'שבוע'];
}

module.exports = {
  createExpense,
  expenseToSheetRow,
  sheetRowToExpense,
  validateExpense,
  getSheetHeaders
};
