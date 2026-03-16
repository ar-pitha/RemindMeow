import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mobile device detection
const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
const isAndroid = /android/i.test(navigator.userAgent);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

console.log(`[APP] Device detection: Mobile=${isMobile}, Android=${isAndroid}, iOS=${isIOS}`);

// Register service worker for Firebase Cloud Messaging with mobile support
if ('serviceWorker' in navigator) {
  console.log('[APP] Service Worker support detected');
  
  // For mobile, register immediately; for desktop, wait for load
  const registerServiceWorker = async () => {
    try {
      console.log('[APP] Attempting to register Service Worker...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      console.log('✓ Service Worker registered successfully:', registration);
      console.log('[APP] SW Scope:', registration.scope);
      console.log('[APP] SW controlling page:', !!navigator.serviceWorker.controller);
      
      // For mobile PWA, ensure controller is set
      if (isMobile && !navigator.serviceWorker.controller) {
        console.warn('[APP] Mobile: Service Worker not controlling page yet (may control on reload)');
      }
    } catch (err) {
      console.error('❌ Service Worker registration failed:', err);
      console.error('[APP] Error details:', err.message);
    }
  };
  
  if (isMobile) {
    // For mobile, register immediately
    console.log('[APP] Mobile device detected, registering Service Worker immediately');
    registerServiceWorker();
  } else {
    // For desktop, wait for load event
    window.addEventListener('load', registerServiceWorker);
  }
} else {
  console.error('[APP] Service Worker not supported');
}

// Listen for messages from service worker to play alarm sound
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[APP] Message from Service Worker:', event.data);
    if (event.data.type === 'PLAY_ALARM_SOUND') {
      playAlarmSound();
    } else if (event.data.type === 'PLAY_SOUND') {
      playSoundFromFile(event.data.soundUrl);
    }
  });
}

// Play alarm sound using Web Audio API (when notification arrives)
const playAlarmSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();

    // Resume context if suspended (required for user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create multiple alarm cycles
    for (let cycle = 0; cycle < 4; cycle++) {
      const startTime = audioContext.currentTime + cycle * 0.9;

      // High frequency tone
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();

      osc1.connect(gain1);
      gain1.connect(audioContext.destination);

      osc1.frequency.setValueAtTime(900, startTime);
      osc1.frequency.exponentialRampToValueAtTime(650, startTime + 0.35);

      gain1.gain.setValueAtTime(0.4, startTime);
      gain1.gain.exponentialRampToValueAtTime(0.05, startTime + 0.35);

      osc1.start(startTime);
      osc1.stop(startTime + 0.35);

      // Low frequency tone
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();

      osc2.connect(gain2);
      gain2.connect(audioContext.destination);

      osc2.frequency.setValueAtTime(450, startTime);
      osc2.frequency.exponentialRampToValueAtTime(300, startTime + 0.35);

      gain2.gain.setValueAtTime(0.25, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.03, startTime + 0.35);

      osc2.start(startTime);
      osc2.stop(startTime + 0.35);
    }

    console.log('🔊 [INDEX] Alarm sound playing via Web Audio API');
  } catch (error) {
    console.warn('⚠️ [INDEX] Could not play alarm sound:', error.message);
  }
};

// Play sound from file (legacy fallback)
const playSoundFromFile = (soundUrl) => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.8;
    audio.play().catch((err) => {
      console.warn('⚠️ [INDEX] Could not play sound file:', err.message);
      playAlarmSound();
    });
    console.log('🔊 [INDEX] Sound playing from file');
  } catch (error) {
    console.warn('⚠️ [INDEX] Error playing sound:', error.message);
  }
};
