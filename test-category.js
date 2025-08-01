const { parseExpenseWithCategory, getCategoryByEmoji } = require('./src/models/categoryModel');

console.log('=== Testing Category Functions ===');

// Test emoji detection
console.log('\n1. Testing emoji detection:');
const testEmojis = ['🍽️', '🚗', '🛒'];
testEmojis.forEach(emoji => {
  const result = getCategoryByEmoji(emoji);
  console.log(`${emoji} -> ${result}`);
});

// Test parsing with different formats
console.log('\n2. Testing parsing functions:');

const testCases = [
  'בננה 8',              // Auto-detect
  'בננה 8 אוכל',         // Manual text
  'בננה 8 🍽️',          // Manual emoji
  'דלק 120',             // Auto-detect
  'דלק 120 תחבורה',      // Manual text
  'דלק 120 🚗'           // Manual emoji
];

testCases.forEach(testCase => {
  console.log(`\nInput: "${testCase}"`);
  const result = parseExpenseWithCategory(testCase);
  console.log('Result:', JSON.stringify(result, null, 2));
});
