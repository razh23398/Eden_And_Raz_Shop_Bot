# Eden & Raz Shop Bot - Modular Architecture

## 🏗️ Project Structure

```
MoneytAgent/
├── app.js                     # Main entry point
├── telegram-bot.js            # Legacy monolithic version (backup)
├── package.json
├── .env.telegram             # Environment variables
├── .gitignore
├── Procfile                  # Deployment config
├── UPGRADE_LOG.md           # Version history
├── 
└── src/                     # Modular source code
    ├── models/              # Data models and business logic
    │   ├── categoryModel.js     # Category detection & management
    │   └── expenseModel.js      # Expense data model & validation
    ├── services/            # External service integrations
    │   ├── sheetsService.js     # Google Sheets API service
    │   ├── reportService.js     # Report generation service
    │   └── telegramService.js   # Telegram Bot API service
    ├── handlers/            # Message and event handlers
    │   └── messageHandler.js    # Text & location message handling
    └── utils/               # Utility functions
        └── dateUtils.js         # Date operations for monthly sheets
```

## 🎯 Modular Benefits

### ✅ **Separation of Concerns**
- **Models**: Data structure and validation logic
- **Services**: External API integrations  
- **Handlers**: User interaction logic
- **Utils**: Shared utility functions

### ✅ **Maintainability** 
- Each file has a single responsibility
- Easy to locate and fix bugs
- Simple to add new features
- Clear dependency management

### ✅ **Testability**
- Each module can be tested independently
- Mock services for unit testing
- Clear interfaces between components

### ✅ **Scalability**
- Easy to add new message handlers
- Simple to extend with new services
- Modular deployment options

## 📦 Module Descriptions

### **app.js** - Main Entry Point
- Application startup and configuration
- Service initialization coordination
- Graceful shutdown handling
- Environment status display

### **Models Layer**

#### **categoryModel.js**
- Category detection algorithm
- Emoji mapping for categories
- Category keyword management
- Auto-categorization logic

#### **expenseModel.js**
- Expense data structure definition
- Input validation and sanitization
- Sheet row conversion utilities
- Data transformation helpers

### **Services Layer**

#### **sheetsService.js**
- Google Sheets API integration
- Monthly sheet creation and management
- Data persistence operations
- Demo mode simulation

#### **reportService.js**
- Monthly report generation
- Category analysis and breakdowns
- Comparison calculations
- Visual chart formatting

#### **telegramService.js**
- Telegram Bot API integration
- Message sending and formatting
- Event handler coordination
- Error handling and recovery

### **Handlers Layer**

#### **messageHandler.js**
- Text message parsing and routing
- Command recognition and execution
- Expense input validation
- Location message processing

### **Utils Layer**

#### **dateUtils.js**
- Monthly sheet name generation
- Date component extraction
- Time-based calculations
- Date validation utilities

## 🚀 Usage

### **Development**
```bash
npm run dev        # Run with modular architecture
npm run legacy     # Run legacy monolithic version
```

### **Production**
```bash
npm start          # Uses modular app.js
```

### **Environment Variables**
```
TELEGRAM_TOKEN=your-bot-token
SHEET_ID=your-google-sheet-id
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS=your-service-account-json
```

## 🔄 Migration Notes

- **Legacy Support**: Original `telegram-bot.js` kept as backup
- **Backward Compatible**: Same functionality, better structure
- **Gradual Migration**: Services initialize independently
- **Error Isolation**: Module failures don't crash entire app

## 🛠️ Adding New Features

### **New Command**
1. Add command logic to `messageHandler.js`
2. Add report generation to `reportService.js` if needed
3. Update help text

### **New Service**
1. Create service in `src/services/`
2. Import in `app.js` or relevant handler
3. Add initialization logic

### **New Data Field**
1. Update `expenseModel.js` structure
2. Modify `sheetsService.js` column mapping
3. Update report calculations in `reportService.js`

## 📊 Performance Benefits

- **Lazy Loading**: Services only load when needed
- **Memory Efficiency**: Smaller, focused modules
- **Faster Debugging**: Isolated components
- **Better Caching**: Service-level optimizations

This modular structure makes the codebase much more professional and maintainable! 🏆
