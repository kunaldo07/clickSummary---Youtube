// Quick fix for syntax error in payment.js
const fs = require('fs');

const paymentPath = '/Users/kbadole/Documents/projects/youtube-extension-2/backend/routes/payment.js';
let content = fs.readFileSync(paymentPath, 'utf8');

// Fix the broken express.Router() line
content = content.replace(
  'const router = express.\n();',
  'const router = express.Router();'
);

fs.writeFileSync(paymentPath, content);
console.log('✅ Fixed syntax error in payment.js');
