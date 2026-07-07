import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { loadLeaderboard, LeaderboardEntry } from '@/utils/storage';
import { Spacing } from '@/constants/theme';
import { useFocusEffect } from 'expo-router';

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  // Load scores whenever the tab is selected
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const getLeaderboard = async () => {
        const scores = await loadLeaderboard();
        if (isMounted) {
          setEntries(scores);
        }
      };
      getLeaderboard();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    // Styling based on rank
    const isTopThree = index < 3;
    const rankColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff';
    
    return (
      <View style={[styles.entryRow, isTopThree && styles.topThreeRow]}>
        <View style={styles.rankContainer}>
          <ThemedText style={[styles.rankText, { color: rankColor }]}>
            #{index + 1}
          </ThemedText>
        </View>
        <View style={styles.dateContainer}>
          <ThemedText type="small" themeColor="textSecondary">
            {item.date}
          </ThemedText>
        </View>
        <View style={styles.scoreContainer}>
          <ThemedText style={styles.scoreText}>
            {item.score.toLocaleString()}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="smallBold" style={styles.subTitle}>
            GALACTIC RANKINGS
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            LEADERBOARD
          </ThemedText>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <View style={styles.emptyIconRing} />
              <View style={styles.emptyIconDot} />
            </View>
            <ThemedText type="default" style={styles.emptyText}>
              No log entries found.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubText}>
              Complete a mission in Home to log your score!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.headerRank}>
                RANK
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.headerDate}>
                DATE
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.headerScore}>
                SCORE
              </ThemedText>
            </View>

            <FlatList
              data={entries}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.score}-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
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
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(33, 34, 37, 0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: Spacing.four,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(33, 34, 37, 0.6)',
  },
  headerRank: {
    width: 60,
  },
  headerDate: {
    flex: 1,
  },
  headerScore: {
    width: 100,
    textAlign: 'right',
  },
  listContent: {
    paddingVertical: Spacing.two,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  topThreeRow: {
    backgroundColor: 'rgba(255, 0, 127, 0.03)',
  },
  rankContainer: {
    width: 60,
  },
  rankText: {
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 16,
  },
  dateContainer: {
    flex: 1,
  },
  scoreContainer: {
    width: 100,
  },
  scoreText: {
    color: '#00d2ff',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  emptyIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ff007f',
    position: 'absolute',
    opacity: 0.5,
  },
  emptyIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00d2ff',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  emptySubText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
