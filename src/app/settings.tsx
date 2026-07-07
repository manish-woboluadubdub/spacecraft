import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Switch, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { loadSettings, saveSettings, clearAllData, GameSettings } from '@/utils/storage';
import { playSFX, stopBGM, startBGM, triggerHaptic } from '@/utils/sound';
import { Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<GameSettings>({
    sfxEnabled: true,
    musicEnabled: true,
    hapticsEnabled: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const stored = await loadSettings();
      setSettings(stored);
    };
    fetchSettings();
  }, []);

  const handleToggle = async (key: keyof GameSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);

    // Audio action triggers
    if (key === 'sfxEnabled' && value) {
      playSFX('laser');
    }
    if (key === 'musicEnabled') {
      if (value) {
        startBGM();
      } else {
        stopBGM();
      }
    }
    if (key === 'hapticsEnabled' && value) {
      triggerHaptic('success');
    }
  };

  const handleResetData = async () => {
    const reset = async () => {
      await clearAllData();
      setSettings({
        sfxEnabled: true,
        musicEnabled: true,
        hapticsEnabled: true,
      });
      stopBGM();
      Alert.alert('Data Cleared', 'All scores and configurations have been reset.');
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Are you sure you want to reset all game data and leaderboard scores? This cannot be undone.');
      if (confirm) {
        await reset();
      }
    } else {
      Alert.alert(
        'Reset Game Data',
        'Are you sure you want to reset all game data and leaderboard scores? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Everything', style: 'destructive', onPress: reset },
        ]
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.subTitle}>
            SYSTEM CONFIGURATION
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            SETTINGS
          </ThemedText>
        </View>

        <View style={styles.menuContainer}>
          {/* Sound FX Toggle */}
          <View style={styles.menuRow}>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>Sound Effects</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.menuDescription}>
                SFX for spaceship lasers, explosions, and powerups
              </ThemedText>
            </View>
            <Switch
              value={settings.sfxEnabled}
              onValueChange={(val) => handleToggle('sfxEnabled', val)}
              trackColor={{ false: '#212225', true: '#ff007f' }}
              thumbColor={settings.sfxEnabled ? '#ffffff' : '#B0B4BA'}
            />
          </View>

          {/* Music Toggle */}
          <View style={styles.menuRow}>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>Ambient BGM</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.menuDescription}>
                Space synth background music loop
              </ThemedText>
            </View>
            <Switch
              value={settings.musicEnabled}
              onValueChange={(val) => handleToggle('musicEnabled', val)}
              trackColor={{ false: '#212225', true: '#ff007f' }}
              thumbColor={settings.musicEnabled ? '#ffffff' : '#B0B4BA'}
            />
          </View>

          {/* Haptics Toggle */}
          <View style={styles.menuRow}>
            <View style={styles.menuInfo}>
              <ThemedText style={styles.menuLabel}>Haptic Feedback</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.menuDescription}>
                Vibration effects during impacts and clicks
              </ThemedText>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(val) => handleToggle('hapticsEnabled', val)}
              disabled={Platform.OS === 'web'}
              trackColor={{ false: '#212225', true: '#ff007f' }}
              thumbColor={settings.hapticsEnabled ? '#ffffff' : '#B0B4BA'}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.resetButtonPressed,
            ]}
            onPress={handleResetData}
          >
            <ThemedText style={styles.resetButtonText}>RESET ALL DATA</ThemedText>
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary" style={styles.versionText}>
            Cosmic Voyager v1.0.0
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050f',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  subTitle: {
    color: '#00d2ff',
    letterSpacing: 2,
    fontSize: 11,
    marginBottom: Spacing.one,
  },
  title: {
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 210, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  menuContainer: {
    backgroundColor: 'rgba(33, 34, 37, 0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.two,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuInfo: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: Spacing.half,
  },
  menuDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.five,
  },
  resetButton: {
    width: '100%',
    maxWidth: 320,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ff007f',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  resetButtonPressed: {
    backgroundColor: 'rgba(255, 0, 127, 0.1)',
  },
  resetButtonText: {
    color: '#ff007f',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  versionText: {
    fontSize: 11,
  },
});
