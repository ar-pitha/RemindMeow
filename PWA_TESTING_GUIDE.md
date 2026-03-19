# PWA Installation & Alarm Sound Testing Guide

## Quick Verification Checklist

After deploying the updated code, use this checklist to verify PWA setup.

---

## 1️⃣ Verify Deployment Complete

**On your browser, visit:** `https://your-app.vercel.app`

Check console for deployment success:
```
✓ Service Worker registered
✓ FCM token updated
✓ Notifications enabled for this app
```

---

## 2️⃣ Check Manifest Installation

**In Chrome DevTools (F12):**

1. **Go to:** Application → Manifest
2. **Verify you see:**
   - ✅ `display: "standalone"`
   - ✅ `start_url: "/index.html?utm_source=pwa"`
   - ✅ `theme_color: "#667eea"`
   - ✅ icons array with multiple sizes

3. **Check no red errors** about missing icons (until you add them)

---

## 3️⃣ Check Service Worker Status

**In Chrome DevTools (F12):**

1. **Go to:** Application → Service Workers
2. **Verify:**
   - ✅ `/firebase-messaging-sw.js` is listed
   - ✅ Status shows "activated and running"
   - ✅ Scope is `/` or your domain

---

## 4️⃣ Check Install Prompt

**In Chrome address bar:**

1. **Should see** "Install app" button on right side of address bar
   - Or click Chrome menu (⋮) → "Install app"
2. **Click Install**
3. **Verify app installs** and icon appears on home screen

---

## 5️⃣ Verify PWA Mode Detection

After installing as PWA:

1. **Open the installed app** (click icon on home screen)
2. **Verify no address bar** at top (true PWA mode)
3. **Click diagnostics button** (🔔 in bottom right)
4. **Check:**
   - ✅ Display Mode: **STANDALONE**
   - ✅ PWA Mode: **YES** (in green)
   - ✅ Service Worker: **REGISTERED**
   - ✅ Notifications: **GRANTED**

---

## 6️⃣ Test Foreground Notification (App Open)

1. **Keep app open**
2. **From your backend, send test notification:**
   ```bash
   curl -X POST http://localhost:5000/send-test-notification \
     -H "Content-Type: application/json" \
     -d '{"userId": "your-user-id", "title": "Test Alarm", "body": "App is open"}'
   ```
3. **Verify on your phone:**
   - ✅ Notification appears
   - ✅ Sound plays
   - ✅ Vibration triggers

---

## 7️⃣ Test Background Notification (App Minimized)

1. **Minimize app** (click home button, app goes to background)
2. **Send test notification** (using command from Step 6)
3. **Verify:**
   - ✅ Notification arrives
   - ✅ Sound plays
   - ✅ Vibration triggers
4. **Tap notification** → App opens and focuses

---

## 8️⃣ Test Closed App Notification (App Removed from Recent)

1. **Close app completely:**
   - On Android: Swipe app away from recent apps
   - On iOS: Swipe up from bottom
2. **Send test notification**
3. **Verify:**
   - ✅ Notification arrives even with app closed
   - ✅ Notification sound plays (system sound)
   - ✅ Vibration triggers
4. **Tap notification** → App launches

---

## Expected Results

### ✅ When PWA Mode is Working Correctly:

```
App Open:
  • Notification: ✓ YES
  • Sound: ✓ YES
  • Vibration: ✓ YES
  • Display: In-app toast + system notification

App in Background:
  • Notification: ✓ YES
  • Sound: ✓ YES (system notification sound)
  • Vibration: ✓ YES
  • Display: Notification on lock screen

App Closed:
  • Notification: ✓ YES
  • Sound: ✓ YES (system notification sound)
  • Vibration: ✓ YES
  • Display: Notification on lock screen
  • App Launch: ✓ Opens when tapped
```

### ⚠️ Limitations (Browser Issue, Not App Bug):

```
App Closed:
  • Custom Audio File: ✗ CANNOT PLAY (browser limitation)
  • App Auto-Wake: ✗ CANNOT AUTO-WAKE (browser limitation)
  • Background Code: ✗ CANNOT EXECUTE (app is closed)
  
Solution:
  • Use Notification API sound (system notification sound)
  • Use Vibration API (strong vibration pattern)
  • This is as close as web apps can get to native behavior
```

