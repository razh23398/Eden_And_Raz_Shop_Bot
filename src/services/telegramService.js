/**
 * Telegram Bot service - main bot instance management
 */

const TelegramBot = require('node-telegram-bot-api');
const messageHandler = require('../handlers/messageHandler');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.token = process.env.TELEGRAM_TOKEN;
    this.isDemo = false;
    
    this.initialize();
  }

  /**
   * Initialize Telegram bot
   */
  initialize() {
    if (this.token) {
      this.bot = new TelegramBot(this.token, { polling: true });
      this.setupEventHandlers();
      console.log('🤖 בוט טלגרם מופעל!');
    } else {
      console.log('⚠️ TELEGRAM_TOKEN חסר - רץ במצב דמו');
      this.isDemo = true;
    }
  }

  /**
   * Setup event handlers for the bot
   */
  setupEventHandlers() {
    if (!this.bot) return;

    // Handle text messages
    this.bot.on('message', async (msg) => {
      if (msg.text) {
        await messageHandler.handleTextMessage(msg, this.sendMessage.bind(this));
      }
    });

    // Handle location messages
    this.bot.on('location', async (msg) => {
      await messageHandler.handleLocationMessage(msg, this.sendMessage.bind(this));
    });

    // Handle polling errors
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  /**
   * Send message to Telegram chat
   * @param {number} chatId - Chat ID
   * @param {string} text - Message text
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
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
      console.log('Message sent successfully to', chatId);
      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error.message);
      return false;
    }
  }

  /**
   * Check if bot is in demo mode
   * @returns {boolean} True if in demo mode
   */
  isDemoMode() {
    return this.isDemo;
  }

  /**
   * Get bot instance (for advanced usage)
   * @returns {TelegramBot|null} Bot instance
   */
  getBotInstance() {
    return this.bot;
  }
}

// Export singleton instance
module.exports = new TelegramBotService();
