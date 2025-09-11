// Quick script to update subscription middleware to remove quarterly references
const fs = require('fs');

const middlewarePath = '/Users/kbadole/Documents/projects/youtube-extension-2/backend/middleware/subscription.js';
let content = fs.readFileSync(middlewarePath, 'utf8');

// Simplify valid plans - remove quarterly, only basic plan now needs monthly
content = content.replace(
  `      const validPlans = {
        'basic': ['monthly', 'quarterly'],
        'premium': ['quarterly']
      };`,
  `      const validPlans = {
        'basic': ['monthly'], // Simplified - only monthly plan available
        'premium': ['monthly'] // Premium also uses monthly plan
      };`
);

// Remove quarterly from plan limits
content = content.replace(
  `    },
    quarterly: {
      summariesPerMonth: 150,
      chatQueriesPerMonth: 300
    }`,
  `    }
    // Removed quarterly plan limits - only monthly available now`
);

fs.writeFileSync(middlewarePath, content);
console.log('✅ Updated subscription middleware to remove quarterly references');