---

## Common Issues & Fixes

### Issue: "PWA Mode: NO" appears

**Causes:**
1. App was added to home screen (shortcut), not installed as PWA
2. Just opened in browser, not in PWA mode

**Fix:**
1. From browser: Menu → "Install app"
2. Click "Install" in prompt
3. App will appear on home screen with launcher
4. Open from launcher (not from browser)
5. Check in app: should now show "PWA Mode: YES"

### Issue: Installation button not showing

**Causes:**
1. manifest.json not found or invalid
2. Service Worker not registered
3. HTTPS not enabled
4. Missing icons in manifest

**Fix:**
1. Check DevTools → Application → Manifest for error
2. Run Lighthouse audit (F12 → Lighthouse)
3. Fix any validation errors
4. Wait for Vercel deployment to complete (check status on vercel.com)
5. Clear browser cache: Ctrl+Shift+Delete → All time → Clear data

### Issue: Notification doesn't arrive when app closed

**Causes:**
1. Notification permission denied
2. FCM token not registered on backend
3. Service Worker not active
4. App not in PWA mode

**Fix:**
1. Click 🔔 → Check: Notifications = GRANTED
2. Click 🔔 → Check: Service Worker = REGISTERED
3. Verify FCM token sent to backend (check network tab)
4. In PWA mode: Click 🔔 → Check: PWA Mode = YES

### Issue: Sound doesn't play when app closed

**Browser Limitation - Solutions:**

Option 1: **Ensure FCM includes sound**
```javascript
// In service worker (already configured)
showNotification(title, {
  sound: 'default',  // ← This line
  vibrate: [500, 200, 500]
});
```

Option 2: **Verify device notification sound enabled**
- Settings → Sound & haptics → Notification sound ON
- Settings → Sound & haptics → Vibration ON

Option 3: **Custom audio not possible**
- Browser cannot play custom audio when closed
- Only system notification sound works
- This is a browser security limitation, not a bug

---

## Testing Checklist Form

Print this and check off as you test:

```
CHROME DEVTOOLS CHECKS:
  ☐ Manifest visible and valid in DevTools
  ☐ Service Worker shows "activated and running"
  ☐ Install button appears in address bar
  
INSTALLATION:
  ☐ Clicked "Install app" prompt
  ☐ App appears on home screen
  ☐ Opened app from launcher (not browser)
  ☐ No address bar visible (confirms PWA mode)
  
DIAGNOSTICS (🔔 button):
  ☐ Display Mode: STANDALONE
  ☐ PWA Mode: YES
  ☐ Service Worker: REGISTERED
  ☐ Notifications: GRANTED
  ☐ FCM Token: STORED
  
FOREGROUND NOTIFICATION:
  ☐ App open, send test notification
  ☐ Notification appears
  ☐ Sound plays
  ☐ Vibration triggers
  
BACKGROUND NOTIFICATION:
  ☐ Minimize app (home button)
  ☐ Send test notification
  ☐ Notification arrives
  ☐ Sound plays
  ☐ Vibration triggers
  ☐ Tapping opens app
  
CLOSED APP NOTIFICATION:
  ☐ Close app from recent apps
  ☐ Send test notification
  ☐ Notification arrives
  ☐ Notification sound plays
  ☐ Vibration triggers
  ☐ Tapping launches app
```

---

## Questions?

If tests fail, check:

1. **Browser Console** (F12 → Console tab)
   - Look for red errors
   - Copy error message

2. **DevTools Application Tab**
   - Manifest: Check for parsing errors
   - Service Workers: Check for errors
   - Clear data and reload if stuck

3. **Vercel Deployment**
   - Check vercel.com → your project
   - Wait for green checkmark
   - Try hard refresh: Ctrl+Shift+R multiple times

4. **Backend Logs**
   - Verify FCM token received from frontend
   - Check notification sent from backend
   - Look for Firebase errors

---

## Success Indicators

When everything is working:

```
✅ App shows "PWA Mode: YES"
✅ No address bar in app
✅ Notifications arrive in all states
✅ Sound plays with notifications
✅ Vibration pattern triggers
✅ Tap notification → app opens
```

**Congratulations! Your PWA is properly configured!** 🎉
