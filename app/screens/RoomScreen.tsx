/**
 * RoomScreen Component
 * Main room screen with movie card swiping interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { RoomScreenProps } from 'app/types/navigation';
import { MovieCard } from 'app/components/ui/MovieCard';
import { Button } from 'app/components/ui/Button';
import { useVoting } from 'app/hooks/useVoting';
import { useRoom } from 'app/hooks/useRoom';
import { useVotingCompletion } from 'app/hooks/useVotingCompletion';
import { useRoomPresence } from 'app/hooks/useRoomPresence';
import { Movie } from 'app/types/supabase';
import ParticipantsList from 'app/components/ParticipantsList';
import { ImageOptimization } from 'app/utils/performance';
import ReactionOverlay from 'app/components/ReactionOverlay';
import { FloatingChatButton } from 'app/components/FloatingChatButton';
import { ChatPanel } from 'app/components/ChatPanel';
import { spacing } from 'app/theme';

// Mock movies - Fallback movies matching web app structure
const MOCK_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'The Matrix',
    poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    overview: 'A computer programmer is led to fight an underground war against powerful computers who have constructed his entire reality with a system called the Matrix.',
    release_date: '1999-03-31',
    tmdb_id: 603,
    genre_ids: [28, 878],
    streaming_platforms: {
      US: {
        flatrate: [{ provider_id: 8, provider_name: 'Netflix' }]
      }
    },
  },
  {
    id: '2',
    title: 'Inception',
    poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    overview: 'Dom Cobb is a skilled thief, the absolute best in the dangerous art of extraction, stealing valuable secrets from deep within the subconscious during the dream state.',
    release_date: '2010-07-16',
    tmdb_id: 27205,
    genre_ids: [28, 878, 53],
    streaming_platforms: {
      US: {
        flatrate: [{ provider_id: 9, provider_name: 'Prime Video' }]
      }
    },
  },
];

const RoomScreen: React.FC<RoomScreenProps> = ({ navigation, route }) => {
  const { roomId, roomCode, participantName } = route.params;
  const { participants, leaveRoom } = useRoom(roomId as Id<'rooms'>);
  const votingCompletion = useVotingCompletion(roomId);
  const markVotingCompleteMutation = useMutation(api.votes.markVotingComplete);
  const recordVoteReactionMutation = useMutation(api.voteReactions.recordVoteReaction);
  const insets = useSafeAreaInsets();

  // Get recent vote reactions for live display
  const recentReactions = useQuery(
    api.voteReactions.getRecentReactions,
    roomId ? { roomId: roomId as Id<'rooms'> } : 'skip'
  );
  
  // Calculate available space for the card
  const screenHeight = Dimensions.get('window').height;
  const headerHeight = 80; // Approximate header height
  const footerHeight = 20; // Bottom padding
  const availableHeight = screenHeight - insets.top - insets.bottom - headerHeight - footerHeight;
  const maxCardHeight = Math.min(Dimensions.get('window').width * 1.25, availableHeight * 0.85);

  
  // Fetch voting movies from Convex (real-time)
  const votingMoviesData = useQuery(
    api.votingMovies.getRoomMovies,
    roomId ? { roomId: roomId as Id<'rooms'> } : 'skip'
  );

  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Convert Convex movies to Movie type for compatibility
  // getRoomMovies returns movie objects directly, not wrapped in { movie: ... }
  const movies: Movie[] = votingMoviesData
    ?.filter((movie) => {
      if (!movie || !movie._id) {
        console.warn('RoomScreen: Found invalid movie entry:', movie);
        return false;
      }
      return true;
    })
    ?.map((movie) => ({
      id: movie._id,
      tmdb_id: movie.tmdbId,
      title: movie.title,
      overview: movie.overview || '',
      poster_path: movie.posterPath || null,
      release_date: movie.releaseDate || null,
      genre_ids: movie.genreIds || [],
      streaming_platforms: movie.streamingPlatforms || null,
      vote_average: movie.voteAverage || undefined,
      runtime: movie.runtime || undefined,
    })) || [];

  console.log(`RoomScreen: Loaded ${movies.length} movies for room ${roomId}`);

  const { submitVote, myVotes, getVotingProgress } = useVoting(roomId, participantName, movies);

  // Use room presence for online status and typing indicators
  const { typingUsers, setTypingStatus } = useRoomPresence({
    roomId: roomId as Id<'rooms'>,
    participantName,
  });

  // Get chat messages for unread count
  const messages = useQuery(
    api.messages.getRecentMessages,
    roomId ? { roomId: roomId as Id<'rooms'> } : 'skip'
  );

  const progress = getVotingProgress();
  const currentMovie = movies[currentIndex];
  const hasFinishedVoting = currentIndex >= movies.length && movies.length > 0;
  const isLoadingMovies = votingMoviesData === undefined;

  const votingStats = votingCompletion;

  const participantNames = votingStats.participantIds;
  const completedNameList = votingStats.completedParticipantIds;
  const pendingDisplayNames = votingStats.pendingParticipantIds;

  const participantCount = votingStats.totalParticipants;
  const completedCount = votingStats.completedParticipants;
  const pendingCount = votingStats.pendingParticipants;
  const completionPercentage = votingStats.completionPercentage;
  const everyoneDone = votingStats.isAllComplete;

  const participantsForList = votingStats.participantIds;

  // Track unread messages
  useEffect(() => {
    if (messages) {
      const currentMessageCount = messages.length;
      if (lastMessageCount > 0 && currentMessageCount > lastMessageCount && !showChat) {
        // New messages arrived while chat is closed
        setUnreadCount(prev => prev + (currentMessageCount - lastMessageCount));
      }
      setLastMessageCount(currentMessageCount);
    }
  }, [messages, lastMessageCount, showChat]);

  // Prefetch movie images for smooth swiping
  useEffect(() => {
    if (movies.length > 0) {
      // Prefetch first 3 movie images immediately
      const initialUrls = movies
        .slice(0, 3)
        .filter((m: Movie) => m.poster_path)
        .map((m: Movie) => `https://image.tmdb.org/t/p/w500${m.poster_path}`);

      if (initialUrls.length > 0) {
        ImageOptimization.prefetchImages(initialUrls).catch(() => {
          // Silently fail - prefetching is an optimization
        });
      }
    }
  }, [movies]);

  // Mark voting as complete when user finishes last movie
  useEffect(() => {
    const markVotingComplete = async () => {
      if (hasFinishedVoting && !hasMarkedComplete) {
        try {
          console.log('Marking voting complete for participant:', participantName);

          await markVotingCompleteMutation({
            roomId: roomId as Id<'rooms'>,
            participantName,
          });

          setHasMarkedComplete(true);
          console.log('Successfully marked voting complete');
        } catch (err) {
          console.error('Exception marking voting complete:', err);
        }
      }
    };

    markVotingComplete();
  }, [hasFinishedVoting, hasMarkedComplete, roomId, participantName, markVotingCompleteMutation]);

  // Prefetch next movie images to eliminate flash when swiping
  useEffect(() => {
    const prefetchNextImages = async () => {
      if (movies.length === 0) return;

      // Prefetch the next 3 movie posters
      const nextMovies = movies.slice(currentIndex + 1, currentIndex + 4);
      const urls = nextMovies
        .filter(m => m.poster_path)
        .map(m => `https://image.tmdb.org/t/p/w500${m.poster_path}`);

      if (urls.length > 0) {
        try {
          await ImageOptimization.prefetchImages(urls);
        } catch (error) {
          // Silently fail - prefetching is an optimization, not critical
          console.log('Image prefetch failed:', error);
        }
      }
    };

    prefetchNextImages();
  }, [currentIndex, movies]);

  const handleSwipeLeft = async (movie: Movie) => {
    await submitVote({
      room_id: roomId,
      participant_id: participantName,
      movie_id: movie.id,
      vote_type: 'dislike',
    });

    // Record vote reaction for live display
    try {
      await recordVoteReactionMutation({
        roomId: roomId as Id<'rooms'>,
        movieId: movie.id as Id<'movies'>,
        participantId: participantName,
        reaction: 'dislike',
      });
    } catch (error) {
      console.log('Failed to record reaction:', error);
    }

    if (currentIndex < movies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Move to last index to trigger completion
      setCurrentIndex(movies.length);
    }
  };

  const handleSwipeRight = async (movie: Movie) => {
    await submitVote({
      room_id: roomId,
      participant_id: participantName,
      movie_id: movie.id,
      vote_type: 'like',
    });

    // Record vote reaction for live display
    try {
      await recordVoteReactionMutation({
        roomId: roomId as Id<'rooms'>,
        movieId: movie.id as Id<'movies'>,
        participantId: participantName,
        reaction: 'like',
      });
    } catch (error) {
      console.log('Failed to record reaction:', error);
    }

    if (currentIndex < movies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Move to last index to trigger completion
      setCurrentIndex(movies.length);
    }
  };

  const navigateToResults = () => {
    navigation.replace('Results', {
      roomId,
      roomCode,
    });
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const success = await leaveRoom(participantName);
            if (success) {
              navigation.navigate('Home');
            }
          },
        },
      ]
    );
  };

  const handleChatOpen = () => {
    setShowChat(true);
  };

  const handleChatClose = () => {
    setShowChat(false);
  };

  const handleMessagesRead = () => {
    setUnreadCount(0);
  };

  if (isLoadingMovies || (!currentMovie && !hasFinishedVoting)) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <LinearGradient
          colors={['#0F0F23', '#1a1a2e', '#16213e']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={styles.loadingText}>
              {isLoadingMovies ? 'Loading movies...' : 'No movies available'}
            </Text>
            {movies.length === 0 && !isLoadingMovies && (
              <Text style={styles.errorText}>Movies are being prepared. Please wait a moment...</Text>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show completion screen when user has finished voting
  if (hasFinishedVoting) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.completionWrapper}>
          <ScrollView contentContainerStyle={styles.completionContainer}>
            {/* Completion Icon */}
            <Text style={styles.completionIcon}>✓</Text>

            {/* Title */}
            <Text style={styles.completionTitle}>Voting Complete!</Text>

            {/* Status Message */}
            <Text style={styles.completionMessage}>
              {votingCompletion.isAllComplete
                ? 'All participants have finished voting!'
                : 'Waiting for other participants to finish...'}
            </Text>

            {/* Progress Banner */}
            <View style={styles.completionBanner}>
              <View style={styles.completionBannerHeader}>
                <Text style={styles.completionBannerLabel}>Progress</Text>
                <Text style={styles.completionBannerCount}>
                  {votingCompletion.completedParticipants} of {votingCompletion.totalParticipants} completed
                </Text>
              </View>
              <View style={styles.completionProgressBar}>
                <View
                  style={[
                    styles.completionProgressFill,
                    { width: `${votingCompletion.completionPercentage}%` },
                  ]}
                />
              </View>
            </View>

            {/* Waiting For List */}
            {votingCompletion.pendingParticipantIds.length > 0 && (
              <View style={styles.waitingForContainer}>
                <Text style={styles.waitingForTitle}>Waiting for:</Text>
                {votingCompletion.pendingParticipantIds.map(name => (
                  <View key={name} style={styles.waitingForParticipant}>
                    <Text style={styles.waitingForName}>{name}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Info Text */}
            {!votingCompletion.isAllComplete && (
              <Text style={styles.completionInfo}>
                Results will update automatically as others finish voting
              </Text>
            )}
          </ScrollView>

          {/* View Results Button - Fixed at bottom */}
          <View style={styles.completionButtonContainer}>
            <Button
              title="View Results"
              variant="primary"
              size="large"
              fullWidth
              onPress={navigateToResults}
            />
          </View>

          {/* Floating Chat Button (also on completion screen) - Hide on TV */}
          {!IS_TV && (
            <>
              <FloatingChatButton
                onPress={handleChatOpen}
                unreadCount={unreadCount}
              />

              {/* Chat Panel */}
              <ChatPanel
                isOpen={showChat}
                onClose={handleChatClose}
                roomId={roomId as Id<'rooms'>}
                currentParticipant={participantName}
                typingUsers={typingUsers}
                onTyping={setTypingStatus}
                onMessagesRead={handleMessagesRead}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#0F0F23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ focused }) => [
              styles.backButton,
              IS_TV && focused && styles.backButtonFocused,
            ]}
            onPress={() => navigation.goBack()}
            focusable={true}
          >
            <Ionicons name="arrow-back" size={IS_TV ? 40 : 24} color="#8E8E93" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.movieProgress}>
              Movie {currentIndex + 1} of {movies.length}
            </Text>
            <Text style={styles.completionText}>
              {Math.round(progress.progressPercentage)}% complete
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={({ focused }) => [
                styles.viewResultsHeaderButton,
                IS_TV && focused && styles.viewResultsHeaderButtonFocused,
              ]}
              onPress={navigateToResults}
              focusable={true}
            >
              <Text style={styles.viewResultsHeaderText}>Results</Text>
            </Pressable>
            <Pressable
              style={({ focused }) => [
                styles.participantsButton,
                IS_TV && focused && styles.participantsButtonFocused,
              ]}
              onPress={() => setShowParticipants(true)}
              focusable={true}
            >
              <Ionicons name="people" size={IS_TV ? 36 : 20} color="#8E8E93" />
              <Text style={styles.participantCount}>{participantCount}</Text>
            </Pressable>
          </View>
        </View>

        {/* Movie Cards */}
        <View style={styles.cardContainer}>
          <MovieCard
            key={currentMovie.id}
            movie={currentMovie}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            isTopCard={true}
            cardHeight={maxCardHeight}
          />
        </View>

        {/* Participants List Modal */}
        <ParticipantsList
          roomId={roomId}
          isOpen={showParticipants}
          onClose={() => setShowParticipants(false)}
          participants={participantsForList}
        />

        {/* Live Vote Reactions Overlay */}
        <ReactionOverlay
          reactions={recentReactions || []}
          currentParticipant={participantName}
        />

        {/* Floating Chat Button - Hide on TV */}
        {!IS_TV && (
          <>
            <FloatingChatButton
              onPress={handleChatOpen}
              unreadCount={unreadCount}
            />

            {/* Chat Panel */}
            <ChatPanel
              isOpen={showChat}
              onClose={handleChatClose}
              roomId={roomId as Id<'rooms'>}
              currentParticipant={participantName}
              typingUsers={typingUsers}
              onTyping={setTypingStatus}
              onMessagesRead={handleMessagesRead}
            />
          </>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const IS_TV = Platform.isTV;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IS_TV ? spacing._80 : spacing.lg,
    paddingVertical: IS_TV ? spacing.lg : spacing.sm,
    paddingTop: IS_TV ? spacing.md : spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_TV ? 16 : 8,
    paddingHorizontal: IS_TV ? 16 : 0,
    paddingVertical: IS_TV ? 8 : 0,
    borderRadius: IS_TV ? 8 : 0,
  },
  backButtonFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  backText: {
    fontSize: IS_TV ? 28 : 16,
    color: '#8E8E93',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_TV ? 24 : 12,
  },
  completionText: {
    fontSize: IS_TV ? 20 : 11,
    color: '#8E8E93',
    marginTop: IS_TV ? 6 : 2,
  },
  movieProgress: {
    fontSize: IS_TV ? 28 : 14,
    fontWeight: '600',
    color: '#fff',
  },
  viewResultsHeaderButton: {
    paddingHorizontal: IS_TV ? 24 : 12,
    paddingVertical: IS_TV ? 12 : 6,
    borderRadius: IS_TV ? 16 : 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  viewResultsHeaderButtonFocused: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    transform: [{ scale: 1.05 }],
  },
  viewResultsHeaderText: {
    fontSize: IS_TV ? 22 : 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  participantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IS_TV ? 12 : 6,
    paddingHorizontal: IS_TV ? 12 : 0,
    paddingVertical: IS_TV ? 8 : 0,
    borderRadius: IS_TV ? 8 : 0,
  },
  participantsButtonFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  participantCount: {
    fontSize: IS_TV ? 24 : 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  viewResultsContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  viewResultsButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  viewResultsGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  viewResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
    textAlign: 'center',
  },
  completionWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  completionContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  completionButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#0F0F23',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  completionIcon: {
    fontSize: 80,
    color: '#34C759',
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  completionBanner: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  completionBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionBannerLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  completionBannerCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  completionProgressBar: {
    height: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionProgressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  waitingForContainer: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  waitingForTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  waitingForParticipant: {
    paddingVertical: 8,
  },
  waitingForName: {
    fontSize: 14,
    color: '#E5E5EA',
  },
  completionInfo: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
});

export default RoomScreen;
