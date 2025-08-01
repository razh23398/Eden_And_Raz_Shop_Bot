/**
 * Main application entry point
 * Eden & Raz Shop Bot - Modular Architecture
 */

// Load environment variables from .env.telegram file
require('dotenv').config({ path: '.env.telegram' });

const { getCurrentSheetName } = require('./src/utils/dateUtils');
const sheetsService = require('./src/services/sheetsService');
const telegramService = require('./src/services/telegramService');

// Startup message and configuration check
function displayStartupInfo() {
  console.log('🚀 בוט טלגרם להוצאות מתקדם מופעל!');
  console.log('📋 סטטוס סביבה:');
  console.log('- Telegram Token:', process.env.TELEGRAM_TOKEN ? '✅ מוגדר' : '❌ חסר');
  console.log('- Sheet ID:', process.env.SHEET_ID ? '✅ מוגדר' : '❌ חסר');
  console.log('- Google Credentials:', process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS ? '✅ מוגדר' : '❌ חסר');
  console.log(`📅 חודש נוכחי: ${getCurrentSheetName()}`);

  if (!process.env.TELEGRAM_TOKEN) {
    console.log('\n💡 להשגת Token:');
    console.log('1. פתח טלגרם וחפש @BotFather');
    console.log('2. שלח /newbot');
    console.log('3. תן שם לבוט');
    console.log('4. תן username לבוט');
    console.log('5. תקבל TOKEN - שים אותו ב-TELEGRAM_TOKEN');
  }

  console.log('\n🎯 תכונות:');
  console.log('• 📊 גליונות לפי חודשים');
  console.log('• 🎨 קטגוריות אוטומטיות');
  console.log('• 📈 דוחות מתקדמים');
  console.log('• 📊 השוואות חודשיות');
  console.log('• 📱 תפריט פקודות מורחב');

  console.log('\n🏗️ ארכיטקטורה מודולרית:');
  console.log('• Models: expenseModel, categoryModel');
  console.log('• Services: sheetsService, reportService, telegramService');
  console.log('• Handlers: messageHandler');
  console.log('• Utils: dateUtils');

  console.log('\n📱 הבוט מוכן לקבלת הודעות!');
  console.log('💡 נסה: דוח, השוואה, קטגוריות');
}

// Handle graceful shutdown
function setupGracefulShutdown() {
  process.on('SIGINT', () => {
    console.log('\n🛑 מכבה את הבוט...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 מכבה את הבוט...');
    process.exit(0);
  });
}

// Main application startup
async function main() {
  try {
    displayStartupInfo();
    setupGracefulShutdown();

    // Services are automatically initialized via their constructors
    // Bot is now ready to receive messages
    
    if (telegramService.isDemoMode() && sheetsService.isDemoMode()) {
      console.log('\n⚠️ רץ במצב דמו מלא - לא יישלחו הודעות ולא יישמרו נתונים');
    }
    
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

// Start the application
main();
