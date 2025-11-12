/**
 * ShareRoomScreen Component
 * Screen for sharing room code and waiting for participants before starting voting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Share as RNShare,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useAction } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { ShareRoomScreenProps } from 'app/types/navigation';
import { Button } from 'app/components/ui/Button';
import { Card } from 'app/components/ui/Card';
import { spacing } from 'app/theme';

const ShareRoomScreen: React.FC<ShareRoomScreenProps> = ({ navigation, route }) => {
  const { roomCode, roomId, hostName } = route.params;
  const [error, setError] = useState<string | null>(null);
  const [isPopulatingMovies, setIsPopulatingMovies] = useState(false);

  // Fetch room details and participants from Convex (real-time)
  const room = useQuery(
    api.rooms.getRoom,
    roomId ? { roomId: roomId as Id<'rooms'> } : 'skip'
  );

  const participants = useQuery(
    api.rooms.getParticipants,
    roomId ? { roomId: roomId as Id<'rooms'> } : 'skip'
  );

  const populateMovies = useAction(api.roomSetup.populateRoomWithMovies);

  const isLoading = participants === undefined || room === undefined;

  // Populate movies when room is created
  useEffect(() => {
    const setupMovies = async () => {
      if (room && !isPopulatingMovies) {
        setIsPopulatingMovies(true);
        try {
          await populateMovies({ roomId: roomId as Id<'rooms'>, category: room.category });
        } catch (err) {
          const error = err as Error;
          console.error('Error populating movies:', error);
          setError('Failed to load movies. Please try refreshing.');
        } finally {
          setIsPopulatingMovies(false);
        }
      }
    };

    setupMovies();
  }, [room, roomId]);

  // Get participant names
  const participantNames = participants?.map(p => p.participantId) || [hostName];

  const handleShare = async () => {
    try {
      const shareUrl = `https://moviezang.com/join/${roomCode}`;
      const shareMessage = `Let's make movie night happen! Join my MovieZang room with code ${roomCode} 🍿`;

      await RNShare.share({
        message: Platform.OS === 'android'
          ? `${shareMessage}\n\n${shareUrl}`
          : shareMessage,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
        title: 'Join My MovieZang Room',
      });
    } catch (err) {
      // User cancelled or error occurred
      const error = err as Error & { message?: string };
      if (error.message !== 'User did not share') {
        console.error('Share failed:', error);
        Alert.alert('Share Failed', 'Could not share room link. Please try again.');
      }
    }
  };

  const handleEnterRoom = () => {
    navigation.navigate('Room', {
      roomId,
      roomCode,
      participantName: hostName,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoading || isPopulatingMovies) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="loading-indicator" size="large" color="#ef4444" />
          <Text style={styles.loadingText}>
            {isPopulatingMovies ? 'Loading movies...' : 'Loading participants...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Button
          testID="back-button"
          title="← Back"
          variant="ghost"
          size="small"
          onPress={handleBack}
        />
      </View>

      <View style={styles.content}>
        {/* Room Code Display */}
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Room Code</Text>
          <Card variant="elevated" padding="large" style={styles.codeCard}>
            <Text style={styles.roomCode}>{roomCode}</Text>
          </Card>
          <Text style={styles.codeHint}>Share this code with friends to invite them</Text>
        </View>

        {/* Participants Section */}
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Participants ({participantNames.length})</Text>
          <Card variant="outlined" padding="medium" style={styles.participantsCard}>
            {participantNames.map((participant, index) => (
              <View key={index} style={styles.participantItem}>
                <Text style={styles.participantName}>
                  {participant}
                  {index === 0 && ' (Host)'}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Connection Status */}
        <View style={styles.statusContainer} testID="connection-status">
          <View
            style={[
              styles.statusDot,
              { backgroundColor: '#34C759' },
            ]}
          />
          <Text style={styles.statusText}>Connected</Text>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Hide Share button on Apple TV - users can manually share the room code */}
          {!Platform.isTV && (
            <Button
              title="Share Room"
              variant="outline"
              size="large"
              fullWidth
              onPress={handleShare}
              style={styles.button}
            />
          )}

          <Button
            title="Enter Room"
            variant="primary"
            size="large"
            fullWidth
            onPress={handleEnterRoom}
            style={styles.button}
          />
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          You can start voting now or wait for more participants to join
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
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
  codeContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  codeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  codeCard: {
    minWidth: 200,
    alignItems: 'center',
  },
  roomCode: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ef4444',
    letterSpacing: 8,
  },
  codeHint: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  participantsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  participantsCard: {
    minHeight: 100,
  },
  participantItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  participantName: {
    fontSize: 16,
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 16,
  },
  button: {
    marginBottom: 0,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default ShareRoomScreen;
