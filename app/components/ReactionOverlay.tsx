/**
 * ReactionOverlay Component
 * Displays floating vote reactions (like/dislike emojis) in real-time
 * React Native version with Animated API
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Reaction {
  _id: string;
  participantId: string;
  reaction: 'like' | 'dislike';
  createdAt: number;
  movieTitle?: string;
}

interface ReactionOverlayProps {
  reactions: Reaction[];
  currentParticipant: string;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  participantName: string;
  movieTitle: string;
  x: number;
  y: number;
  timestamp: number;
  animation: Animated.Value;
}

export function ReactionOverlay({ reactions, currentParticipant }: ReactionOverlayProps) {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (!reactions || reactions.length === 0) return;

    // Filter out user's own reactions and add new reactions
    const newReactions = reactions
      .filter((r) => r.participantId !== currentParticipant)
      .map((r) => ({
        id: r._id,
        emoji: r.reaction === 'like' ? '❤️' : '👎',
        participantName: r.participantId,
        movieTitle: r.movieTitle || 'Unknown Movie',
        x: Math.random() * (SCREEN_WIDTH - 150) + 20, // Random x position with padding
        y: SCREEN_HEIGHT * 0.3 + Math.random() * (SCREEN_HEIGHT * 0.4), // Middle area
        timestamp: r.createdAt,
        animation: new Animated.Value(0),
      }));

    // Add new reactions that aren't already displayed
    setFloatingReactions((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const toAdd = newReactions.filter((r) => !existingIds.has(r.id));

      // Animate new reactions
      toAdd.forEach((reaction) => {
        Animated.timing(reaction.animation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }).start();
      });

      return [...prev, ...toAdd];
    });

    // Remove reactions older than 3 seconds
    const timeout = setTimeout(() => {
      const threeSecondsAgo = Date.now() - 3000;
      setFloatingReactions((prev) =>
        prev.filter((r) => r.timestamp > threeSecondsAgo)
      );
    }, 100);

    return () => clearTimeout(timeout);
  }, [reactions, currentParticipant]);

  return (
    <View style={styles.container} pointerEvents="none">
      {floatingReactions.map((reaction) => {
        // Animate upward movement and fade out
        const translateY = reaction.animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -100], // Move up 100 pixels
        });

        const opacity = reaction.animation.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0], // Fade out in the last 30%
        });

        return (
          <Animated.View
            key={reaction.id}
            style={[
              styles.reactionContainer,
              {
                left: reaction.x,
                top: reaction.y,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <View style={styles.reactionContent}>
              <Text style={styles.emoji}>{reaction.emoji}</Text>
              <View style={styles.labelContainer}>
                <View style={styles.participantLabel}>
                  <Text style={styles.participantText} numberOfLines={1}>
                    {reaction.participantName}
                  </Text>
                </View>
                <View style={styles.movieLabel}>
                  <Text style={styles.movieText} numberOfLines={1}>
                    {reaction.movieTitle}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  reactionContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  reactionContent: {
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  labelContainer: {
    alignItems: 'center',
    gap: 2,
  },
  participantLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    maxWidth: 150,
  },
  participantText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  movieLabel: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    maxWidth: 200,
  },
  movieText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
});

export default ReactionOverlay;
