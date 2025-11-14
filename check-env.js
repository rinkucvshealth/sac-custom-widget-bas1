/**
 * Check Environment Variables
 * Verifies that all required environment variables are set
 */

require('dotenv').config();

const requiredVars = [
  'SAP_HOST',
  'SAP_PORT',
  'SAP_CLIENT',
  'SAP_USERNAME',
  'SAP_PASSWORD',
  'OPENAI_API_KEY',
  'API_KEY'
];

const optionalVars = [
  'PORT',
  'NODE_ENV',
  'ALLOWED_ORIGIN',
  'LOG_LEVEL'
];

console.log('\n' + '='.repeat(60));
console.log('Environment Variables Check');
console.log('='.repeat(60) + '\n');

let allPresent = true;
const missing = [];
const present = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName.includes('PASSWORD') || varName.includes('KEY') ? '***set***' : value}`);
    present.push(varName);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    missing.push(varName);
    allPresent = false;
  }
});

console.log('\n' + '-'.repeat(60));
console.log('Optional Variables:');
console.log('-'.repeat(60));

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set (using default)`);
  }
});

console.log('\n' + '='.repeat(60));
if (allPresent) {
  console.log('✅ All required environment variables are set!');
  console.log('✅ Server should start successfully.');
} else {
  console.log('❌ Missing required environment variables:');
  missing.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please add these to your .env file:');
  console.log('\n# Add these missing variables to your .env file:');
  missing.forEach(varName => {
    if (varName === 'SAP_HOST') {
      console.log('SAP_HOST=vhssnds4ci.hec.sonos.com  # Your SAP hostname');
    } else if (varName === 'SAP_PORT') {
      console.log('SAP_PORT=44300  # Your SAP port (typically 44300 for HTTPS)');
    } else if (varName === 'SAP_CLIENT') {
      console.log('SAP_CLIENT=500  # Your SAP client number');
    } else if (varName === 'API_KEY') {
      console.log('API_KEY=your_api_key_here  # API key for authentication');
    } else {
      console.log(`${varName}=your_value_here`);
    }
  });
}
console.log('='.repeat(60) + '\n');

process.exit(allPresent ? 0 : 1);

