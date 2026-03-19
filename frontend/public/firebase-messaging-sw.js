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

// Helper to play alarm sound via Web Audio API in service worker
const playAlarmSound = async () => {
  try {
    // Get all clients to trigger sound (including hidden ones)
    const clients = await self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });
    
    console.log('[SERVICE WORKER] Found ' + clients.length + ' clients to notify');
    
    for (const client of clients) {
      client.postMessage({
        type: 'PLAY_ALARM_SOUND',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (clients.length === 0) {
      console.warn('[SERVICE WORKER] No clients available to trigger sound');
    } else {
      console.log('[SERVICE WORKER] Alarm sound trigger sent to ' + clients.length + ' client(s)');
    }
  } catch (error) {
    console.error('[SERVICE WORKER] Error triggering alarm sound:', error);
  }
};

// Enhanced background message handler for Android
function handleBackgroundMessage(payload) {
  console.log('[SERVICE WORKER] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Alarm Reminder';
  const notificationBody = payload.notification?.body || 'You have a new notification';
  const taskId = payload.data?.taskId || 'alarm-' + Date.now();
  
  // Android-optimized notification options with enhanced vibration
  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: taskId,
    data: payload.data || {},
    requireInteraction: true,
    priority: 'high',
    // Vibration pattern: feels like an alarm (multiple short bursts)
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    sound: 'default',
    timestamp: Date.now(),
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  console.log('[SERVICE WORKER] Showing Android notification');

  // Show notification
  const notificationPromise = self.registration.showNotification(notificationTitle, notificationOptions);

  notificationPromise
    .then(async () => {
      console.log('[SERVICE WORKER] Android notification shown successfully');
      // Delay before playing sound
      await new Promise(resolve => setTimeout(resolve, 500));
      await playAlarmSound();
    })
    .catch((error) => {
      console.error('[SERVICE WORKER] Error showing Android notification:', error);
      // Fallback: Try showing with minimal options
      self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        tag: taskId,
        requireInteraction: true,
      }).catch(err => console.error('[SERVICE WORKER] Fallback notification failed:', err));
    });

  return notificationPromise;
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
