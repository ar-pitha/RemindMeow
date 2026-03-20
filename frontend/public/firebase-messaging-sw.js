// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

console.log('[SERVICE WORKER] Starting Firebase Cloud Messaging Service Worker');

// Initialize Firebase with correct config
const firebaseConfig = {
  apiKey: 'AIzaSyAfDzoLt-7C-GEutTViNHT7IAdEy2Ar410',
  authDomain: 'alaram-3b961.firebaseapp.com',
  projectId: 'alaram-3b961',
  storageBucket: 'alaram-3b961.firebasestorage.app',
  messagingSenderId: '555545097348',
  appId: '1:555545097348:web:29fb159186fec7b6ecbed1',
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

console.log('[SERVICE WORKER] Firebase Cloud Messaging initialized');

// Enhanced background message handler for Android
// ✅ Works when app is CLOSED (uses system notification APIs)
// ✅ Works when app is BACKGROUNDED (vibration + system sound)
function handleBackgroundMessage(payload) {
  console.log('[SERVICE WORKER] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Alarm Reminder';
  const notificationBody = payload.notification?.body || 'You have a new notification';
  const taskId = payload.data?.taskId || 'alarm-' + Date.now();
  
  // Android-optimized notification options
  // These settings work when app is CLOSED or in BACKGROUND
  const notificationOptions = {
    body: notificationBody,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: taskId,
    requireInteraction: true,
    priority: 'high',
    // ✅ Vibration works when app is closed (system-level vibration)
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    // ✅ System notification sound (must use 'default' string)
    sound: 'default',
    timestamp: Date.now(),
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  console.log('[SERVICE WORKER] Showing notification with system sound + vibration');

  // Show notification (works even when app is closed)
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[SERVICE WORKER] Notification displayed successfully');
      // Try to notify any open clients to play enhanced sound
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
          if (clients.length > 0) {
            console.log('[SERVICE WORKER] Found open client(s), sending PLAY_ALARM_SOUND message');
            clients.forEach(client => {
              client.postMessage({
                type: 'PLAY_ALARM_SOUND',
                data: payload.data,
                timestamp: Date.now(),
              });
            });
          } else {
            console.log('[SERVICE WORKER] No open clients - using system notification sound');
          }
        })
        .catch(err => console.error('[SERVICE WORKER] Error matching clients:', err));
    })
    .catch((error) => {
      console.error('[SERVICE WORKER] Error showing notification:', error);
      // Fallback notification with minimal options
      return self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        tag: taskId,
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 500, 200, 1000],
      }).catch(err => console.error('[SERVICE WORKER] Fallback notification failed:', err));
    });
}

// Register background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SERVICE WORKER] onBackgroundMessage fired');
  return handleBackgroundMessage(payload);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SERVICE WORKER] Notification clicked');

  event.notification.close();

  // Handle different actions
  if (event.action === 'dismiss') {
    return;
  }

  // Handle click action or default click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      console.log('[SERVICE WORKER] Found ' + clientList.length + ' windows');
      
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('dashboard') || client.url.includes('localhost') || client.url.includes('vercel.app')) {
          console.log('[SERVICE WORKER] Focusing existing window');
          return client.focus();
        }
      }
      
      // If no window is found, open a new one
      console.log('[SERVICE WORKER] Opening new dashboard window');
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

// Handle notification close (Android specific)
self.addEventListener('notificationclose', (event) => {
  console.log('[SERVICE WORKER] Notification closed');
});

// Respond to messages from clients
self.addEventListener('message', (event) => {
  console.log('[SERVICE WORKER] Message received from client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
