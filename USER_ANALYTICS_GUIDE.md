# 📊 User Analytics & Data Tracking Guide

## Overview
The YouTube Summarizer now includes comprehensive user analytics and sign-in tracking to provide insights into user behavior, device usage, and platform performance.

## 🎯 What Data is Tracked

### **User Profile Data**
- `googleId`: Unique Google identifier
- `email`: User's email address
- `name`: User's display name
- `picture`: Profile picture URL
- `role`: User role (`user`, `admin`, `creator`)
- `subscription`: Plan details and status

### **Sign-In Analytics**
- `lastLoginAt`: Last sign-in timestamp
- `lastActiveAt`: Last activity timestamp
- `signInHistory`: Detailed log of recent sign-ins (last 50 entries)
- `analytics.totalSignIns`: Total number of sign-ins
- `analytics.firstSignInAt`: First sign-in date

### **Device & Browser Tracking**
- `analytics.deviceInfo.lastDevice`: Device type (Desktop, Mobile, Tablet)
- `analytics.deviceInfo.lastBrowser`: Browser name (Chrome, Firefox, Safari, etc.)
- `analytics.deviceInfo.lastOS`: Operating system (Windows, macOS, Linux, etc.)

### **Sign-In History Details**
Each sign-in event records:
- `timestamp`: When the sign-in occurred
- `method`: Sign-in method (`google_oauth`)
- `ipAddress`: User's IP address (admin-only access)
- `userAgent`: Full browser user agent string

## 🛡️ Privacy & Security

### **User Privacy Protection**
- **IP addresses** are only accessible to admins
- Regular users can only see their device/browser info
- Sign-in history is limited to last 50 entries
- No personally identifiable information beyond email/name

### **Data Retention**
- Sign-in history: Last 50 entries per user
- Analytics data: Persistent for account lifetime
- User can request data deletion (admin functionality)

## 🔧 Implementation Details

### **Automatic Tracking**
Every sign-in automatically records:
1. **Timestamp** and **method**
2. **Device information** parsed from User-Agent
3. **IP address** for security monitoring
4. **Browser and OS** detection
5. **Total sign-in counter** increment

### **Database Schema**
```javascript
// MongoDB User Model
{
  // ... existing user fields
  lastLoginAt: Date,
  lastActiveAt: Date,
  signInHistory: [{
    timestamp: Date,
    method: String,
    ipAddress: String,
    userAgent: String
  }],
  analytics: {
    totalSignIns: Number,
    firstSignInAt: Date,
    deviceInfo: {
      lastDevice: String,
      lastBrowser: String,
      lastOS: String
    }
  }
}
```

### **Method: recordSignIn(req)**
Called automatically on every successful authentication:
```javascript
user.recordSignIn(req);  // Tracks everything automatically
await user.save();       // Persist to database
```

## 📊 Available Analytics Endpoints

### **User Analytics** (Self-access)
```
GET /api/auth/profile/analytics
```
**Returns:**
- Total sign-ins count
- First sign-in date
- Last login timestamp
- Current device info
- Recent sign-ins (last 10, no IP addresses)

### **Admin User Analytics**
```
GET /api/auth/admin/user-analytics/:userId
```
**Returns:**
- Complete user analytics
- Full sign-in history (last 20)
- IP addresses included
- Device/browser breakdown

### **Platform Analytics** (Admin-only)
```
GET /api/auth/admin/platform-analytics
```
**Returns:**
- Total users count
- Active subscribers
- Users active in last 30 days
- New users this month
- Popular browsers/devices

## 🔍 User Agent Parsing

### **Browser Detection**
- Chrome, Firefox, Safari, Edge, Opera
- Fallback: "Unknown"

### **Operating System Detection**
- Windows, macOS, Linux, Android, iOS
- Fallback: "Unknown"

### **Device Type Detection**
- Desktop, Mobile, Tablet
- Based on User-Agent patterns

## 💻 Development vs Production

### **MongoDB (Production)**
- Full analytics tracking
- Persistent data storage
- MongoDB aggregation for platform stats

### **DevUser (Development)**
- In-memory storage
- Same analytics structure
- Perfect for testing

## 🚀 Usage Examples

### **Backend: Recording Sign-In**
```javascript
// Automatic in auth routes
if (user) {
  user.recordSignIn(req);  // ✅ All tracking happens here
  await user.save();
}
```

### **Frontend: Fetching User Analytics**
```javascript
// Get user's own analytics
const response = await fetch('/api/auth/profile/analytics', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { analytics } = await response.json();
```

### **Admin: Platform Analytics**
```javascript
// Get platform-wide statistics
const response = await fetch('/api/auth/admin/platform-analytics', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const { analytics } = await response.json();
```

## 📈 Analytics Dashboard Ideas

### **User Profile Page**
- "Member since" date
- Total sign-ins counter
- Current device/browser
- Recent activity timeline

### **Admin Dashboard**
- User growth charts
- Browser/device usage statistics
- Active users tracking
- Geographic distribution (IP-based)

## ⚙️ Server Configuration

### **IP Address Tracking**
Server configured with `trust proxy` for accurate IP capture:
```javascript
app.set('trust proxy', true);  // Required for req.ip
```

### **Privacy Compliance**
- IP addresses restricted to admin access only
- User can view their own analytics without sensitive data
- GDPR-friendly data structure

## 🎯 Benefits

### **For Users**
- Transparency into their account activity
- Security monitoring of sign-ins
- Usage statistics

### **For Admins**
- User behavior insights
- Platform growth tracking
- Security monitoring
- Device/browser optimization decisions

### **For Development**
- Feature usage analytics
- Performance optimization insights
- User experience improvements

---

**🔒 Security Note:** All analytics data is captured server-side and requires authentication. IP addresses and sensitive tracking data are only accessible to administrators to protect user privacy while maintaining security oversight.
