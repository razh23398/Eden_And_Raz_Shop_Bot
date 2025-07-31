const TelegramBot = require('node-telegram-bot-api');
const { google } = require('googleapis');

// Environment variables
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const SHEET_ID = process.env.SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

// In-memory storage for user locations
const userLocations = {};

// Initialize Google Sheets API
let sheets;
try {
  if (GOOGLE_SERVICE_ACCOUNT_CREDENTIALS && GOOGLE_SERVICE_ACCOUNT_CREDENTIALS !== 'undefined') {
    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API initialized successfully');
  } else {
    console.log('⚠️ Google Sheets credentials not provided - running in demo mode');
  }
} catch (error) {
  console.error('Error initializing Google Sheets API:', error.message);
  console.log('⚠️ Running without Google Sheets integration');
}

// Create bot instance
const bot = TELEGRAM_TOKEN ? 
  new TelegramBot(TELEGRAM_TOKEN, { polling: true }) : 
  null;

if (bot) {
  console.log('🤖 בוט טלגרם מופעל!');
} else {
  console.log('⚠️ TELEGRAM_TOKEN חסר - רץ במצב דמו');
}

// Handle text messages
if (bot) {
  bot.on('message', async (msg) => {
    try {
      await handleMessage(msg);
    } catch (error) {
      console.error('Error handling message:', error);
      await sendTelegramMessage(msg.chat.id, '❌ אירעה שגיאה. אנא נסה שוב.');
    }
  });

  // Handle location messages
  bot.on('location', async (msg) => {
    try {
      await handleLocation(msg);
    } catch (error) {
      console.error('Error handling location:', error);
      await sendTelegramMessage(msg.chat.id, '❌ שגיאה בשמירת המיקום.');
    }
  });
}

// Central message handler function
async function handleMessage(msg) {
  const text = msg.text;
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  console.log(`📨 הודעה מ-${msg.from.first_name} (${userId}): ${text}`);

  // Check for commands (Hebrew and English)
  if (text && (text.toLowerCase() === 'דוח' || text.toLowerCase() === 'report')) {
    await handleReportCommand(chatId);
    return;
  }

  // Check for help command
  if (text && (text.toLowerCase() === '/start' || text.toLowerCase() === 'עזרה' || text.toLowerCase() === 'help')) {
    await sendHelpMessage(chatId);
    return;
  }

  // Try to parse expense (e.g., "חלב 7.50" or "קפה 15.25")
  if (text) {
    const expenseMatch = text.match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/);
    
    if (expenseMatch) {
      const item = expenseMatch[1].trim();
      const price = parseFloat(expenseMatch[2]);
      
      // Get stored location for this user (if any)
      const location = userLocations[userId] || null;
      
      // Prepare data for Google Sheets
      const timestamp = new Date().toISOString();
      const locationString = location ? `${location.latitude},${location.longitude}` : '';
      
      // Save to Google Sheets
      const success = await appendToSheet([timestamp, item, price, locationString, msg.from.first_name || 'Unknown']);
      
      if (success) {
        // Clear stored location after use
        delete userLocations[userId];
        
        // Send confirmation message
        await sendTelegramMessage(chatId, `✅ נרשם: ${item} ב-₪${price.toFixed(2)}`);
      } else {
        await sendTelegramMessage(chatId, '❌ שגיאה בשמירת ההוצאה. נסה שוב.');
      }
    } else {
      // Send help message
      await sendHelpMessage(chatId);
    }
  }
}

// Handle location messages
async function handleLocation(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const location = msg.location;
  
  // Store location temporarily for this user
  userLocations[userId] = {
    latitude: location.latitude,
    longitude: location.longitude
  };
  
  await sendTelegramMessage(chatId, '📍 המיקום נשמר. עכשיו שלח את פרטי ההוצאה.');
}

