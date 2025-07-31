// דמו של בוט טלגרם עם משתני סביבה בסיסיים
process.env.TELEGRAM_TOKEN = ''; // רק לדמו - בפועל תכניס כאן את ה-TOKEN
process.env.SHEET_ID = '';
process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS = '';

console.log('🤖 מפעיל בוט טלגרם לניהול הוצאות במצב דמו...\n');

// טוען את הבוט
require('./telegram-bot.js');

// מונע מהתהליך לצאת
process.on('SIGINT', () => {
  console.log('\n👋 סגירת הבוט...');
  process.exit(0);
});
