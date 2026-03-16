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

// Global state for alarm sound control
let globalAudioContext = null;
let alarmOscillators = [];
let alarmIsPlaying = false;

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

// Initialize global audio context for mobile
const initializeGlobalAudioContext = async () => {
  if (globalAudioContext && globalAudioContext.state !== 'closed') {
    return globalAudioContext;
  }
  
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    globalAudioContext = new AudioContext();
    console.log('✅ [AUDIO] Global AudioContext initialized, state:', globalAudioContext.state);
    
    // Resume if suspended (required for mobile autoplay)
    if (globalAudioContext.state === 'suspended') {
      console.log('🔓 [AUDIO] Resuming suspended AudioContext...');
      await globalAudioContext.resume();
      console.log('✅ [AUDIO] AudioContext resumed, state:', globalAudioContext.state);
    }
    
    return globalAudioContext;
  } catch (error) {
    console.error('❌ [AUDIO] Failed to initialize AudioContext:', error);
    return null;
  }
};

// Stop all alarm sounds
const stopAlarmSound = () => {
  try {
    console.log('🛑 [AUDIO] Stopping all alarm sounds...');
    alarmOscillators.forEach((osc, index) => {
      try {
        if (osc && typeof osc.stop === 'function') {
          osc.stop();
          console.log(`✅ [AUDIO] Oscillator ${index} stopped`);
        }
      } catch (e) {
        console.log(`ℹ️ [AUDIO] Oscillator ${index} already stopped`);
      }
    });
    alarmOscillators = [];
    alarmIsPlaying = false;
    console.log('✅ [AUDIO] All alarm sounds stopped');
  } catch (error) {
    console.error('❌ [AUDIO] Error stopping alarm:', error);
  }
};

// Play alarm sound using Web Audio API with extended duration for mobile
const playAlarmSound = async () => {
  try {
    // Stop any existing sound
    if (alarmIsPlaying) {
      stopAlarmSound();
    }

    const audioContext = await initializeGlobalAudioContext();
    if (!audioContext) {
      console.error('❌ [AUDIO] No audio context available');
      return;
    }

    alarmIsPlaying = true;
    const now = audioContext.currentTime;
    const totalDuration = 60; // 60 seconds of total alarm
    const cycleLength = 0.9;
    const cycleCount = Math.floor(totalDuration / cycleLength);

    console.log(`🚨 [AUDIO] Starting alarm with ${cycleCount} cycles (${totalDuration}s total)`);

    // Create repeating alarm pattern
    for (let cycle = 0; cycle < cycleCount; cycle++) {
      if (!alarmIsPlaying) {
        console.log('🛑 [AUDIO] Alarm stopped during creation');
        break;
      }

      const startTime = now + cycle * cycleLength;

      // High frequency tone (950Hz)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.setValueAtTime(950, startTime);
      osc1.frequency.exponentialRampToValueAtTime(700, startTime + 0.3);
      gain1.gain.setValueAtTime(0.5, startTime); // Louder volume for mobile
      gain1.gain.exponentialRampToValueAtTime(0.1, startTime + 0.3);
      osc1.start(startTime);
      osc1.stop(startTime + 0.3);
      alarmOscillators.push(osc1);

      // Low frequency tone (500Hz)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.setValueAtTime(500, startTime);
      osc2.frequency.exponentialRampToValueAtTime(350, startTime + 0.3);
      gain2.gain.setValueAtTime(0.4, startTime); // Louder volume for mobile
      gain2.gain.exponentialRampToValueAtTime(0.08, startTime + 0.3);
      osc2.start(startTime);
      osc2.stop(startTime + 0.3);
      alarmOscillators.push(osc2);
    }

    console.log(`✅ [AUDIO] Alarm sound created with ${alarmOscillators.length} oscillators`);

  } catch (error) {
    console.error('❌ [INDEX] Error in playAlarmSound:', error);
    alarmIsPlaying = false;
  }
};

// Expose stop function globally for components
window.stopAlarmSound = stopAlarmSound;

// Play sound from file (not available - use Web Audio API instead)
const playSoundFromFile = (soundUrl) => {
  console.log('ℹ️ [INDEX] Audio files not available, using Web Audio API instead');
  playAlarmSound();
};
