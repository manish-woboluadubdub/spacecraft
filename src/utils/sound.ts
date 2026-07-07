import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { loadSettings } from './storage';

// Public domain / royalty-free sound effects URLs
const SOUNDS = {
  laser: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // Retro laser
  explosion: 'https://assets.mixkit.co/active_storage/sfx/1659/1659-84.wav', // Explosion
  powerup: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav', // Digital success
  gameover: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-84.wav', // Descending beep
  bgm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', // Synth ambient loop
};

let bgmSound: Audio.Sound | null = null;
let soundObjects: Record<string, Audio.Sound> = {};

// Helper to check if audio is enabled
const shouldPlaySound = async (type: 'sfx' | 'music'): Promise<boolean> => {
  const settings = await loadSettings();
  return type === 'sfx' ? settings.sfxEnabled : settings.musicEnabled;
};

// Helper to check if haptics are enabled
const shouldTriggerHaptic = async (): Promise<boolean> => {
  const settings = await loadSettings();
  return settings.hapticsEnabled;
};

// Preload SFX to avoid latency when playing
export const preloadSounds = async (): Promise<void> => {
  if (Platform.OS === 'web') return; // Skip preloading on web to prevent browser blocks
  
  try {
    // Configure audio session for iOS and Android
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldRouteThroughEarpieceAndroid: false,
    });

    const sfxKeys = ['laser', 'explosion', 'powerup', 'gameover'] as const;
    for (const key of sfxKeys) {
      if (!soundObjects[key]) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: SOUNDS[key] },
          { shouldPlay: false }
        );
        soundObjects[key] = sound;
      }
    }
  } catch (error) {
    console.warn('Failed to preload sounds:', error);
  }
};

export const playSFX = async (type: 'laser' | 'explosion' | 'powerup' | 'gameover'): Promise<void> => {
  const allowed = await shouldPlaySound('sfx');
  if (!allowed) return;

  try {
    // If sound is preloaded, replay it
    const preloadedSound = soundObjects[type];
    if (preloadedSound) {
      await preloadedSound.setPositionAsync(0);
      await preloadedSound.playAsync();
      return;
    }

    // Otherwise, create and play dynamically
    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUNDS[type] },
      { shouldPlay: true }
    );
    // Unload after playing to prevent memory leak
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.warn(`Error playing SFX ${type}:`, error);
  }
};

export const startBGM = async (): Promise<void> => {
  const allowed = await shouldPlaySound('music');
  if (!allowed) return;

  try {
    if (bgmSound) {
      await bgmSound.stopAsync();
      await bgmSound.unloadAsync();
      bgmSound = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUNDS.bgm },
      { shouldPlay: true, isLooping: true, volume: 0.3 }
    );
    bgmSound = sound;
  } catch (error) {
    console.warn('Error starting BGM:', error);
  }
};

export const stopBGM = async (): Promise<void> => {
  try {
    if (bgmSound) {
      await bgmSound.stopAsync();
      await bgmSound.unloadAsync();
      bgmSound = null;
    }
  } catch (error) {
    console.warn('Error stopping BGM:', error);
  }
};

export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'
): Promise<void> => {
  if (Platform.OS === 'web') return; // Haptics not supported on web
  
  const allowed = await shouldTriggerHaptic();
  if (!allowed) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    console.warn('Haptics failed:', error);
  }
};
