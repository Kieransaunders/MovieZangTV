/**
 * Accessibility Utilities
 * Tools for improving app accessibility
 */

import { AccessibilityInfo, Platform } from 'react-native';
import { useState, useEffect } from 'react';

/**
 * Hook to detect screen reader state
 */
export const useScreenReader = (): {
  isScreenReaderEnabled: boolean;
  announceForAccessibility: (message: string) => void;
} => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  return {
    isScreenReaderEnabled,
    announceForAccessibility,
  };
};

/**
 * Accessibility labels for common UI elements
 */
export const AccessibilityLabels = {
  button: (action: string, context?: string): string => {
    return context ? `${action} button, ${context}` : `${action} button`;
  },

  input: (label: string, value?: string): string => {
    return value ? `${label} input, current value: ${value}` : `${label} input`;
  },

  card: (title: string, subtitle?: string): string => {
    return subtitle ? `${title}, ${subtitle}` : title;
  },

  movieCard: (title: string, year: number, genres: string[]): string => {
    const genreList = genres.join(', ');
    return `${title}, ${year}, genres: ${genreList}. Swipe right to like, swipe left to dislike.`;
  },

  votingProgress: (voted: number, total: number): string => {
    return `Voted on ${voted} out of ${total} movies`;
  },

  roomCode: (code: string): string => {
    return `Room code: ${code.split('').join(' ')}`;
  },
};

/**
 * Accessibility hints for interactive elements
 */
export const AccessibilityHints = {
  swipeCard: 'Swipe right to like this movie, swipe left to dislike',
  joinRoom: 'Enter a 4-digit room code to join an existing voting session',
  createRoom: 'Create a new room and invite friends to vote on movies',
  shareRoom: 'Share this room code with friends via messaging or social media',
  leaveRoom: 'Exit the current voting session and return to home',
};

/**
 * High contrast color utilities
 */
export const HighContrastColors = {
  enabled: false,

  toggle: (enabled: boolean): void => {
    HighContrastColors.enabled = enabled;
  },

  getText: (): string => {
    return HighContrastColors.enabled ? '#FFFFFF' : '#E5E5E7';
  },

  getBackground: (): string => {
    return HighContrastColors.enabled ? '#000000' : '#121212';
  },

  getPrimary: (): string => {
    return HighContrastColors.enabled ? '#f97316' : '#ef4444';
  },

  getError: (): string => {
    return HighContrastColors.enabled ? '#FF453A' : '#FF3B30';
  },
};

/**
 * Font scaling utilities
 */
export const FontScaling = {
  scale: (baseSize: number, scaleFactor: 'small' | 'medium' | 'large' = 'medium'): number => {
    const factors = {
      small: 0.9,
      medium: 1.0,
      large: 1.2,
    };

    return Math.round(baseSize * factors[scaleFactor]);
  },

  getAccessibleFontSize: (
    baseSize: number,
    userPreference: 'small' | 'medium' | 'large' = 'medium'
  ): number => {
    return FontScaling.scale(baseSize, userPreference);
  },
};

/**
 * Reduce motion utilities
 */
export const MotionSettings = {
  isReduceMotionEnabled: false,

  setReduceMotion: (enabled: boolean): void => {
    MotionSettings.isReduceMotionEnabled = enabled;
  },

  getAnimationDuration: (normalDuration: number): number => {
    return MotionSettings.isReduceMotionEnabled ? 0 : normalDuration;
  },

  shouldAnimate: (): boolean => {
    return !MotionSettings.isReduceMotionEnabled;
  },
};

/**
 * Accessibility state manager
 */
export class AccessibilityManager {
  private screenReaderEnabled: boolean = false;
  private highContrastEnabled: boolean = false;
  private fontSize: 'small' | 'medium' | 'large' = 'medium';
  private reduceMotion: boolean = false;

  async initialize(): Promise<void> {
    this.screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();

    // Listen for screen reader changes
    AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
      this.screenReaderEnabled = enabled;
    });
  }

  isScreenReaderEnabled(): boolean {
    return this.screenReaderEnabled;
  }

  setHighContrast(enabled: boolean): void {
    this.highContrastEnabled = enabled;
    HighContrastColors.toggle(enabled);
  }

  isHighContrastEnabled(): boolean {
    return this.highContrastEnabled;
  }

  setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.fontSize = size;
  }

  getFontSize(): 'small' | 'medium' | 'large' {
    return this.fontSize;
  }

  setReduceMotion(enabled: boolean): void {
    this.reduceMotion = enabled;
    MotionSettings.setReduceMotion(enabled);
  }

  isReduceMotionEnabled(): boolean {
    return this.reduceMotion;
  }

  announce(message: string): void {
    if (this.screenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }
}

export const accessibilityManager = new AccessibilityManager();
