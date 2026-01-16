# 🚀 Quick Start Guide - Reddit AI Analyzer v2.0

## Installation (5 Minutes)

### 1. Build the Extension

```bash
cd /Users/kbadole/Documents/projects/youtube-extension-2/reddit-extension-v2
npm install
npm run build
```

### 2. Load in Chrome

1. Open Chrome and go to: **`chrome://extensions/`**
2. Turn on **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select: 
   ```
   /Users/kbadole/Documents/projects/youtube-extension-2/reddit-extension-v2/dist
   ```
5. Click **"Select"**

### 3. Test It!

1. Go to any Reddit thread:
   - https://www.reddit.com/r/programming/
   - Click any post to open comments

2. Look for the AI toolbar below Reddit's header

3. Click **"🚀 Analyze"** to get:
   - Thread summary
   - Key points
   - Insights
   - Interactive chat

## ✨ Features

### Native Integration
- Toolbar appears **below Reddit's header** (not floating/modal)
- Panel pushes content down inline
- Matches Reddit's design language
- Survives page navigation

### AI Models Available
- **GPT-4o Mini**: Fast & cheap (~$0.001/analysis)
- **GPT-4o**: Most capable
- **GPT-4 Turbo**: Balanced performance

### Analysis Types
- **📊 Summary**: Quick overview + key points
- **💬 Chat**: Ask follow-up questions about the thread

## 🎯 Usage Examples

### Summary Mode
1. Select "Summary" button
2. Click "Analyze"
3. View structured results:
   - Thread Summary (2-3 sentences)
   - Key Points (5-7 bullets)
   - Insights (unique perspectives)

### Chat Mode
After analyzing, ask questions like:
- "What do people recommend?"
- "Summarize the top criticisms"
- "Any security concerns mentioned?"
- "What's the consensus?"

## 🐛 Troubleshooting

### Toolbar Not Appearing

**Check 1**: Are you on a thread page?
```
✅ https://www.reddit.com/r/programming/comments/abc123/...
❌ https://www.reddit.com/r/programming/ (homepage)
```

**Check 2**: Open DevTools Console (F12)
- Look for: "🚀 Reddit AI Analyzer: Initializing..."
- Check for error messages

**Check 3**: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Reddit AI Analyzer"
3. Click the refresh icon (🔄)
4. Refresh Reddit page (F5)

### Build Errors

```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build
```

### Development Mode

For hot reload during development:

```bash
npm run dev
```

Then:
1. Make changes to source files
2. Click refresh on `chrome://extensions/`
3. Reload Reddit page to test

## 📁 What Got Built

The `dist/` folder contains:
- `content.js` (153KB) - Injected into Reddit pages
- `background.js` (4KB) - Handles API calls
- `manifest.json` - Extension configuration
- `icons/` - Extension icons

## 🔧 Configuration

API key is in: `src/utils/config.ts`

```typescript
export const CONFIG = {
  OPENAI_API_KEY: 'sk-proj-...',
  DEFAULT_MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 2000,
  MAX_COMMENTS: 50,
};
```

## 📊 Performance

- **Toolbar injection**: <100ms
- **Thread extraction**: <200ms
- **AI analysis**: 2-5 seconds (depends on model)

## 💰 API Costs

With GPT-4o Mini:
- Per summary: ~$0.001-0.003
- Per chat message: ~$0.0001-0.0005
- **Monthly** (50 threads + 200 questions): ~$0.25-0.50

## 🎨 UI Design

### Toolbar
- Located below Reddit header
- Contains: Model selector + Mode buttons + Analyze button
- Max width: 1280px (matches Reddit content width)

### Panel
- Appears below toolbar
- Pushes Reddit content down (not overlaying)
- Contains: Summary + Key Points + Chat interface
- Draggable and resizable

### Style Isolation
Uses Shadow DOM to prevent:
- Reddit CSS from breaking our UI
- Our CSS from affecting Reddit

## 🚀 Next Steps

### Make Changes
1. Edit files in `src/`
2. Run `npm run build`
3. Reload extension in Chrome
4. Test on Reddit

### Deploy
1. Remove hardcoded API key (use Chrome storage)
2. Build for production: `npm run build`
3. Create ZIP: `cd dist && zip -r ../extension.zip *`
4. Upload to Chrome Web Store

## 📝 File Structure

```
reddit-extension-v2/
├── src/
│   ├── content/index.tsx    ← Injects toolbar into Reddit
│   ├── background/index.ts  ← Handles OpenAI API calls
│   ├── ui/
│   │   ├── App.tsx          ← Main React app
│   │   └── components/      ← Toolbar, Panel, Chat, etc.
│   ├── utils/
│   │   ├── config.ts        ← Configuration & API key
│   │   └── redditExtractor.ts ← DOM parsing
│   └── types/               ← TypeScript interfaces
├── dist/                    ← Built extension (load this in Chrome)
└── README.md               ← Full documentation
```

## 💡 Tips

1. **Model Selection**: Start with GPT-4o Mini for speed and cost
2. **Thread Length**: Works best with 10-50 comments
3. **Question Format**: Be specific in chat queries
4. **Navigation**: Extension auto-reloads when you navigate to new threads

## 🔗 Useful Links

- Chrome Extensions: `chrome://extensions/`
- Service Worker Console: Click "service worker" link under extension
- React DevTools: Install for debugging React components

---

**Ready to analyze Reddit threads like a pro? Load the extension and visit any thread! 🎉**
