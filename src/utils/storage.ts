import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameSettings {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface LeaderboardEntry {
  score: number;
  date: string;
}

const KEYS = {
  SETTINGS: 'cosmic_voyager_settings',
  HIGH_SCORE: 'cosmic_voyager_high_score',
  LEADERBOARD: 'cosmic_voyager_leaderboard',
};

const DEFAULT_SETTINGS: GameSettings = {
  sfxEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
};

export const loadSettings = async (): Promise<GameSettings> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = async (settings: GameSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const loadHighScore = async (): Promise<number> => {
  try {
    const score = await AsyncStorage.getItem(KEYS.HIGH_SCORE);
    return score ? parseInt(score, 10) : 0;
  } catch (error) {
    console.error('Failed to load high score:', error);
    return 0;
  }
};

export const saveHighScore = async (score: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.HIGH_SCORE, score.toString());
  } catch (error) {
    console.error('Failed to save high score:', error);
  }
};

export const loadLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LEADERBOARD);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.score - a.score).slice(0, 10);
      }
    }
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  }
  return [];
};

export const addLeaderboardEntry = async (score: number): Promise<LeaderboardEntry[]> => {
  try {
    const current = await loadLeaderboard();
    const newEntry: LeaderboardEntry = {
      score,
      date: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    const updated = [...current, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10
    await AsyncStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to add leaderboard entry:', error);
    return [];
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.SETTINGS);
    await AsyncStorage.removeItem(KEYS.HIGH_SCORE);
    await AsyncStorage.removeItem(KEYS.LEADERBOARD);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
};
