# Developer API Key Setup Guide

## 🔑 Setting Up Your OpenAI API Key

Since the extension now uses your API key to provide free summaries to users, you need to configure your OpenAI API key in the extension code.

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Keep this key secure and private!**

### Step 2: Add Your API Key to the Extension

1. Open `background.js` in your code editor
2. Find these lines (appears 3 times in the file):
   ```javascript
   const apiKey = 'sk-YOUR_API_KEY_HERE'; // TODO: Replace with your actual OpenAI API key
   ```
3. Replace `sk-YOUR_API_KEY_HERE` with your actual API key:
   ```javascript
   const apiKey = 'sk-proj-abcdef1234567890...'; // Your actual API key
   ```

### Step 3: Security Considerations

⚠️ **Important Security Notes:**

#### Option 1: Hardcoded Key (Simple but Less Secure)
- Replace the placeholder with your actual key in `background.js`
- ✅ Easy to implement
- ❌ API key is visible in the extension files
- ❌ Not recommended for public distribution

#### Option 2: Backend Service (Recommended for Production)
For a production SaaS service, consider setting up a backend:

1. Create a server endpoint (e.g., `https://your-api.com/summarize`)
2. Store your OpenAI API key on the server
3. Modify the extension to call your server instead of OpenAI directly
4. Your server handles the OpenAI API calls

Example server endpoint structure:
```javascript
// Your server endpoint
app.post('/api/summarize', async (req, res) => {
  const { transcript, type, length, format } = req.body;
  
  // Call OpenAI API with your server-side key
  const summary = await callOpenAI(transcript, YOUR_SECRET_API_KEY);
  
  res.json({ summary });
});
```

Then modify `background.js` to call your server:
```javascript
// Instead of calling OpenAI directly
const response = await fetch('https://your-api.com/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transcript, type, length, format })
});
```

### Step 4: Cost Management

#### Expected Costs
- GPT-5 nano: ~$0.0001-0.0003 per summary
- Average user: 10-50 summaries/month
- Cost per user: $0.001-0.015/month
- 1000 active users: $1-15/month

#### Cost Control Strategies
1. **Rate Limiting**: Limit summaries per user per day
2. **Caching**: Cache summaries for 24+ hours (already implemented)
3. **Usage Analytics**: Monitor API usage via OpenAI dashboard
4. **User Tiers**: Free tier with limits, premium tier unlimited

### Step 5: Monitor Usage

1. Check your OpenAI usage dashboard regularly
2. Set up billing alerts in OpenAI
3. Monitor extension error logs
4. Consider implementing usage analytics

### Step 6: Distribution Options

#### For Personal/Limited Use
- Hardcode your API key and share the extension
- Monitor costs and usage manually

#### For Public SaaS
- Set up a backend service with your API key
- Implement user authentication/limits
- Consider monetization strategies

## 🚀 Quick Start Commands

After setting up your API key:

```bash
# Test the extension
1. Add your API key to background.js
2. Load extension in Chrome
3. Go to YouTube video
4. Check if summaries generate

# Monitor costs
1. Visit OpenAI usage dashboard
2. Set billing alerts
3. Track daily/monthly usage
```

## 📊 Business Model Ideas

Since you're providing free AI summaries:

1. **Freemium**: Free basic summaries, premium features (exports, analytics)
2. **Ads**: Monetize through relevant educational content ads
3. **Enterprise**: Sell team/organization licenses
4. **Data Insights**: Aggregate learning insights (anonymized)
5. **Premium Speed**: Faster processing for premium users

## ⚠️ Important Notes

- Never commit your actual API key to version control
- Use environment variables or secure config files
- Regularly rotate your API keys
- Monitor for unusual usage patterns
- Consider implementing abuse protection

---

Your extension now provides a premium experience to users at no cost to them, while you control the AI service quality and costs!

