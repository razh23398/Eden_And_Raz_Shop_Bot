/**
 * Category detection and management
 */

// Categories mapping for automatic detection
const CATEGORIES = {
  'אוכל': ['קפה', 'ארוחה', 'מסעדה', 'פיצה', 'המבורגר', 'סושי', 'פלאפל', 'חומוס', 'שווארמה', 'לחם', 'חלב', 'גבינה', 'ביצים', 'פירות', 'ירקות'],
  'תחבורה': ['דלק', 'בנזין', 'אוטובוס', 'רכבת', 'טרמפ', 'מונית', 'גט', 'אובר', 'שטיפת רכב', 'חניה'],
  'קניות': ['סופר', 'רמי לוי', 'שופרסל', 'מגא', 'ויקטורי', 'קניון', 'זארה', 'h&m', 'קסטרו', 'ביגוד', 'נעליים'],
  'בילויים': ['קולנוע', 'בר', 'מועדון', 'קונצרט', 'תיאטרון', 'ספורט', 'כושר', 'חדר כושר', 'בריכה'],
  'בריאות': ['רופא', 'רפואה', 'בית מרקחת', 'תרופות', 'ויטמינים', 'דנטיסט', 'אופטומטריסט'],
  'חשבונות': ['חשמל', 'מים', 'גז', 'אינטרנט', 'טלפון', 'ביטוח', 'ארנונה', 'שכירות']
};

/**
 * Auto-detect category based on item name
 * @param {string} item - Item name to categorize
 * @returns {string} Detected category
 */
function detectCategory(item) {
  const itemLower = item.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => itemLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'אחר'; // Default category
}

/**
 * Parse expense input with optional manual category
 * Supports formats:
 * - "בננה 5" → auto-detect category
 * - "בננה 5 אוכל" → manual category
 * - "בננה 5 🍽️" → category by emoji
 * @param {string} text - Input text to parse
 * @returns {Object} Parsed expense {item, price, category, isManual}
 */
function parseExpenseWithCategory(text) {
  // Try format: "item price category" or "item price emoji"
  const manualMatch = text.match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)\s+(.+)$/);
  
  if (manualMatch) {
    const item = manualMatch[1].trim();
    const price = parseFloat(manualMatch[2]);
    const categoryInput = manualMatch[3].trim();
    
    // Check if it's a category by emoji
    const categoryByEmoji = getCategoryByEmoji(categoryInput);
    if (categoryByEmoji) {
      return {
        item,
        price,
        category: categoryByEmoji,
        isManual: true,
        isValid: true
      };
    }
    
    // Check if it's a valid category name
    const allCategories = getAllCategories();
    const foundCategory = allCategories.find(cat => 
      cat.toLowerCase() === categoryInput.toLowerCase()
    );
    
    if (foundCategory) {
      return {
        item,
        price,
        category: foundCategory,
        isManual: true,
        isValid: true
      };
    }
    
    // Invalid category, fallback to auto-detect
    return {
      item,
      price,
      category: detectCategory(item),
      isManual: false,
      isValid: true,
      warning: `קטגוריה "${categoryInput}" לא מוכרת. השתמשתי בזיהוי אוטומטי.`
    };
  }
  
  // Try basic format: "item price"
  const basicMatch = text.match(/^(.+?)\s+(\d+(?:\.\d{1,2})?)$/);
  
  if (basicMatch) {
    const item = basicMatch[1].trim();
    const price = parseFloat(basicMatch[2]);
    
    return {
      item,
      price,
      category: detectCategory(item),
      isManual: false,
      isValid: true
    };
  }
  
  return {
    isValid: false,
    error: 'פורמט לא חוקי. השתמש ב: "פריט מחיר" או "פריט מחיר קטגוריה"'
  };
}

/**
 * Get category by emoji
 * @param {string} emoji - Emoji to lookup
 * @returns {string|null} Category name or null
 */
function getCategoryByEmoji(emoji) {
  const emojiMap = {
    '🍽️': 'אוכל',
    '🚗': 'תחבורה', 
    '🛒': 'קניות',
    '🎯': 'בילויים',
    '💊': 'בריאות',
    '⚡': 'חשבונות',
    '📝': 'אחר'
  };
  
  return emojiMap[emoji] || null;
}

/**
 * Get emoji for category
 * @param {string} category - Category name
 * @returns {string} Category emoji
 */
function getCategoryEmoji(category) {
  const emojis = {
    'אוכל': '🍽️',
    'תחבורה': '🚗',
    'קניות': '🛒',
    'בילויים': '🎯',
    'בריאות': '💊',
    'חשבונות': '⚡',
    'אחר': '📝'
  };
  return emojis[category] || '📝';
}

/**
 * Get all available categories
 * @returns {Array} List of all categories
 */
function getAllCategories() {
  return Object.keys(CATEGORIES).concat(['אחר']);
}

/**
 * Get keywords for a specific category
 * @param {string} category - Category name
 * @returns {Array} Keywords for the category
 */
function getCategoryKeywords(category) {
  return CATEGORIES[category] || [];
}

/**
 * Get formatted list of all categories for help message
 * @returns {string} Formatted category list
 */
function getCategoryHelpText() {
  const categories = getAllCategories();
  return categories.map(cat => {
    const emoji = getCategoryEmoji(cat);
    return `${emoji} ${cat}`;
  }).join(' • ');
}

module.exports = {
  detectCategory,
  parseExpenseWithCategory,
  getCategoryByEmoji,
  getCategoryEmoji,
  getAllCategories,
  getCategoryKeywords,
  getCategoryHelpText,
  CATEGORIES
};
