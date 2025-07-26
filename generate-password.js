const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Usage: node generate-password.js <your-password>
const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate-password.js <your-password>');
  console.log('Example: node generate-password.js mySecurePassword123');
  process.exit(1);
}

const hash = hashPassword(password);
console.log('\n🔐 Admin Credentials Setup');
console.log('========================');
console.log(`Username: admin`);
console.log(`Password: ${password}`);
console.log(`Password Hash: ${hash}`);
console.log('\n📝 Add these to your Vercel environment variables:');
console.log('ADMIN_USERNAME=admin');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('\n⚠️  Keep your password secure and never share it!'); 