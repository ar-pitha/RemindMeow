// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase with correct config
// These values are automatically populated at build time
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

// Helper to play alarm sound via Web Audio API in service worker
const playAlarmSound = async () => {
  try {
    // Get all clients to trigger sound
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    
    for (const client of clients) {
      client.postMessage({
        type: 'PLAY_ALARM_SOUND',
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log('🔊 [SERVICE WORKER] Alarm sound trigger sent to', clients.length, 'client(s)');
  } catch (error) {
    console.warn('⚠️ [SERVICE WORKER] Could not trigger alarm sound:', error.message);
  }
};

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📬 [SERVICE WORKER] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Alarm Reminder';
  const notificationBody = payload.notification?.body || 'You have a new notification';
  const taskId = payload.data?.taskId || 'alarm-notification';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: taskId,
    data: payload.data || {},
    requireInteraction: true,
  };

  // Show notification
  const notificationPromise = self.registration.showNotification(notificationTitle, notificationOptions);

  // Trigger alarm sound through clients
  notificationPromise.then(async () => {
    console.log('✅ [SERVICE WORKER] Notification shown:', notificationTitle);
    await playAlarmSound();
  }).catch((error) => {
    console.error('❌ [SERVICE WORKER] Error showing notification:', error);
  });

  return notificationPromise;
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SERVICE WORKER] Notification clicked:', event.notification);

  event.notification.close();

  // Handle click action
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SERVICE WORKER] Notification closed:', event.notification);
});
