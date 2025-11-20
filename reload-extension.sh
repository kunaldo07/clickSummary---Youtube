#!/bin/bash

# Quick Extension Reload Helper
# This script helps you reload the Chrome extension after making changes

echo "🔄 Chrome Extension Reload Helper"
echo "=================================="
echo ""
echo "✅ Backend changes saved to background.js"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Find 'ClickSummary: AI YouTube Summarizer'"
echo "3. Click the reload button (🔄)"
echo "4. Refresh any YouTube tabs (F5)"
echo "5. Try the extension again"
echo ""
echo "🔍 To verify the fix:"
echo "   - On chrome://extensions/, click 'service worker' under ClickSummary"
echo "   - Check console for: '🔗 API URL: http://localhost:3001/api'"
echo "   - Should show 'DEVELOPMENT' mode"
echo ""
echo "💡 Quick test:"
echo "   curl http://localhost:3001/api/health"
echo ""

# Test if backend is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:3001"
else
    echo "❌ Backend is NOT running!"
    echo "   Start it with: cd backend && npm start"
fi

echo ""
echo "Press Enter to continue..."
read
