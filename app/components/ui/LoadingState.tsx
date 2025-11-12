/**
 * Loading State Component
 * Skeleton screens and loading indicators
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  Animated,
  Easing,
} from 'react-native';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'medium',
  style,
}) => {
  if (variant === 'spinner') {
    const spinnerSize = size === 'small' ? 'small' : 'large';

    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size={spinnerSize} color="#ef4444" />
      </View>
    );
  }

  return <SkeletonLoader size={size} style={style} />;
};

interface SkeletonLoaderProps {
  size: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ size, style }) => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const heights = {
    small: 40,
    medium: 80,
    large: 120,
  };

  return (
    <View style={[styles.skeletonContainer, style]}>
      <Animated.View
        style={[
          styles.skeleton,
          { height: heights[size], opacity },
        ]}
      />
    </View>
  );
};

// Loading screens for specific components
export const MovieCardSkeleton: React.FC = () => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.movieCardSkeleton}>
      <Animated.View style={[styles.posterSkeleton, { opacity }]} />
      <View style={styles.infoSkeleton}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.yearSkeleton, { opacity }]} />
      </View>
    </View>
  );
};

export const RoomListSkeleton: React.FC = () => {
  const items = [1, 2, 3];

  return (
    <View style={styles.listSkeleton}>
      {items.map((key) => (
        <SkeletonLoader key={key} size="medium" style={styles.listItem} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: 8,
  },
  skeleton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  movieCardSkeleton: {
    width: '90%',
    height: 500,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
  },
  posterSkeleton: {
    width: '100%',
    height: '75%',
    backgroundColor: '#2C2C2E',
  },
  infoSkeleton: {
    padding: 16,
    height: '25%',
  },
  titleSkeleton: {
    height: 24,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    marginBottom: 8,
  },
  yearSkeleton: {
    height: 16,
    width: '40%',
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
  },
  listSkeleton: {
    padding: 16,
  },
  listItem: {
    marginBottom: 16,
  },
});

export default LoadingState;
