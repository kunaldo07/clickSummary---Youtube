// Quick script to update Subscription.js to remove quarterly references
const fs = require('fs');

const subscriptionModelPath = '/Users/kbadole/Documents/projects/youtube-extension-2/backend/models/Subscription.js';
let content = fs.readFileSync(subscriptionModelPath, 'utf8');

// Replace the enum line
content = content.replace(
  "enum: ['free', 'monthly', 'quarterly'],",
  "enum: ['free', 'monthly'], // Removed quarterly - simplified to Free and Monthly only"
);

// Update billing amount (remove quarterly)
content = content.replace(
  `subscriptionSchema.methods.getBillingAmount = function() {
  const plans = {
    monthly: 1000, // ₹10 in paise
    quarterly: 2400 // ₹24 in paise
  };`,
  `subscriptionSchema.methods.getBillingAmount = function() {
  const plans = {
    monthly: 1000 // $10 in cents (simplified to monthly only)
    // Removed quarterly plan
  };`
);

// Update end date calculation (remove quarterly logic)
content = content.replace(
  `    if (this.planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (this.planType === 'quarterly') {
      endDate.setMonth(endDate.getMonth() + 3);
    }`,
  `    if (this.planType === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    // Removed quarterly logic - only monthly plan now`
);

fs.writeFileSync(subscriptionModelPath, content);
console.log('✅ Updated Subscription.js to remove quarterly references');
