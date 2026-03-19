# PWA Debugging & Alarm Configuration Guide

## Overview
This document provides step-by-step troubleshooting for PWA installation issues and alarm sound limitations in the Alarm Reminder app.

---

## Part 1: Why "PWA Mode: No" - Root Causes & Solutions

### Issue
App shows **"PWA Mode: No"** even after adding to home screen on Android.

### Root Causes

1. **"Add to Home Screen" ≠ PWA Installation**
   - Android's "Add to Home Screen" creates a shortcut, NOT a PWA
   - True PWA installation happens through the install prompt

2. **Manifest.json not properly configured**
   - Missing required properties
   - Not served with correct MIME type
   - Cached too aggressively

3. **Service Worker not registered**
   - Browser can't find `/firebase-messaging-sw.js`
   - Service Worker registration failed silently

4. **Vercel caching issues**
   - manifest.json cached with `max-age=31536000` (caches old version)
   - Need to force `max-age=0, must-revalidate`

---

## Part 2: Fixing PWA Installation Issues

### ✅ Step 1: Clear All Old Caches & Reinstall

**On Android:**

1. **Settings → Apps → [Your App] → Storage → Clear Cache & Clear Data**
2. **Chrome → Settings → Site settings → Applications → Remove the app**
3. **Delete from home screen**
4. **Manually clear browser cache:**
   - Chrome: Menu → Settings → Storage → Clear browsing data (All time)
   - Select: Cookies and site data, Cached images and files

**On iOS:**

1. **Settings → Safari → Advanced → Website Data → Find app → Delete**
2. **Home screen → Long press app → Remove app → Delete app**

### ✅ Step 2: Rebuild & Redeploy Frontend

```bash
cd frontend
npm run build
git add -A
git commit -m "fix: PWA manifest and caching configuration"
git push
# Wait 2-3 minutes for Vercel deployment to complete
```

### ✅ Step 3: Verify Manifest.json is Accessible

**In Chrome DevTools:**

1. **F12 → Application → Manifest**
   - Should see green ✓ next to all properties
   - Should NOT see red ✗ errors
   - Check: `display: standalone` is present
   - Check: `start_url: /index.html?utm_source=pwa`

2. **Check manifest header in Network tab:**
   - Open DevTools → Network tab
   - Reload page
   - Click on `manifest.json` request
   - Look at Response Headers:
     ```
     cache-control: public, max-age=0, must-revalidate
     content-type: application/manifest+json
     ```
   - If `max-age=31536000`, cache hasn't cleared yet (wait 1 hour + hard refresh)

3. **Force refresh to bypass cache:**
   ```
   Windows/Linux: Ctrl + Shift + R
   Mac: Cmd + Shift + R
   ```

### ✅ Step 4: Verify Service Worker Registration

**In Chrome DevTools:**

1. **F12 → Application → Service Workers**
   - Should show `/firebase-messaging-sw.js` with status **Active**
   - Should show scope: `/`

