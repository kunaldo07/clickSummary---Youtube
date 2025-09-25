# 🌐 GoDaddy DNS Setup for ClickSummary

## 🎯 **Goal**
Set up DNS so `https://clicksummary.com` (non-www) serves your frontend and www redirects to non-www.

## 📋 **Current Problem**
- ❌ `clicksummary.com` → Points to backend API (returns 405 error)
- ✅ `www.clicksummary.com` → Points to frontend S3/CloudFront (works correctly)

---

## 🛠️ **GoDaddy DNS Configuration**

### **Step 1: Log into GoDaddy**
1. Go to [GoDaddy.com](https://godaddy.com) and sign in
2. Click **My Products** → **All Products and Services**
3. Find `clicksummary.com` → click **DNS**

### **Step 2: Find Your CloudFront Domain**
From your working www version, get the CloudFront domain:
```bash
# Run this to find your CloudFront domain
dig www.clicksummary.com
```
Look for something like: `dxxxxx.cloudfront.net`

### **Step 3: Update DNS Records**

#### **Option A: CNAME Approach (Preferred)**
```
Type: CNAME
Name: @
Value: dxxxxx.cloudfront.net
TTL: 1 Hour
```

If GoDaddy doesn't allow CNAME for root domain, try **Option B**.

#### **Option B: A Record + Forwarding**
1. **Keep existing A record for root domain**
2. **Set up Domain Forwarding:**
   - In GoDaddy DNS, look for "Forwarding" section
   - Set: `clicksummary.com` → `https://www.clicksummary.com`
   - Type: **301 Permanent Redirect**

#### **Update WWW Record:**
```
Type: CNAME
Name: www  
Value: clicksummary.com
TTL: 1 Hour
```

### **Step 4: Create API Subdomain**
```
Type: A
Name: api
Value: [YOUR_BACKEND_SERVER_IP]
TTL: 1 Hour
```

### **Step 5: Update CloudFront (if using Option A)**
1. Go to **AWS CloudFront Console**
2. Edit your distribution
3. Under **Alternate domain names (CNAMEs)** add:
   - `clicksummary.com`
   - `www.clicksummary.com`
4. Update SSL certificate to cover both domains

---

## 🧪 **Testing After Changes**

Wait 1-2 hours for DNS propagation, then test:

```bash
# Should serve your frontend
curl -I https://clicksummary.com/

# Should redirect to non-www
curl -I https://www.clicksummary.com/

# Should serve your API
curl -I https://api.clicksummary.com/api/health
```

---

## 🚀 **Expected Results**

After DNS propagation:
- ✅ `https://clicksummary.com` → Serves your React frontend
- ✅ `https://www.clicksummary.com` → Redirects to non-www
- ✅ `https://api.clicksummary.com` → Serves your backend API
- ✅ All canonical URLs point to non-www version

---

## 🆘 **If You Get Stuck**

### **GoDaddy Support Options:**
1. **Live Chat:** Available 24/7 for DNS help
2. **Phone Support:** Call GoDaddy customer service
3. **Help Center:** Search "DNS management" or "CNAME setup"

### **Common Issues:**
- **TTL too high:** Set TTL to 1 hour for faster testing
- **SSL Certificate:** Make sure it covers both domains
- **Caching:** Clear browser cache and try incognito mode

### **Alternative: Quick Fix**
If DNS changes are complex, use GoDaddy's Domain Forwarding:
- `clicksummary.com` → `https://www.clicksummary.com` (301 redirect)
- Then update your code to use www as canonical

---

## 📞 **Need Help?**

If you run into issues:
1. **Check DNS propagation:** Use [DNS Checker](https://dnschecker.org/)
2. **Verify CloudFront:** Ensure both domains are in your distribution
3. **Test locally:** Use your computer's hosts file for testing
4. **Contact Support:** GoDaddy or AWS support can help with specific configurations

Remember: DNS changes can take up to 24 hours to fully propagate worldwide, but usually work within 1-2 hours.
