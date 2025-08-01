/**
 * Message handlers for different types of user input
 */

const { createExpense, expenseToSheetRow, validateExpense } = require('../models/expenseModel');
const { getCategoryEmoji, parseExpenseWithCategory, getCategoryHelpText } = require('../models/categoryModel');
const { getCurrentSheetName } = require('../utils/dateUtils');
const sheetsService = require('../services/sheetsService');
const reportService = require('../services/reportService');

// In-memory storage for user locations
const userLocations = {};

class MessageHandler {
  /**
   * Handle incoming text messages
   * @param {Object} msg - Telegram message object
   * @param {Function} sendMessage - Function to send telegram messages
   */
  async handleTextMessage(msg, sendMessage) {
    try {
      const text = msg.text;
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      console.log(`📨 הודעה מ-${msg.from.first_name} (${userId}): ${text}`);

      // Check for commands
      if (await this.handleCommands(text, chatId, sendMessage)) {
        return;
      }

      // Try to parse expense
      await this.handleExpenseInput(text, msg, chatId, userId, sendMessage);
    } catch (error) {
      console.error('Error handling text message:', error);
      await sendMessage(msg.chat.id, '❌ אירעה שגיאה. אנא נסה שוב.');
    }
  }

  /**
   * Handle location messages
   * @param {Object} msg - Telegram message object
   * @param {Function} sendMessage - Function to send telegram messages
   */
  async handleLocationMessage(msg, sendMessage) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const location = msg.location;
      
      // Store location temporarily for this user
      userLocations[userId] = {
        latitude: location.latitude,
        longitude: location.longitude
      };
      
      await sendMessage(chatId, '📍 המיקום נשמר. עכשיו שלח את פרטי ההוצאה.');
    } catch (error) {
      console.error('Error handling location:', error);
      await sendMessage(msg.chat.id, '❌ שגיאה בשמירת המיקום.');
    }
  }

  /**
   * Handle various commands
   * @param {string} text - Message text
   * @param {number} chatId - Chat ID
   * @param {Function} sendMessage - Function to send messages
   * @returns {boolean} True if command was handled
   */
  async handleCommands(text, chatId, sendMessage) {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    // Report command
    if (lowerText === 'דוח' || lowerText === 'report') {
      const report = await reportService.generateMonthlyReport(chatId);
      await sendMessage(chatId, report);
      return true;
    }

    // Comparison command
    if (lowerText === 'השוואה' || lowerText === 'compare') {
      const comparison = await reportService.generateComparisonReport(chatId);
      await sendMessage(chatId, comparison);
      return true;
    }

    // Category command
    if (lowerText === 'קטגוריות' || lowerText === 'categories') {
      const categoryReport = await reportService.generateCategoryReport(chatId);
      await sendMessage(chatId, categoryReport);
      return true;
    }

    // Help command
    if (lowerText === '/start' || lowerText === 'עזרה' || lowerText === 'help') {
      await this.sendHelpMessage(chatId, sendMessage);
      return true;
    }

    return false;
  }

  /**
   * Handle expense input parsing and saving
   * @param {string} text - Message text
   * @param {Object} msg - Full message object
   * @param {number} chatId - Chat ID
   * @param {number} userId - User ID
   * @param {Function} sendMessage - Function to send messages
   */
  async handleExpenseInput(text, msg, chatId, userId, sendMessage) {
    if (!text) {
      await this.sendHelpMessage(chatId, sendMessage);
      return;
    }

    // Parse expense with optional manual category
    const parseResult = parseExpenseWithCategory(text);
    
    if (!parseResult.isValid) {
      await sendMessage(chatId, `❌ ${parseResult.error}`);
      return;
    }

    // Additional validation
    const validation = validateExpense(parseResult.item, parseResult.price.toString());
    if (!validation.isValid) {
      await sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    // Get stored location for this user (if any)
    const location = userLocations[userId] || null;
    const userName = msg.from.first_name || 'Unknown';

    // Create expense object with parsed category
    const expense = createExpense(parseResult.item, parseResult.price, userName, location);
    // Override category with parsed one
    expense.category = parseResult.category;
    
    const categoryEmoji = getCategoryEmoji(expense.category);

    // Convert to sheet row and save
    const rowData = expenseToSheetRow(expense);
    const currentSheet = getCurrentSheetName();
    const success = await sheetsService.appendExpense(rowData, currentSheet);

    if (success) {
      // Clear stored location after use
      delete userLocations[userId];
      
      // Enhanced confirmation message
      let confirmMessage = `✅ נרשם: ${expense.item} ב-₪${expense.price.toFixed(2)}\n` +
                          `${categoryEmoji} קטגוריה: ${expense.category}`;
      
      if (parseResult.isManual) {
        confirmMessage += ' (ידני)';
      } else {
        confirmMessage += ' (אוטומטי)';
      }
      
      confirmMessage += `\n📅 גליון: ${currentSheet}`;
      
      // Add warning if category was corrected
      if (parseResult.warning) {
        confirmMessage += `\n⚠️ ${parseResult.warning}`;
      }
      
      await sendMessage(chatId, confirmMessage);
    } else {
      await sendMessage(chatId, '❌ שגיאה בשמירת ההוצאה. נסה שוב.');
    }
  }

  /**
   * Send help message to user
   * @param {number} chatId - Chat ID
   * @param {Function} sendMessage - Function to send messages
   */
  async sendHelpMessage(chatId, sendMessage) {
    const categoryList = getCategoryHelpText();
    
    const helpText = 
      '🤖 *בוט ניהול הוצאות מתקדם*\n\n' +
      '📝 *דרכים לרשום הוצאה:*\n\n' +
      '🔹 *זיהוי אוטומטי:*\n' +
      '`קפה 15.50` ← הבוט יזהה כאוכל\n' +
      '`דלק 120` ← הבוט יזהה כתחבורה\n\n' +
      '🔹 *קטגוריה ידנית:*\n' +
      '`בננה 8 אוכל` ← ציון קטגוריה בטקסט\n' +
      '`בננה 8 🍽️` ← ציון קטגוריה באימוג׳י\n\n' +
      '🎯 *קטגוריות זמינות:*\n' +
      `${categoryList}\n\n` +
      '📊 *פקודות דוחות:*\n' +
      '• `דוח` - דוח חודשי מפורט\n' +
      '• `השוואה` - השוואה לחודש שעבר\n' +
      '• `קטגוריות` - פילוח לפי קטגוריות\n\n' +
      '📍 *להוספת מיקום:*\n' +
      '1. שלח מיקום 📍\n' +
      '2. שלח את ההוצאה\n\n' +
      '💡 *טיפים:*\n' +
      '• הזיהוי האוטומטי חכם אבל לא מושלם\n' +
      '• השתמש בקטגוריה ידנית לדיוק מלא\n' +
      '• אימוג׳ים מהירים יותר מטקסט\n\n' +
      '📅 *מבנה חדש:* כל חודש נשמר בגליון נפרד!\n' +
      '❓ לעזרה: `/start`';
      
    await sendMessage(chatId, helpText);
  }
}

// Export singleton instance
module.exports = new MessageHandler();
