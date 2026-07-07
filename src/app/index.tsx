import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { loadHighScore, loadSettings } from '@/utils/storage';
import { preloadSounds, playSFX, startBGM } from '@/utils/sound';
import { Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  opacity: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [highScore, setHighScore] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);

  // Generate random background stars
  useEffect(() => {
    const starCount = 30;
    const generatedStars = Array.from({ length: starCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * 500,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2000,
      opacity: 0.3 + Math.random() * 0.7,
    }));
    
    requestAnimationFrame(() => {
      setStars(generatedStars);
    });
    
    // Preload audio assets
    preloadSounds();
  }, []);

  // Reload high score whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const getScore = async () => {
        const score = await loadHighScore();
        if (isMounted) {
          setHighScore(score);
        }
      };
      getScore();
      
      // Auto-start ambient music if enabled
      const initBGM = async () => {
        const settings = await loadSettings();
        if (settings.musicEnabled && isMounted) {
          startBGM();
        }
      };
      initBGM();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleStartGame = async () => {
    await playSFX('laser');
    router.push('/play');
  };

  return (
    <ThemedView style={styles.container}>
      {/* Background Starfield */}
      <View style={StyleSheet.absoluteFill}>
        {stars.map((star, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.subTitle}>
            ARCADE SCI-FI ODYSSEY
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            COSMIC
          </ThemedText>
          <ThemedText type="title" style={[styles.title, styles.titleGlow]}>
            VOYAGER
          </ThemedText>
        </View>

        {/* Spaceship Graphic Placeholder (SVG-like styling using CSS) */}
        <View style={styles.shipContainer}>
          <View style={styles.shipThruster} />
          <View style={styles.shipWings} />
          <View style={styles.shipBody} />
          <View style={styles.shipCockpit} />
        </View>

        {/* Dashboard */}
        <View style={styles.dashboard}>
          <View style={styles.scoreBox}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.scoreLabel}>
              PERSONAL BEST
            </ThemedText>
            <ThemedText style={styles.scoreValue}>
              {highScore.toLocaleString()} PTS
            </ThemedText>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              pressed && styles.playButtonPressed,
            ]}
            onPress={handleStartGame}
          >
            <ThemedText style={styles.playButtonText}>LAUNCH MISSION</ThemedText>
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
            Dodge Asteroids. Collect Dust. Stay Alive.
          </ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050f', // Sleek space dark background
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 50,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  subTitle: {
    color: '#00d2ff', // Cyan theme
    letterSpacing: 3,
    fontSize: 12,
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    lineHeight: 56,
    textAlign: 'center',
  },
  titleGlow: {
    color: '#ff007f', // Cyberpunk neon pink
    textShadowColor: 'rgba(255, 0, 127, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  shipContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  shipBody: {
    width: 24,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff007f',
  },
  shipCockpit: {
    width: 12,
    height: 25,
    backgroundColor: '#00d2ff',
    borderRadius: 6,
    position: 'absolute',
    top: 35,
  },
  shipWings: {
    width: 60,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    position: 'absolute',
    top: 55,
    borderWidth: 2,
    borderColor: '#ff007f',
  },
  shipThruster: {
    width: 16,
    height: 35,
    backgroundColor: '#ff8c00', // Orange flame
    borderRadius: 8,
    position: 'absolute',
    bottom: 15,
    opacity: 0.8,
  },
  dashboard: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  scoreBox: {
    width: '100%',
    backgroundColor: 'rgba(33, 34, 37, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
  },
  scoreLabel: {
    letterSpacing: 1.5,
    fontSize: 11,
    marginBottom: Spacing.one,
  },
  scoreValue: {
    color: '#00d2ff',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  actionContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: Spacing.three,
  },
  playButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#ff007f',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff007f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  playButtonPressed: {
    backgroundColor: '#d6006b',
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