// Function to handle report command
async function handleReportCommand(chatId) {
  try {
    const reportData = await readFromSheet();
    
    if (!reportData || reportData.length === 0) {
      await sendTelegramMessage(chatId, '📊 עדיין לא נרשמו הוצאות.');
      return;
    }

    // Calculate totals and generate report
    let totalAmount = 0;
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    let todayTotal = 0;
    let monthTotal = 0;
    let recentExpenses = [];

    reportData.forEach(row => {
      if (row.length >= 3) {
        const timestamp = new Date(row[0]);
        const item = row[1];
        const price = parseFloat(row[2]) || 0;
        const userName = row[4] || 'לא ידוע';
        
        totalAmount += price;
        
        // Today's total
        if (timestamp.toDateString() === today) {
          todayTotal += price;
        }
        
        // This month's total
        if (timestamp.getMonth() === thisMonth && timestamp.getFullYear() === thisYear) {
          monthTotal += price;
        }
        
        // Recent expenses (last 5)
        if (recentExpenses.length < 5) {
          recentExpenses.push(`• ${item}: ₪${price.toFixed(2)} (${userName})`);
        }
      }
    });

    const report = 
      `📊 *דוח הוצאות*\n\n` +
      `💰 *היום:* ₪${todayTotal.toFixed(2)}\n` +
      `📅 *החודש:* ₪${monthTotal.toFixed(2)}\n` +
      `💳 *כל הזמן:* ₪${totalAmount.toFixed(2)}\n\n` +
      `📝 *הוצאות אחרונות:*\n${recentExpenses.join('\n')}\n\n` +
      `סה"כ רשומות: ${reportData.length}`;

    await sendTelegramMessage(chatId, report);
  } catch (error) {
    console.error('Error generating report:', error);
    await sendTelegramMessage(chatId, '❌ שגיאה ביצירת דוח. אנא נסה שוב.');
  }
}

// Function to send help message
async function sendHelpMessage(chatId) {
  const helpText = 
    '🤖 *בוט ניהול הוצאות*\n\n' +
    '📝 *איך לרשום הוצאה:*\n' +
    'שלח הודעה בפורמט: `פריט מחיר`\n\n' +
    '*דוגמאות:*\n' +
    '• `קפה 15.50`\n' +
    '• `ארוחת צהריים 45`\n' +
    '• `סופר 120.75`\n\n' +
    '📍 *להוספת מיקום:*\n' +
    '1. שלח מיקום\n' +
    '2. שלח את ההוצאה\n\n' +
    '📊 *לקבלת דוח:*\n' +
    'שלח `דוח` או `report`\n\n' +
    '❓ לעזרה: `/start`';
    
  await sendTelegramMessage(chatId, helpText);
}

// Function to append data to Google Sheets
async function appendToSheet(values) {
  try {
    if (!sheets) {
      console.log('📝 Demo mode: Would save to sheet:', values);
      return true; // Return true in demo mode
    }

    const request = {
      spreadsheetId: SHEET_ID,
      range: 'A:E', // Columns A-E for timestamp, item, price, location, user
      valueInputOption: 'RAW',
      resource: {
        values: [values]
      }
    };

    const response = await sheets.spreadsheets.values.append(request);
    console.log('Data appended to sheet:', response.data);
    return true;
  } catch (error) {
    console.error('Error appending to sheet:', error.message);
    return false;
  }
}

// Function to read data from Google Sheets
async function readFromSheet() {
  try {
    if (!sheets) {
      console.log('📊 Demo mode: Returning sample data');
      // Return sample data for demo
      return [
        [new Date().toISOString(), 'קפה', '15.50', '', 'דמו'],
        [new Date(Date.now() - 86400000).toISOString(), 'ארוחת צהריים', '45.00', '32.08,34.78', 'דמו']
      ];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'A:E',
    });

    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from sheet:', error.message);
    return null;
  }
}

// Function to send Telegram messages
async function sendTelegramMessage(chatId, text) {
  try {
    if (!bot) {
      console.log('📱 Demo mode: Would send Telegram message to', chatId);
      console.log('Message:', text);
      return true; // Return true in demo mode
    }

    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    console.log('Message sent successfully to', chatId);
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    return false;
  }
}

// Error handling
if (bot) {
  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });
}

// Startup message
console.log('🚀 בוט טלגרם להוצאות מופעל!');
console.log('📋 סטטוס סביבה:');
console.log('- Telegram Token:', TELEGRAM_TOKEN ? '✅ מוגדר' : '❌ חסר');
console.log('- Sheet ID:', SHEET_ID ? '✅ מוגדר' : '❌ חסר');
console.log('- Google Credentials:', GOOGLE_SERVICE_ACCOUNT_CREDENTIALS ? '✅ מוגדר' : '❌ חסר');

if (!TELEGRAM_TOKEN) {
  console.log('\n💡 להשגת Token:');
  console.log('1. פתח טלגרם וחפש @BotFather');
  console.log('2. שלח /newbot');
  console.log('3. תן שם לבוט');
  console.log('4. תן username לבוט');
  console.log('5. תקבל TOKEN - שים אותו ב-TELEGRAM_TOKEN');
}

console.log('\n📱 הבוט מוכן לקבלת הודעות!');
