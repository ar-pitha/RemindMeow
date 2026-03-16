import React, { useEffect, useState } from 'react';

export const NotificationDiagnostics = () => {
  const [status, setStatus] = useState({
    serviceWorker: 'checking',
    notification: 'checking',
    fcmToken: 'checking',
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    isPWA: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      // Mobile detection
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent.toLowerCase()
      );
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isAndroid = /android/i.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

      // Service Worker
      let swStatus = 'not-supported';
      if ('serviceWorker' in navigator) {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          swStatus = regs.length > 0 ? 'registered' : 'not-registered';
        } catch (err) {
          swStatus = 'error';
        }
      }

      // Notification permission
      let notifStatus = 'not-supported';
      if ('Notification' in window) {
        notifStatus = Notification.permission;
      }

      // FCM Token (check localStorage for now)
      const fcmToken = localStorage.getItem('fcmToken');
      let fcmStatus = fcmToken ? 'stored' : 'not-stored';

      setStatus({
        serviceWorker: swStatus,
        notification: notifStatus,
        fcmToken: fcmStatus,
        isMobile,
        isIOS,
        isAndroid,
        isPWA,
      });
    };

    checkStatus();
  }, []);

  // Only show for mobile devices in development
  if (!status.isMobile) return null;

  const getStatusColor = (value) => {
    if (value === 'granted' || value === 'registered' || value === 'stored') return '#4CAF50';
    if (value === 'denied' || value === 'error' || value === 'not-registered') return '#f44336';
    return '#ff9800';
  };

  const getStatusText = (value) => {
    if (value === 'granted') return '✓ Granted';
    if (value === 'registered') return '✓ Registered';
    if (value === 'stored') return '✓ Stored';
    if (value === 'denied') return '✗ Denied';
    if (value === 'default') return '? Default (not requested)';
    if (value === 'not-registered') return '✗ Not Registered';
    if (value === 'not-stored') return '✗ Not Stored';
    return value;
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#667eea',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 9998,
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          ...(isOpen && { opacity: 0, pointerEvents: 'none' })
        }}
        title="Toggle notification status"
      >
        🔔
      </button>

      {/* Status Panel - Shows when open */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          maxWidth: '300px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease',
        }}>
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              color: '#333',
              lineHeight: '1',
            }}
            title="Close status"
          >
            ✕
          </button>

          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333', paddingRight: '20px' }}>
            📱 Notification Status
          </div>
          
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#666' }}>Device: </span>
            <span>{status.isAndroid ? 'Android' : status.isIOS ? 'iOS' : 'Unknown'}</span>
          </div>

          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#666' }}>PWA Mode: </span>
            <span style={{ color: status.isPWA ? '#4CAF50' : '#ff9800' }}>
              {status.isPWA ? '✓ Yes' : status.isMobile ? '✗ No (install app for background notifications)' : 'N/A'}
            </span>
          </div>

          <hr style={{ margin: '6px 0', borderColor: '#ddd' }} />

          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#666' }}>Service Worker: </span>
            <span style={{ color: getStatusColor(status.serviceWorker) }}>
              {getStatusText(status.serviceWorker)}
            </span>
          </div>

          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#666' }}>Notification: </span>
            <span style={{ color: getStatusColor(status.notification) }}>
              {getStatusText(status.notification)}
            </span>
          </div>

          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#666' }}>FCM Token: </span>
            <span style={{ color: getStatusColor(status.fcmToken) }}>
              {getStatusText(status.fcmToken)}
            </span>
          </div>

          {status.isIOS && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
              ⚠️ iOS: Background notifications not supported in mobile Safari. Use the app on iOS 16.4+ or install as PWA.
            </div>
          )}

          {status.isMobile && !status.isPWA && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#d1ecf1', borderRadius: '4px', color: '#0c5460' }}>
              💡 Tip: Install this app as PWA for reliable background notifications.
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};
