/**
 * ResultsScreen Component
 * Display detailed voting results with movie metadata
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Share as RNShare,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ResultsScreenProps } from 'app/types/navigation';
import { Button } from 'app/components/ui/Button';
import { Card } from 'app/components/ui/Card';
import { TMDBAttribution } from 'app/components/ui/TMDBAttribution';
import ParticipantsList from 'app/components/ParticipantsList';
import {
  useDetailedResults,
  DetailedMovieResult,
  ParticipantStatus,
} from 'app/hooks/useDetailedResults';
import {
  getBestStreamingLink,
  getAppNotInstalledMessage,
} from 'app/utils/streamingDeepLinks';

const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { roomId, roomCode } = route.params;
  const {
    results,
    participants,
    isLoading,
    completedParticipants,
    totalParticipants,
    completionPercentage,
    isAllComplete,
  } = useDetailedResults(roomId);

  const [showParticipants, setShowParticipants] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  const topResult = results[0];
  const otherResults = results.slice(1);

  const participantMeta = useMemo(() => {
    const meta = new Map<string, { name: string; isHost: boolean; isComplete: boolean }>();

    participants.forEach((participant: ParticipantStatus, index: number) => {
      const id = participant.participantId || `participant-${index}`;
      meta.set(id, {
        name: participant.participantId?.trim() || `Participant ${index + 1}`,
        isHost: index === 0,
        isComplete: participant.votingCompletedAt !== null,
      });
    });

    return meta;
  }, [participants]);

  const toggleExpanded = useCallback((movieId: string) => {
    setExpandedResults((prev) => ({
      ...prev,
      [movieId]: !prev[movieId],
    }));
  }, []);

  const handleShare = useCallback(async () => {
    if (!topResult) return;

    const message = `We picked "${topResult.movie.title}" (${topResult.matchPercentage}% match) in room ${roomCode}! Join us at MovieZang to find your next movie!`;

    try {
      await RNShare.share({ message });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [roomCode, topResult]);

  const handleNewRoom = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const openLink = useCallback(async (url: string, providerName?: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // App not installed (common on Apple TV)
        if (Platform.isTV && providerName) {
          Alert.alert(
            'App Not Installed',
            getAppNotInstalledMessage(providerName),
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Failed to open link:', error);
      if (Platform.isTV && providerName) {
        Alert.alert(
          'Cannot Open App',
          getAppNotInstalledMessage(providerName),
          [{ text: 'OK' }]
        );
      }
    }
  }, []);

  const getYear = (date: string | null): string => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).getFullYear().toString();
    } catch {
      return 'Unknown';
    }
  };

  const renderGenres = (genreIds: number[] | null) => {
    if (!genreIds || genreIds.length === 0) return null;

    return (
      <View style={styles.genreContainer}>
        {genreIds.slice(0, 4).map((genreId) => (
          <View key={genreId} style={styles.genrePill}>
            <Text style={styles.genreText}>Genre {genreId}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStreamingBadges = (result: DetailedMovieResult) => {
    const streamingData = result.movie.streamingPlatforms?.US;

    if (!streamingData) return null;

    const badges: React.ReactNode[] = [];

    streamingData.flatrate?.slice(0, 4).forEach((provider: any) => {
      badges.push(
        <View key={`stream-${provider.provider_id}`} style={[styles.streamingBadge, styles.streamingBadgeStream]}>
          <Text style={styles.streamingBadgeText}>Stream • {provider.provider_name}</Text>
        </View>
      );
    });

    streamingData.rent?.slice(0, 3).forEach((provider: any) => {
      badges.push(
        <View key={`rent-${provider.provider_id}`} style={[styles.streamingBadge, styles.streamingBadgeRent]}>
          <Text style={styles.streamingBadgeText}>Rent • {provider.provider_name}</Text>
        </View>
      );
    });

    streamingData.buy?.slice(0, 3).forEach((provider: any) => {
      badges.push(
        <View key={`buy-${provider.provider_id}`} style={[styles.streamingBadge, styles.streamingBadgeBuy]}>
          <Text style={styles.streamingBadgeText}>Buy • {provider.provider_name}</Text>
        </View>
      );
    });

    if (badges.length === 0) return null;

    return (
      <View style={styles.streamingSection}>
        <Text style={styles.streamingTitle}>Available on:</Text>
        <View style={styles.streamingBadgesContainer}>{badges}</View>
      </View>
    );
  };

  const renderVotingDetails = (result: DetailedMovieResult) => {
    if (!expandedResults[result.id]) return null;

    return (
      <View style={styles.votingDetailsContainer}>
        {result.votingDetails.map((vote, index) => {
          const meta = participantMeta.get(vote.participantId) || {
            name: vote.participantId,
            isHost: false,
            isComplete: false,
          };

          return (
            <View key={`${result.id}-${vote.participantId}-${index}`} style={styles.votingDetailRow}>
              <View style={styles.votingDetailInfo}>
                <Text style={styles.votingDetailName}>{meta.name}</Text>
                {meta.isHost && (
                  <View style={styles.hostPill}>
                    <Text style={styles.hostPillText}>Host</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.votePill,
                  vote.vote ? styles.votePillPositive : styles.votePillNegative,
                ]}
              >
                <Text style={styles.votePillText}>{vote.vote ? 'Liked' : 'Passed'}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderResultCard = (result: DetailedMovieResult, isTopResult = false) => {
    const hasPoster = result.movie.posterPath && result.movie.posterPath.trim() !== '';
    const posterUri = hasPoster
      ? `https://image.tmdb.org/t/p/w500${result.movie.posterPath}`
      : null;
    const posterHeight = isTopResult ? 300 : 220;
    const isExpanded = !!expandedResults[result.id];

    // Get the best streaming link (deep link on tvOS, web on iOS)
    const streamingLink = getBestStreamingLink(
      result.movie.streamingPlatforms?.US || {},
      result.movie.tmdbId
    );

    return (
      <Card
        variant="elevated"
        padding="large"
        style={[styles.resultCard, isTopResult ? styles.topResultCard : undefined]}
      >
        {isTopResult && (
          <View style={styles.winnerBadge}>
            <Ionicons name="trophy" size={16} color="#fff" />
            <Text style={styles.winnerBadgeText}>Winner</Text>
          </View>
        )}

        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={[styles.resultPoster, { height: posterHeight }]}
            resizeMode="cover"
            onError={(e) => {
              console.log('Image failed to load:', posterUri, e.nativeEvent.error);
            }}
          />
        ) : (
          <View style={[styles.resultPoster, styles.posterPlaceholder, { height: posterHeight }]}>
            <Ionicons name="film-outline" size={64} color="#4A4A4C" />
            <Text style={styles.posterPlaceholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.resultHeaderRow}>
          <View style={styles.resultTitleWrapper}>
            <Text style={styles.resultTitle}>{result.movie.title}</Text>
            <Text style={styles.resultYear}>{getYear(result.movie.releaseDate)}</Text>
          </View>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{result.matchPercentage}% match</Text>
          </View>
        </View>

        {renderGenres(result.movie.genreIds)}
        {renderStreamingBadges(result)}

        {result.movie.overview && (
          <Text style={styles.resultOverview} numberOfLines={isTopResult ? 6 : 4}>
            {result.movie.overview}
          </Text>
        )}

        <View style={styles.statsRow}>
          <Text style={styles.statText}>👍 {result.positiveVotes}</Text>
          <Text style={styles.statText}>👎 {result.negativeVotes}</Text>
          <Text style={styles.statText}>• {result.totalVotes} votes</Text>
        </View>

        {/* Show Watch Now with deep linking on tvOS, web link on iOS */}
        {streamingLink && (
          <Button
            title={
              Platform.isTV && streamingLink.providerName
                ? `Watch on ${streamingLink.providerName}`
                : 'Watch Now'
            }
            variant="secondary"
            size="small"
            onPress={() => openLink(streamingLink.url, streamingLink.providerName)}
            style={styles.watchButton}
          />
        )}

        {result.votingDetails.length > 0 && (
          <TouchableOpacity
            onPress={() => toggleExpanded(result.id)}
            style={styles.detailsToggle}
          >
            <Text style={styles.detailsToggleText}>
              {isExpanded ? 'Hide voting details' : 'View voting details'}
            </Text>
            <Text style={styles.detailsToggleIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        )}

        {renderVotingDetails(result)}
      </Card>
    );
  };

  const renderResultItem = ({ item }: { item: DetailedMovieResult }) => renderResultCard(item, false);

  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      {!isAllComplete && totalParticipants > 0 && (
        <View style={styles.partialResultsBanner}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerTitleRow}>
              <View style={styles.statusDot} />
              <Text style={styles.bannerTitle}>Partial Results</Text>
            </View>
            <Text style={styles.bannerCount}>
              {completedParticipants} of {totalParticipants} completed
            </Text>
          </View>
          <View style={styles.bannerProgressBar}>
            <View
              style={[
                styles.bannerProgressFill,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.bannerInfo}>
            Results update automatically as more participants finish voting
          </Text>
        </View>
      )}

      {isAllComplete && totalParticipants > 0 && (
        <View style={styles.completeResultsBanner}>
          <View style={styles.completeBannerRow}>
            <View style={styles.completeStatusDot} />
            <Text style={styles.completeBannerText}>
              All participants have completed voting!
            </Text>
          </View>
        </View>
      )}

      <View style={styles.screenHeader}>
        <View style={styles.headerIconContainer}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="trophy" size={40} color="#fff" />
          </View>
        </View>
        <Text style={styles.title}>Movie Results</Text>
        <TouchableOpacity onPress={() => setShowParticipants(true)}>
          <Text style={styles.subtitle}>
            <Ionicons name="people" size={14} color="#8E8E93" /> {totalParticipants} participant{totalParticipants === 1 ? '' : 's'} voted
          </Text>
        </TouchableOpacity>
      </View>

      {topResult ? (
        <View>
          {renderResultCard(topResult, true)}
          {otherResults.length > 0 && (
            <Text style={styles.allResultsTitle}>More Results</Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyResults}>
          <Ionicons name="people" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Matches Found</Text>
          <Text style={styles.emptySubtitle}>
            None of the movies received enough votes. Try another round!
          </Text>
        </View>
      )}
    </View>
  );

  const renderListFooter = () => (
    <View style={styles.footerContainer}>
      <View style={styles.actionsContainer}>
        {/* Hide Share button on Apple TV - no sharing apps available */}
        {!Platform.isTV && (
          <Button
            title="Share Results"
            variant="outline"
            size="medium"
            onPress={handleShare}
            style={[styles.actionButton, styles.actionButtonSpacing]}
            disabled={!topResult}
          />
        )}
        <Button
          title="New Room"
          variant="primary"
          size="medium"
          onPress={handleNewRoom}
          style={styles.actionButton}
        />
      </View>
      <TMDBAttribution style={{ marginTop: 24 }} />
    </View>
  );

  if (isLoading && results.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Calculating results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <FlatList
        data={otherResults}
        keyExtractor={(item) => item.id}
        renderItem={renderResultItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <ParticipantsList
        roomId={roomId}
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
        participants={participants.map((p) => p.participantId || '')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  listContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 24,
  },
  headerIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  resultCard: {
    marginBottom: 24,
  },
  topResultCard: {
    borderWidth: 1,
    borderColor: '#FFD70033',
    backgroundColor: '#1C1C1E',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  winnerBadgeText: {
    fontSize: 14,
    color: '#121212',
    fontWeight: '700',
  },
  resultPoster: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#2C2C2E',
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderStyle: 'dashed',
  },
  posterPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4A4A4C',
    fontWeight: '600',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultTitleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultYear: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  matchBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#34C75933',
  },
  matchBadgeText: {
    color: '#34C759',
    fontWeight: '600',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genrePill: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  streamingSection: {
    marginBottom: 16,
  },
  streamingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  streamingBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  streamingBadge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  streamingBadgeStream: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  streamingBadgeRent: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderColor: 'rgba(255, 149, 0, 0.4)',
  },
  streamingBadgeBuy: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderColor: 'rgba(0, 122, 255, 0.4)',
  },
  streamingBadgeText: {
    fontSize: 12,
    color: '#fff',
  },
  resultOverview: {
    fontSize: 14,
    color: '#D1D1D6',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginRight: 12,
  },
  watchButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#2C2C2E',
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  detailsToggleIcon: {
    fontSize: 14,
    color: '#ef4444',
  },
  votingDetailsContainer: {
    borderTopWidth: 1,
    borderColor: '#2C2C2E',
    paddingTop: 12,
  },
  votingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F1F21',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  votingDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  votingDetailName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    marginRight: 8,
  },
  hostPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hostPillText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
  },
  votePill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  votePillPositive: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  votePillNegative: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  votePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  allResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 12,
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
  actionButtonSpacing: {
    marginRight: 16,
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
  partialResultsBanner: {
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#FF9500',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9500',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  bannerCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  bannerProgressBar: {
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bannerProgressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  bannerInfo: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  completeResultsBanner: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  completeBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
  },
  completeBannerText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ResultsScreen;
