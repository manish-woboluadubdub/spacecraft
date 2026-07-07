import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import GameCanvas from '@/components/GameCanvas';
import { loadHighScore, saveHighScore, addLeaderboardEntry } from '@/utils/storage';
import { playSFX, triggerHaptic, stopBGM } from '@/utils/sound';
import { Spacing } from '@/constants/theme';

export default function PlayScreen() {
  const router = useRouter();

  // Game metrics
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [shieldActive, setShieldActive] = useState(false);
  const [blasterActive, setBlasterActive] = useState(false);

  // States
  const [countdown, setCountdown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // 1. Initial Countdown
  useEffect(() => {
    let count = 3;
    playSFX('laser'); // Initial beep

    const timer = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(timer);
        setIsPlaying(true);
        setCountdown(0);
      } else {
        setCountdown(count);
        playSFX('laser'); // subsequent beeps
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Handle Game Over Save Score logic
  const handleGameOver = async (finalScore: number) => {
    setIsGameOver(true);
    setIsPlaying(false);
    stopBGM(); // Stop ambient space music

    try {
      const prevHighScore = await loadHighScore();
      if (finalScore > prevHighScore) {
        setIsNewHighScore(true);
        await saveHighScore(finalScore);
      }
      await addLeaderboardEntry(finalScore);
    } catch (e) {
      console.error('Error saving score:', e);
    }
  };

  const handleRestart = () => {
    playSFX('laser');
    setScore(0);
    setLives(3);
    setShieldActive(false);
    setBlasterActive(false);
    setIsGameOver(false);
    setIsNewHighScore(false);
    setIsPaused(false);
    setCountdown(3);
    setIsPlaying(false);
  };

  const handleExit = () => {
    playSFX('laser');
    stopBGM();
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const togglePause = () => {
    triggerHaptic('light');
    setIsPaused((p) => !p);
  };

  return (
    <ThemedView style={styles.container}>
      {/* 3. Main Gameplay HUD & Canvas */}
      {isPlaying && (
        <SafeAreaView style={styles.hudContainer}>
          <View style={styles.hudHeader}>
            {/* Lives Indicators */}
            <View style={styles.hudItem}>
              <ThemedText type="code" themeColor="textSecondary">LIVES</ThemedText>
              <View style={styles.livesRow}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.lifeDot,
                      i < lives ? styles.lifeDotActive : styles.lifeDotDead,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Score */}
            <View style={[styles.hudItem, styles.hudCenter]}>
              <ThemedText type="code" themeColor="textSecondary">SCORE</ThemedText>
              <ThemedText style={styles.hudScoreText}>{score}</ThemedText>
            </View>

            {/* Pause Control */}
            <Pressable
              style={({ pressed }) => [styles.pauseButton, pressed && styles.hudButtonPressed]}
              onPress={togglePause}
            >
              <ThemedText style={styles.pauseButtonText}>
                {isPaused ? 'RESUME' : 'PAUSE'}
              </ThemedText>
            </Pressable>
          </View>

          {/* Active Power-up Badges */}
          <View style={styles.powerupBadgesContainer}>
            {shieldActive && (
              <View style={[styles.badge, styles.shieldBadge]}>
                <ThemedText style={styles.badgeText}>SHIELD ACTIVE</ThemedText>
              </View>
            )}
            {blasterActive && (
              <View style={[styles.badge, styles.blasterBadge]}>
                <ThemedText style={styles.badgeText}>BLASTERS HOT</ThemedText>
              </View>
            )}
          </View>
        </SafeAreaView>
      )}

      {/* 4. The Canvas View */}
      {countdown === 0 && (
        <GameCanvas
          isPaused={isPaused}
          isGameOver={isGameOver}
          onScoreUpdate={setScore}
          onLivesUpdate={setLives}
          onShieldUpdate={setShieldActive}
          onBlasterUpdate={setBlasterActive}
          onGameOverTrigger={handleGameOver}
        />
      )}

      {/* 5. Start Game Countdown Overlay */}
      {countdown > 0 && (
        <View style={styles.overlayContainer}>
          <ThemedText style={styles.countdownNumber}>{countdown}</ThemedText>
          <ThemedText style={styles.countdownSubText}>GET READY</ThemedText>
        </View>
      )}

      {/* 6. Pause Modal Overlay */}
      <Modal visible={isPaused && !isGameOver} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              MISSION PAUSED
            </ThemedText>
            
            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <ThemedText type="small" themeColor="textSecondary">CURRENT SCORE</ThemedText>
                <ThemedText style={styles.modalStatValue}>{score}</ThemedText>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.modalBtn, styles.modalBtnPrimary, pressed && styles.pressed]}
              onPress={togglePause}
            >
              <ThemedText style={styles.modalBtnTextPrimary}>RESUME FLIGHT</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modalBtn, styles.modalBtnSecondary, pressed && styles.pressed]}
              onPress={handleExit}
            >
              <ThemedText style={styles.modalBtnTextSecondary}>ABORT MISSION</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 7. Game Over Modal Overlay */}
      <Modal visible={isGameOver} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, styles.gameOverContent]}>
            {isNewHighScore && (
              <View style={styles.newRecordBadge}>
                <ThemedText style={styles.newRecordText}>NEW RECORD</ThemedText>
              </View>
            )}

            <ThemedText type="subtitle" style={[styles.modalTitle, styles.gameOverTitle]}>
              MISSION FAILURE
            </ThemedText>

            <ThemedText type="small" themeColor="textSecondary" style={styles.gameOverSubTitle}>
              Your ship collided with an asteroid.
            </ThemedText>

            <View style={styles.gameOverScoreContainer}>
              <ThemedText type="small" themeColor="textSecondary">FINAL SCORE</ThemedText>
              <ThemedText style={styles.gameOverScoreValue}>{score}</ThemedText>
            </View>

            <Pressable
              style={({ pressed }) => [styles.modalBtn, styles.modalBtnPrimary, pressed && styles.pressed]}
              onPress={handleRestart}
            >
              <ThemedText style={styles.modalBtnTextPrimary}>REDEPLOY</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modalBtn, styles.modalBtnSecondary, pressed && styles.pressed]}
              onPress={handleExit}
            >
              <ThemedText style={styles.modalBtnTextSecondary}>RETURN TO HQ</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030308',
  },
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.four,
    backgroundColor: 'rgba(5, 5, 15, 0.4)',
  },
  hudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  hudItem: {
    minWidth: 80,
  },
  hudCenter: {
    alignItems: 'center',
  },
  livesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.half,
  },
  lifeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lifeDotActive: {
    backgroundColor: '#ff007f', // Red/Pink alive
    shadowColor: '#ff007f',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  lifeDotDead: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  hudScoreText: {
    color: '#00d2ff', // Cyan
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: Spacing.half,
  },
  pauseButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  hudButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  powerupBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    borderWidth: 1,
  },
  shieldBadge: {
    borderColor: '#00d2ff',
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
  },
  blasterBadge: {
    borderColor: '#a020f0',
    backgroundColor: 'rgba(160, 32, 240, 0.1)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030308',
  },
  countdownNumber: {
    fontSize: 100,
    fontWeight: '900',
    color: '#ff007f',
    textShadowColor: 'rgba(255, 0, 127, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  countdownSubText: {
    color: '#00d2ff',
    letterSpacing: 4,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 3, 8, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0c0d14',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.3)',
    borderRadius: 24,
    padding: Spacing.five,
    alignItems: 'center',
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  modalTitle: {
    fontWeight: '800',
    color: '#00d2ff',
    letterSpacing: 1.5,
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  modalStats: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: Spacing.one,
    fontFamily: 'monospace',
  },
  modalBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.one,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  modalBtnPrimary: {
    backgroundColor: '#ff007f',
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalBtnTextPrimary: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  modalBtnSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalBtnTextSecondary: {
    color: '#B0B4BA',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  pressed: {
    opacity: 0.8,
  },
  gameOverContent: {
    borderColor: 'rgba(255, 0, 127, 0.3)',
    shadowColor: '#ff007f',
  },
  gameOverTitle: {
    color: '#ff007f',
    fontSize: 26,
    marginBottom: Spacing.one,
  },
  gameOverSubTitle: {
    fontSize: 12,
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  gameOverScoreContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  gameOverScoreValue: {
    fontSize: 36,
    fontWeight: '950',
    color: '#ff007f',
    marginTop: Spacing.one,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(255, 0, 127, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  newRecordBadge: {
    backgroundColor: '#ffd700',
    paddingVertical: 4,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
    marginBottom: Spacing.two,
  },
  newRecordText: {
    color: '#030308',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
