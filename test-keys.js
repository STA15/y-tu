require('ts-node/register');
const { apiKeyStore } = require('./src/services/apiKeyStore.service');

console.log('\n🔑 Available API Keys:\n');
const allKeys = [];

// Access the private keys Map using reflection
const keysMap = apiKeyStore['keys'];
for (const [key, apiKey] of keysMap.entries()) {
  console.log(`${apiKey.tier} Tier: ${key}`);
  allKeys.push({ tier: apiKey.tier, key: key });
}

console.log('\n📋 Copy one of these keys for testing!\n');