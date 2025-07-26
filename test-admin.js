const crypto = require('crypto');

// Test admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_SECRET_KEY = 'AnweshRath123!';

// Generate password hash
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const passwordHash = hashPassword(ADMIN_SECRET_KEY);

console.log('🔐 Admin Authentication Test');
console.log('============================');
console.log(`Username: ${ADMIN_USERNAME}`);
console.log(`Password: ${ADMIN_SECRET_KEY}`);
console.log(`Password Hash: ${passwordHash}`);
console.log('\n📝 Vercel Environment Variables:');
console.log(`ADMIN_USERNAME=${ADMIN_USERNAME}`);
console.log(`ADMIN_SECRET_KEY=${ADMIN_SECRET_KEY}`);
console.log('\n✅ Test the login with these credentials in admin.html');
console.log('✅ You can change the password from the Security tab');
console.log('\n🚀 Ready to deploy!'); 