/**
 * Report generation service
 */

const { getCurrentSheetName, getLastMonthName, isToday } = require('../utils/dateUtils');
const { getCategoryEmoji } = require('../models/categoryModel');
const { sheetRowToExpense } = require('../models/expenseModel');
const sheetsService = require('./sheetsService');

class ReportService {
  /**
   * Generate comprehensive monthly report
   * @param {number} chatId - Telegram chat ID
   * @returns {string} Formatted report
   */
  async generateMonthlyReport(chatId) {
    try {
      const currentSheet = getCurrentSheetName();
      const reportData = await sheetsService.readSheet(currentSheet);
      
      if (!reportData || reportData.length <= 1) {
        return `📊 עדיין לא נרשמו הוצאות ב-${currentSheet}.`;
      }

      // Skip header row and convert to expense objects
      const expenses = reportData.slice(1).map(row => sheetRowToExpense(row)).filter(exp => exp);
      
      if (expenses.length === 0) {
        return `📊 עדיין לא נרשמו הוצאות ב-${currentSheet}.`;
      }

      const analysis = this.analyzeExpenses(expenses);
      const currentDate = new Date();
      const monthName = currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

      return this.formatMonthlyReport(monthName, analysis, expenses);
    } catch (error) {
      console.error('Error generating monthly report:', error);
      return '❌ שגיאה ביצירת דוח. אנא נסה שוב.';
    }
  }

  /**
   * Generate comparison report with previous month
   * @param {number} chatId - Telegram chat ID
   * @returns {string} Formatted comparison
   */
  async generateComparisonReport(chatId) {
    try {
      const currentSheet = getCurrentSheetName();
      const lastSheet = getLastMonthName();
      
      const currentData = await sheetsService.readSheet(currentSheet);
      const lastData = await sheetsService.readSheet(lastSheet);
      
      if (!currentData || currentData.length <= 1) {
        return `📊 אין נתונים לחודש הנוכחי (${currentSheet}).`;
      }
      
      const currentTotal = this.calculateTotal(currentData.slice(1));
      const lastTotal = lastData && lastData.length > 1 ? this.calculateTotal(lastData.slice(1)) : 0;
      
      return this.formatComparisonReport(currentSheet, lastSheet, currentTotal, lastTotal);
    } catch (error) {
      console.error('Error generating comparison report:', error);
      return '❌ שגיאה ביצירת השוואה.';
    }
  }

  /**
   * Generate category breakdown report
   * @param {number} chatId - Telegram chat ID
   * @returns {string} Formatted category report
   */
  async generateCategoryReport(chatId) {
    try {
      const currentSheet = getCurrentSheetName();
      const reportData = await sheetsService.readSheet(currentSheet);
      
      if (!reportData || reportData.length <= 1) {
        return `📊 עדיין לא נרשמו הוצאות ב-${currentSheet}.`;
      }

      const expenses = reportData.slice(1).map(row => sheetRowToExpense(row)).filter(exp => exp);
      const categoryAnalysis = this.analyzeCategoriesByExpenses(expenses);
      
      return this.formatCategoryReport(currentSheet, categoryAnalysis);
    } catch (error) {
      console.error('Error generating category report:', error);
      return '❌ שגיאה ביצירת דוח קטגוריות.';
    }
  }

  /**
   * Analyze expenses and return summary
   * @param {Array} expenses - Array of expense objects
   * @returns {Object} Analysis results
   */
  analyzeExpenses(expenses) {
    let totalAmount = 0;
    let todayTotal = 0;
    const categoryTotals = {};
    const weeklyTotals = {};
    const recentExpenses = [];

    expenses.forEach(expense => {
      totalAmount += expense.price;
      
      // Category totals
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.price;
      
      // Weekly totals
      weeklyTotals[expense.weekOfMonth] = (weeklyTotals[expense.weekOfMonth] || 0) + expense.price;
      
      // Today's total
      if (isToday(new Date(expense.timestamp))) {
        todayTotal += expense.price;
      }
      
      // Recent expenses (last 5)
      if (recentExpenses.length < 5) {
        const categoryEmoji = getCategoryEmoji(expense.category);
        recentExpenses.push(`${categoryEmoji} ${expense.item}: ₪${expense.price.toFixed(2)} (${expense.user})`);
      }
    });

    return {
      totalAmount,
      todayTotal,
      categoryTotals,
      weeklyTotals,
      recentExpenses,
      expenseCount: expenses.length
    };
  }

  /**
   * Analyze categories with additional metrics
   * @param {Array} expenses - Array of expense objects
   * @returns {Object} Category analysis
   */
  analyzeCategoriesByExpenses(expenses) {
    const categoryTotals = {};
    const categoryCount = {};
    let totalAmount = 0;

    expenses.forEach(expense => {
      const category = expense.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.price;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
      totalAmount += expense.price;
    });

    return { categoryTotals, categoryCount, totalAmount };
  }

