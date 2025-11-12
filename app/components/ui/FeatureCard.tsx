/**
 * FeatureCard Component
 * Card component for displaying app features with icons
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from 'app/theme';

interface FeatureCardProps {
  title: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  iconName,
}) => {
  // Determine icon based on title if not provided
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (iconName) return iconName;

    if (title.includes('Quick') || title.includes('Easy')) return 'flash';
    if (title.includes('Match')) return 'heart';
    if (title.includes('Save') || title.includes('Track')) return 'bookmark';
    return 'checkmark-circle';
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(239, 68, 68, 0.1)', 'rgba(249, 115, 22, 0.05)']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.2)', 'rgba(249, 115, 22, 0.1)']}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={getIconName()} size={24} color="#ef4444" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    padding: spacing._20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});
