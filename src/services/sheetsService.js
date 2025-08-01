/**
 * Google Sheets service for data persistence
 */

const { google } = require('googleapis');
const { getCurrentSheetName } = require('../utils/dateUtils');
const { getSheetHeaders } = require('../models/expenseModel');

class SheetsService {
  constructor() {
    this.sheets = null;
    this.sheetId = process.env.SHEET_ID;
    this.isDemo = false;
    
    this.initialize();
  }

  /**
   * Initialize Google Sheets API
   */
  initialize() {
    try {
      const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
      
      if (credentials && credentials !== 'undefined') {
        const auth = new google.auth.GoogleAuth({
          credentials: JSON.parse(credentials),
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        this.sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets API initialized successfully');
      } else {
        console.log('⚠️ Google Sheets credentials not provided - running in demo mode');
        this.isDemo = true;
      }
    } catch (error) {
      console.error('Error initializing Google Sheets API:', error.message);
      console.log('⚠️ Running without Google Sheets integration');
      this.isDemo = true;
    }
  }

  /**
   * Ensure monthly sheet exists, create if not
   * @param {string} sheetName - Sheet name (YYYY-MM format)
   */
  async ensureMonthlySheet(sheetName) {
    try {
      if (this.isDemo) return true;

      // Try to access the sheet
      await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: `${sheetName}!A1`,
      });
      
      console.log(`✅ Sheet ${sheetName} exists`);
    } catch (error) {
      // Sheet doesn't exist, create it
      console.log(`📝 Creating new sheet: ${sheetName}`);
      await this.createMonthlySheet(sheetName);
    }
  }

  /**
   * Create a new monthly sheet with headers
   * @param {string} sheetName - Sheet name to create
   */
  async createMonthlySheet(sheetName) {
    try {
      if (this.isDemo) return true;

      // Add new sheet
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.sheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });

      // Add headers to the new sheet
      const headers = [getSheetHeaders()];
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: `${sheetName}!A1:H1`,
        valueInputOption: 'RAW',
        resource: {
          values: headers
        }
      });

      console.log(`✅ Created new monthly sheet: ${sheetName}`);
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error.message);
      throw error;
    }
  }

  /**
   * Append expense data to sheet
   * @param {Array} rowData - Expense data as array
   * @param {string} sheetName - Target sheet name
   * @returns {boolean} Success status
   */
  async appendExpense(rowData, sheetName = null) {
    try {
      const targetSheet = sheetName || getCurrentSheetName();
      
      if (this.isDemo) {
        console.log(`📝 Demo mode: Would save to sheet ${targetSheet}:`, rowData);
        return true;
      }

      // Ensure sheet exists
      await this.ensureMonthlySheet(targetSheet);

      const request = {
        spreadsheetId: this.sheetId,
        range: `${targetSheet}!A:H`,
        valueInputOption: 'RAW',
        resource: {
          values: [rowData]
        }
      };

      const response = await this.sheets.spreadsheets.values.append(request);
      console.log(`Data appended to sheet ${targetSheet}:`, response.data);
      return true;
    } catch (error) {
      console.error(`Error appending to sheet ${targetSheet}:`, error.message);
      return false;
    }
  }

  /**
   * Read data from sheet
   * @param {string} sheetName - Sheet name to read from
   * @returns {Array} Sheet data
   */
  async readSheet(sheetName = null) {
    try {
      const targetSheet = sheetName || getCurrentSheetName();
      
      if (this.isDemo) {
        console.log(`📊 Demo mode: Returning sample data for ${targetSheet}`);
        return [
          getSheetHeaders(),
          [new Date().toISOString(), 'קפה', '15.50', 'אוכל', '', 'עדן', '31', '5'],
          [new Date(Date.now() - 86400000).toISOString(), 'דלק', '120.00', 'תחבורה', '32.08,34.78', 'רז', '30', '5']
        ];
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetId,
        range: `${targetSheet}!A:H`,
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`Error reading from sheet ${targetSheet}:`, error.message);
      return null;
    }
  }

  /**
   * Check if service is in demo mode
   * @returns {boolean} True if in demo mode
   */
  isDemoMode() {
    return this.isDemo;
  }
}

// Export singleton instance
module.exports = new SheetsService();
