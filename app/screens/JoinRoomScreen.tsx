/**
 * JoinRoomScreen Component
 * Screen for joining an existing room with a code
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { JoinRoomScreenProps } from 'app/types/navigation';
import { Button } from 'app/components/ui/Button';
import { Input } from 'app/components/ui/Input';
import { useRoom } from 'app/hooks/useRoom';
import { useAsyncStorage } from 'app/hooks/useAsyncStorage';
import { spacing } from 'app/theme';

// Conditional import for TV focus guide
const TVFocusGuideView = Platform.isTV
  ? require('react-native').TVFocusGuideView
  : View;

const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({ navigation }) => {
  const { joinRoom, isLoading, error } = useRoom();
  const {
    getParticipantName,
    setParticipantName,
    setCurrentRoomCode,
    addRecentRoomCode,
  } = useAsyncStorage();

  const [roomCode, setRoomCode] = useState('');
  const [participantName, setParticipantNameState] = useState('');
  const [errors, setErrors] = useState<{ roomCode?: string; participantName?: string }>({});

  useEffect(() => {
    const loadData = async () => {
      const savedName = await getParticipantName();

      if (savedName) setParticipantNameState(savedName);
    };

    loadData();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { roomCode?: string; participantName?: string } = {};

    if (!roomCode.trim()) {
      newErrors.roomCode = 'Room code is required';
    } else if (!/^\d{4}$/.test(roomCode)) {
      newErrors.roomCode = 'Room code must be 4 digits';
    }

    if (!participantName.trim()) {
      newErrors.participantName = 'Name is required';
    } else if (participantName.length > 50) {
      newErrors.participantName = 'Name must be 50 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoinRoom = async () => {
    if (!validateForm()) return;

    try {
      await setParticipantName(participantName);

      const participant = await joinRoom({
        room_id: roomCode,
        participant_id: participantName,
      });

      if (participant) {
        await setCurrentRoomCode(roomCode);
        await addRecentRoomCode(roomCode);

        navigation.replace('Room', {
          roomId: participant.roomId,
          roomCode,
          participantName,
        });
      } else if (error) {
        Alert.alert('Error', error.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join room');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#0F0F23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            focusable={true}
          >
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>

          {/* Main card */}
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.2)']}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Join a Room</Text>
                <Text style={styles.subtitle}>
                  Enter the 4-digit room code to join
                </Text>
              </View>

              <TVFocusGuideView style={styles.formContainer} autoFocus>
                <Input
                  label="Room Code"
                  value={roomCode}
                  onChangeText={(text) => {
                    setRoomCode(text.replace(/\D/g, '').slice(0, 4));
                    if (errors.roomCode) setErrors({ ...errors, roomCode: undefined });
                  }}
                  error={errors.roomCode}
                  placeholder="0000"
                  keyboardType={Platform.isTV ? undefined : "number-pad"}
                  maxLength={4}
                />

                <Input
                  label="Your Name"
                  value={participantName}
                  onChangeText={(text) => {
                    setParticipantNameState(text);
                    if (errors.participantName) setErrors({ ...errors, participantName: undefined });
                  }}
                  error={errors.participantName}
                  placeholder="Enter your name"
                  maxLength={50}
                />

                <Button
                  title="Join Room"
                  variant="primary"
                  size="large"
                  fullWidth
                  isLoading={isLoading}
                  onPress={handleJoinRoom}
                  style={styles.joinButton}
                />
              </TVFocusGuideView>
            </LinearGradient>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  cardGradient: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    gap: 20,
  },
  joinButton: {
    marginTop: 16,
  },
});

export default JoinRoomScreen;