2. If **"unregistered"** or **missing**:
   - Open Console tab
   - Look for errors: `"Error registering service worker"`
   - Common causes:
     - Manifest.json not found
     - Service Worker has syntax errors
     - Domain HTTPS required (not http://)

### ✅ Step 5: Verify Notification Permissions

**In Chrome DevTools:**

1. **F12 → Application → Manifest**
   - Scroll down to "Site engagement"
   - It should show: **Notification permission: Granted**

2. **If "Denied":**
   - Click the lock icon 🔒 next to URL in address bar
   - Find "Notifications"
   - Click "Reset" or "Clear"
   - Reload page and grant permission again

3. **In app, click diagnostics button (🔔) to verify:**
   - Notifications: ✓ Granted
   - Service Worker: ✓ Registered
   - FCM Token: ✓ Stored

---

## Part 3: How to Properly Install App as PWA

### On Android Chrome

1. **Visit the deployed app:** `https://your-app.vercel.app`

2. **Wait for installer prompt:**
   - Chrome auto-shows "Install app" button in address bar
   - OR click Chrome menu (⋮) → "Install app"
   - OR "Add to Home screen" → Install button appears

3. **Click "Install"** - app downloads to home screen

4. **Verify PWA mode:**
   - Diagnostics (🔔) button → Display Mode: **STANDALONE**
   - Diagnostics (🔔) button → PWA Mode: **YES**

5. **Expected behavior in PWA mode:**
   - No address bar at top
   - No Chrome menu button
   - Looks like native app
   - Can receive background notifications

### On iOS Safari (PWA Support: iOS 16.4+)

1. **Safari → Share button → Add to Home Screen**

2. **NOTE: iOS PWA limitations:**
   - Background notifications NOT supported (browser limitation)
   - Foreground notifications work
   - Web Push API not available in iOS Safari
   - Best to add app to home screen, then use foreground notifications

---

## Part 4: Verifying PWA Installation in Chrome

### Method 1: Audit in Chrome DevTools

1. **F12 → Lighthouse (or Build)**
2. **Select: Mobile, Progressive Web App**
3. **Click "Analyze page load"**
4. **Should see green ✓ for:**
   - ✓ Installable
   - ✓ Has manifest.json
   - ✓ Service Worker registered
   - ✓ HTTPS

### Method 2: Manual Checklist

In Chrome DevTools → Application tab, verify:

```
✓ Manifest loaded successfully
  ✓ display: "standalone"
  ✓ start_url: "/index.html?utm_source=pwa"
  ✓ icons: Present with 192x192 and 512x512

✓ Service Worker
  ✓ Status: Active (not disabled/error/redundant)
  ✓ Scope: /

✓ Security
  ✓ HTTPS enabled (required for PWA)
  ✓ No mixed content warnings

✓ Storage
  ✓ Cookies: present
  ✓ Quota: Sufficient
```

---

## Part 5: Best Practices for PWA on Vercel

### 1. Vercel Configuration (vercel.json)

```json
{
  "routes": [
    {
      "src": "/manifest.json",
      "headers": {
        "cache-control": "public, max-age=0, must-revalidate",
        "content-type": "application/manifest+json"
      }
    },
    {
      "src": "/firebase-messaging-sw.js",
      "headers": {
        "cache-control": "public, max-age=0, must-revalidate",
        "content-type": "application/javascript"
      }
    },
    {
      "src": "/index.html",
      "headers": {
        "cache-control": "public, max-age=0, must-revalidate"
      }
    }
  ]
}
```

**Key Points:**
- manifest.json: `max-age=0` (don't cache, always fresh)
- Service Worker: `max-age=0` (must update immediately)
- index.html: `max-age=0` (always get latest)
- Static assets: `max-age=31536000` (cache forever, use versioning)

### 2. Icon Strategy

Create proper PWA icons (multiple sizes):
- `192x192` - Home screen icon
- `512x512` - Splash screen, install dialog
- Make icons square with safe margin
- Support both light and dark themes if possible

Required icon locations in `/public/icons/`:
```
/icons/icon-192x192.png          # Standard icon
/icons/icon-192x192-maskable.png # For "Adaptive Icons" (Android 8+)
/icons/icon-512x512.png
/icons/icon-512x512-maskable.png
/icons/apple-touch-icon-180x180.png  # iOS home screen
```

### 3. Meta Tags in index.html

✅ **Required for full PWA support:**

```html
<meta name="theme-color" content="#667eea" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="mobile-web-app-capable" content="yes" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
```

### 4. Manifest.json Checklist

✅ **Must have:**
- `display: "standalone"` (removes browser UI)
- `start_url: "/index.html?utm_source=pwa"` (track PWA installs)
- `scope: "/"` (service worker scope)
- `icons: [...]` (192x192, 512x512 minimum)
- `theme_color` (matches your brand)
- `background_color` (splash screen color)

---

## Part 6: Alarm Sound & Notification Limitations

### ⚠️ Browser Limitation: No Audio When App is Fully Closed

**What works:**
- ✅ Foreground notifications (app is open)
- ✅ Service Worker can show notifications (app in background)
- ✅ Vibration API works in background
- ✅ Notification API sound works (system notification sound)

**What DOES NOT work:**
- ❌ Playing custom audio when app is completely closed
- ❌ Web Audio API in closed app
- ❌ JavaScript cannot execute when app is closed
- ❌ Browser PWA cannot wake device with audio (native app can)

### Best Solutions for Alarm When App is Closed

#### 1. **Notification API Sound** (RECOMMENDED) ✅

Let the notification system play the sound for you.

```javascript
// In service worker
self.registration.showNotification(title, {
  sound: 'default',  // System notification sound
  vibrate: [500, 200, 500],  // Vibration pattern
  requireInteraction: true,  // Keep notification until user acts
  actions: [
    { action: 'open', title: 'Open' },
    { action: 'dismiss', title: 'Dismiss' }
  ]
});
```

**Result:**
- ✅ Sound plays even if app is closed
- ✅ Vibration pattern triggers
- ✅ Notification stays on screen until dismissed
- ✅ Works on Android, limited on iOS

#### 2. **Vibration API** (Always Works) ✅

Vibrate the phone even when app is closed.

```javascript
// In service worker or when notification arrives
if (navigator.vibrate) {
  // Vibrate pattern: 500ms on, 200ms off, 500ms on
  navigator.vibrate([500, 200, 500]);
}
```

**Result:**
- ✅ Vibrates phone even with app closed
- ✅ Can use pattern to simulate "alarm feel"
- ✅ Works on Android and iOS
- ⚠️ Some devices allow users to disable vibration

#### 3. **Local Notification Service** (Good UX) ✅

Use browser's Notification API in foreground when you detect alarm time.

```javascript
// When locally detecting alarm time
const alarm = new Notification('🔔 ALARM!', {
  body: 'Wake up!',
  icon: '/icons/icon-192x192.png',
  requireInteraction: true,
  vibrate: [500, 200, 500, 200, 500],
});
```

**Currently implemented in your app** ✅

---

## Part 7: Implementation Summary for Your App

### What You Have ✅
1. **manifest.json** - Properly configured with `display: standalone`
2. **Service Worker** - Registered and listening for background messages
3. **FCM** - Configured to receive notifications
4. **Vibration** - Enhanced pattern in service worker
5. **Notification sound** - System sound plays with notification

### What's Missing ❌
1. **PWA icons** - Only using favicon.ico, need proper icons at `/public/icons/`
2. **Vercel caching** - Fixed in updated vercel.json
3. **Installation prompt** - Added to App.js (beforeinstallprompt)

### Action Items

```bash
# 1. Create icons (use online tool or design software)
# Place in: /public/icons/
#   - icon-192x192.png
#   - icon-512x512.png  
#   - apple-touch-icon-180x180.png

# 2. Deploy updated files
git add -A
git commit -m "fix: Complete PWA configuration and icon setup"
git push

# 3. After deployment, clear browser cache and reinstall
# (Instructions in Part 2)

# 4. Verify installation
# Open app → Click diagnostics (🔔) → PWA Mode should show YES
```

---

## Part 8: Testing Checklist

After deployment, verify:

### Desktop Chrome
- [ ] DevTools → Application → Manifest shows all properties
- [ ] DevTools → Application → Service Workers shows "Active"
- [ ] DevTools → Lighthouse → PWA audit passes
- [ ] Install button appears in address bar

### Android Chrome
- [ ] Notification permission granted
- [ ] Install prompt shows "Install" option
- [ ] After install: No address bar (standalone mode)
- [ ] Diagnostics → "PWA Mode: YES"
- [ ] When closed: Notification + Vibration arrives

### Android PWA Background Testing

1. **Foreground (App Open):**
   - ✅ Notification + Sound + Vibration works

2. **Background (App Minimized):**
   - ✅ Service Worker catches notification
   - ✅ Shows notification
   - ✅ Sound plays (system notification sound)
   - ✅ Vibration pattern triggers

3. **Closed (App Removed from Recent):**
   - ✅ Notification arrives via FCM
   - ✅ Notification sound plays (system sound)
   - ✅ Vibration triggers
   - ❌ Custom audio cannot play (browser limitation)
   - ❌ App cannot auto-wake (browser limitation)

### iOS Safari
- [ ] Can add to home screen
- [ ] Notification permission shows
- [ ] Foreground notifications work
- ⚠️ Background notifications not supported (iOS limitation)

---

## Part 9: Debugging Commands

### Check manifest.json in browser console

```javascript
// In browser console
fetch('/manifest.json')
  .then(r => r.json())
  .then(m => console.log(m))
  .catch(e => console.error('Manifest error:', e));

// Check service worker
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SWs:', regs.map(r => r.scope)));
```

### Check notification permission

```javascript
// In console
console.log('Permission:', Notification.permission);

// Request permission
Notification.requestPermission().then(p => {
  console.log('Updated permission:', p);
});
```

### Monitor FCM messages

```javascript
// In console
localStorage.getItem('fcmToken');
```

### Check display mode

```javascript
// In console
const mqStandalone = window.matchMedia('(display-mode: standalone)');
console.log('Standalone:', mqStandalone.matches);
console.log('Navigator.standalone:', window.navigator.standalone);
```

---

## Part 10: Common Errors & Solutions

### Error: "Cannot read property 'showNotification' of undefined"

**Cause:** Service Worker not properly registered

**Solution:**
1. Check DevTools → Application → Service Workers
2. Verify `/firebase-messaging-sw.js` loads (Network tab)
3. Clear browser data and reinstall

### Error: "Manifest parsing error"

**Cause:** Invalid JSON or wrong MIME type

**Solution:**
1. Copy manifest.json to JSON validator: jsonlint.com
2. Check Network tab → manifest.json → Response Headers
3. Should show: `content-type: application/manifest+json`

### "Install button not showing"

**Cause:** App doesn't meet PWA criteria

**Solution:**
1. Run Lighthouse audit (DevTools)
2. Fix any errors (usually icons or manifest)
3. Must use HTTPS (required)
4. Must have valid manifest and service worker

### Notification not vibrating

**Cause:** Device has vibration disabled OR pattern not supported

**Solution:**
1. Check device settings: Settings → Sound & haptics → Vibration ON
2. Try simpler pattern: `[500, 500]`
3. Different devices support different vibration levels

---

## Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| PWA Mode: No | Not installed as PWA | Clear cache + reinstall with Install prompt |
| No notifications in background | Service Worker not active | Register SW, verify manifest |
| No notification sound when closed | Browser limitation | Use Notification API sound |
| No custom audio when closed | Browser limitation | Not possible, use notification sound |
| App shows address bar | Not in PWA mode | Install as PWA, not just home screen shortcut |
| Installation won't complete | Missing icons/manifest | Add /public/icons/, fix manifest.json |

---

## Next Steps

1. **Create/add icons** to `/public/icons/` directory
2. **Test locally** with `npm run build && npm install -g serve && serve -s build`
3. **Deploy** updated vercel.json, manifest.json, and index.html
4. **Clear browser caches** (Ctrl+Shift+R multiple times)
5. **Install** app using Chrome install prompt
6. **Verify** PWA Mode shows YES in diagnostics
7. **Test** background notifications: close app, receive notification

---

**Questions?** Check browser DevTools Console for error messages - they usually indicate exact issues.
