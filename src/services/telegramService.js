// src/services/telegramService.js -- גרסה מותאמת ל-Lambda

const TelegramBot = require('node-telegram-bot-api');
const messageHandler = require('../handlers/messageHandler');

class TelegramBotService {
  constructor() {
    this.token = process.env.TELEGRAM_TOKEN;
    this.isDemo = !this.token;

    if (this.token) {
      // ✅ שינוי 1: הסרנו את { polling: true }.
      // הבוט נוצר אבל לא מתחיל להאזין באופן אקטיבי.
      this.bot = new TelegramBot(this.token);
      console.log('🤖 Telegram Bot Service Initialized for Webhook.');
    } else {
      console.log('⚠️ TELEGRAM_TOKEN חסר - רץ במצב דמו');
    }
  }

  // ✅ שינוי 2: הסרנו את הפונקציה setupEventHandlers. היא לא נחוצה יותר.

  /**
   * ✅ שינוי 3: הוספנו פונקציה חדשה שתטפל בעדכון בודד.
   * פונקציית ה-Lambda תקרא לפונקציה הזו ותעביר לה את המידע מטלגרם.
   * @param {object} update - אובייקט העדכון המלא שהגיע מטלגרם.
   */
  async processUpdate(update) {
    if (this.isDemo) {
      console.log('Received update in demo mode:', update);
      return;
    }

    // אובייקט העדכון מכיל את ההודעה.
    const msg = update.message || update.edited_message;
    
    if (!msg) {
      console.log('No message found in the update, skipping.');
      return;
    }

    // עכשיו, במקום להסתמך על this.bot.on(...), אנחנו מנתבים את ההודעה ידנית
    // ל-handler המתאים שכבר כתבת.
    if (msg.text) {
      await messageHandler.handleTextMessage(msg, this.sendMessage.bind(this));
    } else if (msg.location) {
      await messageHandler.handleLocationMessage(msg, this.sendMessage.bind(this));
    }
    // אפשר להוסיף כאן טיפול בסוגי הודעות נוספים אם תרצה בעתיד.
  }

  /**
   * פונקציה זו נשארת בדיוק כפי שהיא. היא מצוינת.
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      if (this.isDemo) {
        console.log('📱 Demo mode: Would send Telegram message to', chatId);
        console.log('Message:', text);
        return true;
      }

      const defaultOptions = { parse_mode: 'Markdown' };
      const finalOptions = { ...defaultOptions, ...options };

      await this.bot.sendMessage(chatId, text, finalOptions);
      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error.message);
      return false;
    }
  }

  isDemoMode() {
    return this.isDemo;
  }

  getBotInstance() {
    return this.bot;
  }
}

// Export singleton instance
module.exports = new TelegramBotService();