  /**
   * Calculate total from sheet rows
   * @param {Array} rows - Sheet rows
   * @returns {number} Total amount
   */
  calculateTotal(rows) {
    return rows.reduce((total, row) => {
      if (row.length >= 3) {
        return total + (parseFloat(row[2]) || 0);
      }
      return total;
    }, 0);
  }

  /**
   * Format monthly report
   * @param {string} monthName - Month name
   * @param {Object} analysis - Analysis results
   * @param {Array} expenses - Expense array
   * @returns {string} Formatted report
   */
  formatMonthlyReport(monthName, analysis, expenses) {
    // Generate category breakdown
    let categoryBreakdown = '';
    Object.entries(analysis.categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, amount]) => {
        const emoji = getCategoryEmoji(category);
        const percentage = ((amount / analysis.totalAmount) * 100).toFixed(1);
        categoryBreakdown += `${emoji} ${category}: ₪${amount.toFixed(2)} (${percentage}%)\n`;
      });

    // Generate weekly breakdown
    let weeklyBreakdown = '';
    Object.entries(analysis.weeklyTotals)
      .sort(([a], [b]) => a - b)
      .forEach(([week, amount]) => {
        weeklyBreakdown += `שבוע ${week}: ₪${amount.toFixed(2)}\n`;
      });

    const currentDate = new Date();
    const dailyAverage = (analysis.totalAmount / currentDate.getDate()).toFixed(2);

    return `📊 *דוח ${monthName}*\n\n` +
           `💰 *סיכום כספי:*\n` +
           `• היום: ₪${analysis.todayTotal.toFixed(2)}\n` +
           `• החודש: ₪${analysis.totalAmount.toFixed(2)}\n` +
           `• ממוצע יומי: ₪${dailyAverage}\n\n` +
           `📈 *פילוח לפי קטגוריות:*\n${categoryBreakdown}\n` +
           `📅 *פילוח לפי שבועות:*\n${weeklyBreakdown}\n` +
           `📝 *הוצאות אחרונות:*\n${analysis.recentExpenses.join('\n')}\n\n` +
           `סה"כ רשומות: ${analysis.expenseCount}`;
  }

  /**
   * Format comparison report
   * @param {string} currentSheet - Current month sheet
   * @param {string} lastSheet - Last month sheet
   * @param {number} currentTotal - Current month total
   * @param {number} lastTotal - Last month total
   * @returns {string} Formatted comparison
   */
  formatComparisonReport(currentSheet, lastSheet, currentTotal, lastTotal) {
    const difference = currentTotal - lastTotal;
    const percentageChange = lastTotal > 0 ? ((difference / lastTotal) * 100).toFixed(1) : 0;
    const trend = difference > 0 ? '⬆️' : difference < 0 ? '⬇️' : '➡️';
    const changeText = difference > 0 ? `+₪${difference.toFixed(2)}` : `₪${difference.toFixed(2)}`;
    
    return `📈 *השוואה חודשית*\n\n` +
           `📅 *${currentSheet}:* ₪${currentTotal.toFixed(2)}\n` +
           `📅 *${lastSheet}:* ₪${lastTotal.toFixed(2)}\n\n` +
           `${trend} *שינוי:* ${changeText} (${percentageChange}%)\n\n` +
           (difference > 0 ? 
             `⚠️ הוצאת יותר השבוע!` : 
             difference < 0 ? 
             `🎉 חסכת השבוע!` : 
             `➡️ הוצאה דומה לחודש שעבר`);
  }

  /**
   * Format category report
   * @param {string} currentSheet - Current sheet name
   * @param {Object} analysis - Category analysis
   * @returns {string} Formatted category report
   */
  formatCategoryReport(currentSheet, analysis) {
    let categoryReport = `📊 *דוח קטגוריות - ${currentSheet}*\n\n`;
    
    Object.entries(analysis.categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, amount]) => {
        const emoji = getCategoryEmoji(category);
        const percentage = ((amount / analysis.totalAmount) * 100);
        const count = analysis.categoryCount[category];
        const avgPerTransaction = (amount / count).toFixed(2);
        
        // Create visual bar (10 chars max)
        const barLength = Math.round(percentage / 10);
        const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
        
        categoryReport += 
          `${emoji} *${category}*\n` +
          `${bar} ${percentage.toFixed(1)}%\n` +
          `💰 ₪${amount.toFixed(2)} (${count} פעמים)\n` +
          `📊 ממוצע: ₪${avgPerTransaction}\n\n`;
      });

    categoryReport += `💳 *סה"כ:* ₪${analysis.totalAmount.toFixed(2)}`;
    return categoryReport;
  }
}

// Export singleton instance
module.exports = new ReportService();
