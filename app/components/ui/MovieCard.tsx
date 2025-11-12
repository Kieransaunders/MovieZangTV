/**
 * MovieCard Swipeable Component
 * Swipeable card for movie voting with gesture support
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Platform,
  useTVEventHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from 'app/types/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const IS_TV = Platform.isTV;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.18; // ~70-80px on most phones, similar to web's 80px
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger swipe with less distance

interface MovieCardProps {
  movie: Movie;
  onSwipeLeft: (movie: Movie) => void;
  onSwipeRight: (movie: Movie) => void;
  isTopCard?: boolean;
  cardHeight?: number;
}

// Store focus state outside component to persist across movie changes
let lastFocusedButton: 'nope' | 'like' = 'like';

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSwipeLeft,
  onSwipeRight,
  isTopCard = false,
  cardHeight,
}) => {
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dislikeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTopCard,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        const hasVelocity = Math.abs(gesture.vx) > SWIPE_VELOCITY_THRESHOLD;
        const reducedThreshold = hasVelocity ? SWIPE_THRESHOLD * 0.5 : SWIPE_THRESHOLD;

        if (gesture.dx > reducedThreshold) {
          // Swipe right - Like
          forceSwipe('right');
        } else if (gesture.dx < -reducedThreshold) {
          // Swipe left - Dislike
          forceSwipe('left');
        } else {
          // Return to center
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (direction === 'right') {
        onSwipeRight(movie);
      } else {
        onSwipeLeft(movie);
      }
      position.setValue({ x: 0, y: 0 });
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const animatedStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  const dynamicCardStyle = {
    ...styles.card,
    height: cardHeight || SCREEN_WIDTH * 1.05,
  };

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  // TV-optimized horizontal layout
  if (IS_TV) {
    const [focusedButton, setFocusedButton] = useState<'nope' | 'like'>(lastFocusedButton);

    // Use the hook-based TV event handler
    const handleTVEvent = (evt: any) => {
      if (evt && evt.eventType) {
        console.log('TV Event:', evt.eventType);

        if (evt.eventType === 'right') {
          console.log('Right pressed, switching to Like');
          setFocusedButton('like');
          lastFocusedButton = 'like';
        } else if (evt.eventType === 'left') {
          console.log('Left pressed, switching to Nope');
          setFocusedButton('nope');
          lastFocusedButton = 'nope';
        } else if (evt.eventType === 'select') {
          console.log('Select pressed on:', focusedButton);
          if (focusedButton === 'nope') {
            onSwipeLeft(movie);
          } else {
            onSwipeRight(movie);
          }
        }
      }
    };

    useTVEventHandler(handleTVEvent);

    return (
      <View style={tvStyles.wrapper}>
        <View style={tvStyles.container}>
          {/* Left side - Movie Poster */}
          <View style={tvStyles.posterSection}>
            <Image
              source={{
                uri: movie.poster_path
                  ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
                  : 'https://via.placeholder.com/600x900/333/fff?text=No+Image'
              }}
              style={tvStyles.poster}
              resizeMode="cover"
            />
            {/* Rating badge */}
            {movie.vote_average && (
              <View style={tvStyles.ratingBadge}>
                <Ionicons name="star" size={24} color="#0F0F23" />
                <Text style={tvStyles.ratingText}>
                  {movie.vote_average.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Right side - Movie Info */}
          <View style={tvStyles.infoSection}>
            <View>
              <Text style={tvStyles.title}>{movie.title}</Text>

              {/* Metadata row with rating */}
              <View style={tvStyles.metadataRow}>
                {movie.vote_average && (
                  <View style={tvStyles.metadataItem}>
                    <Ionicons name="star" size={28} color="#FDB927" />
                    <Text style={tvStyles.metadataText}>{movie.vote_average.toFixed(1)}/10</Text>
                  </View>
                )}
                {releaseYear && (
                  <View style={tvStyles.metadataItem}>
                    <Ionicons name="calendar-outline" size={28} color="#8E8E93" />
                    <Text style={tvStyles.metadataText}>{releaseYear}</Text>
                  </View>
                )}
                {movie.runtime && (
                  <View style={tvStyles.metadataItem}>
                    <Ionicons name="time-outline" size={28} color="#8E8E93" />
                    <Text style={tvStyles.metadataText}>{movie.runtime}m</Text>
                  </View>
                )}
              </View>

              {/* Streaming platforms */}
              {movie.streaming_platforms && (
                <View style={tvStyles.streamingSection}>
                  <View style={tvStyles.streamingSectionHeader}>
                    <Ionicons name="play-circle-outline" size={28} color="#8E8E93" />
                    <Text style={tvStyles.streamingTitle}>Available on:</Text>
                  </View>
                  <View style={tvStyles.streamingList}>
                    {Object.entries(movie.streaming_platforms).map(([country, availability]) => {
                      const providers = availability.flatrate || availability.ads || availability.free || [];
                      return providers.slice(0, 4).map((provider, idx) => (
                        <View key={`${country}-${provider.provider_id}-${idx}`} style={tvStyles.streamingBadge}>
                          <Text style={tvStyles.streamingBadgeText}>{provider.provider_name}</Text>
                        </View>
                      ));
                    })}
                  </View>
                </View>
              )}

              {/* Overview */}
              {movie.overview && (
                <View style={tvStyles.overviewSection}>
                  <Text style={tvStyles.overviewLabel}>Plot:</Text>
                  <Text style={tvStyles.overview} numberOfLines={5}>{movie.overview}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={tvStyles.actionButtonsContainer}>
              <TouchableOpacity
                style={[
                  tvStyles.nopeButton,
                  focusedButton === 'nope' && tvStyles.nopeButtonFocused
                ]}
                onPress={() => {
                  console.log('Nope pressed via touch');
                  onSwipeLeft(movie);
                }}
                activeOpacity={0.7}
                tvParallaxProperties={focusedButton === 'nope' ? {
                  enabled: true,
                  shiftDistanceX: 5,
                  shiftDistanceY: 5,
                  tiltAngle: 0.15,
                  magnification: 1.2,
                  pressMagnification: 1.0,
                } : undefined}
              >
                <Text style={tvStyles.nopeButtonText}>Nope</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  tvStyles.likeButton,
                  focusedButton === 'like' && tvStyles.likeButtonFocused
                ]}
                onPress={() => {
                  console.log('Like pressed via touch');
                  onSwipeRight(movie);
                }}
                activeOpacity={0.7}
                tvParallaxProperties={focusedButton === 'like' ? {
                  enabled: true,
                  shiftDistanceX: 5,
                  shiftDistanceY: 5,
                  tiltAngle: 0.15,
                  magnification: 1.2,
                  pressMagnification: 1.0,
                } : undefined}
              >
                <Text style={tvStyles.likeButtonText}>Like</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Mobile layout (original)
  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[dynamicCardStyle, animatedStyle]}
        {...panResponder.panHandlers}
      >
        {/* Dislike overlay */}
        <Animated.View style={[styles.overlay, styles.dislikeOverlay, { opacity: dislikeOpacity }]}>
          <Text style={styles.overlayText}>NOPE</Text>
        </Animated.View>

        {/* Like overlay */}
        <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>

        {/* Movie poster with gradient overlay */}
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'https://via.placeholder.com/300x450/333/fff?text=No+Image'
            }}
            style={styles.poster}
            resizeMode="contain"
          />
          {/* Gradient overlay for better text visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(28, 28, 30, 0.8)']}
            style={styles.posterGradient}
            pointerEvents="none"
          />

          {/* Rating badge */}
          {movie.vote_average && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#0F0F23" />
              <Text style={styles.ratingText}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Movie info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoContent}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>

            {/* Metadata row */}
            <View style={styles.metadataRow}>
              {releaseYear && (
                <View style={styles.metadataItem}>
                  <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
                  <Text style={styles.metadataText}>{releaseYear}</Text>
                </View>
              )}
              {movie.runtime && (
                <View style={styles.metadataItem}>
                  <Ionicons name="time-outline" size={14} color="#8E8E93" />
                  <Text style={styles.metadataText}>{movie.runtime}m</Text>
                </View>
              )}
            </View>

            {movie.overview && (
              <Text style={styles.overview} numberOfLines={4}>
                {movie.overview}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Action Buttons - Now outside the card */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.nopeButton}
          onPress={() => onSwipeLeft(movie)}
        >
          <Text style={styles.nopeButtonText}>✕ Nope</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => onSwipeRight(movie)}
        >
          <LinearGradient
            colors={['#ef4444', '#f97316']}
            style={styles.likeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.likeButtonText}>♥ Like</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.88,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  posterContainer: {
    width: '100%',
    height: '70%',
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDB927',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F0F23',
  },
  infoContainer: {
    flex: 1,
    height: '30%',
  },
  infoContent: {
    padding: 16,
    paddingBottom: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 26,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  overview: {
    fontSize: 13,
    color: '#B0B0B5',
    lineHeight: 18,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: SCREEN_WIDTH * 0.88,
    marginTop: 20,
  },
  nopeButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  nopeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  likeButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  likeButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  likeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    zIndex: 1,
    borderWidth: 3,
    borderRadius: 8,
    padding: 8,
  },
  likeOverlay: {
    right: 50,
    borderColor: '#34C759',
  },
  dislikeOverlay: {
    left: 50,
    borderColor: '#FF3B30',
  },
  overlayText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

// TV-optimized styles
const tvStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 80,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    width: '100%',
  },
  posterSection: {
    width: '40%',
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDB927',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F0F23',
  },
  infoSection: {
    flex: 1,
    padding: 48,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    lineHeight: 56,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    marginBottom: 32,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metadataText: {
    fontSize: 24,
    color: '#8E8E93',
    fontWeight: '500',
  },
  streamingSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  streamingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  streamingTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
  },
  streamingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  streamingBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  streamingBadgeText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
  },
  overviewSection: {
    marginBottom: 32,
  },
  overviewLabel: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  overview: {
    fontSize: 20,
    color: '#B0B0B5',
    lineHeight: 32,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 32,
  },
  nopeButton: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#ef4444',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 12,
  },
  nopeButtonFocused: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ff5555',
    borderWidth: 5,
  },
  nopeButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  likeButton: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    gap: 12,
  },
  likeButtonFocused: {
    backgroundColor: '#f97316',
    transform: [{ scale: 1.05 }],
  },
  likeButtonGradient: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 12,
  },
  likeButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default MovieCard;
