import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for Firebase Cloud Messaging
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✓ Service Worker registered for FCM:', registration);
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

// Listen for messages from service worker to play alarm sound
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
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
