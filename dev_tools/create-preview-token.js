const crypto = require('crypto');

const token = crypto.randomBytes(18).toString('base64url');
const domain = process.env.DOMAIN || 'your-domain.co.nz';

console.log('\nClient preview created:');
console.log(`https://${domain}/preview/${token}`);
console.log('\nThe URL is the client access link. Keep it private.\n');
