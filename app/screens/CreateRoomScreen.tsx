/**
 * CreateRoomScreen Component
 * Screen for creating a new movie voting room
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';

const IS_TV = Platform.isTV;

// Conditional import for TV focus guide
const TVFocusGuideView = Platform.isTV
  ? require('react-native').TVFocusGuideView
  : View;

import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateRoomScreenProps } from 'app/types/navigation';
import { Button } from 'app/components/ui/Button';
import { Input } from 'app/components/ui/Input';
import { useRoom } from 'app/hooks/useRoom';
import { useAsyncStorage } from 'app/hooks/useAsyncStorage';
import { spacing } from 'app/theme';
import {
  STREAMING_SERVICES,
  COUNTRIES,
  MOVIE_CATEGORIES,
  MOVIE_COUNT_OPTIONS,
  MIN_SCORE_OPTIONS
} from 'app/types/supabase';

const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({ navigation }) => {
  const { createRoom, isLoading } = useRoom();
  const {
    getParticipantName,
    setParticipantName,
    getStreamingPreferences,
    getCountryPreference,
    setCurrentRoomCode,
    addRecentRoomCode,
  } = useAsyncStorage();

  const [hostName, setHostName] = useState('');
  const [category, setCategory] = useState('popular');
  const [streamingPrefs, setStreamingPrefs] = useState<string[]>([]);
  const [restrictToSubscriptions, setRestrictToSubscriptions] = useState(false);
  const [country, setCountry] = useState('GB');
  const [movieCount, setMovieCount] = useState(10);
  const [minScore, setMinScore] = useState(6);
  const [errors, setErrors] = useState<{ hostName?: string }>({});

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      const savedName = await getParticipantName();
      const savedStreaming = await getStreamingPreferences();
      const savedCountry = await getCountryPreference();

      if (savedName) setHostName(savedName);
      if (savedStreaming.length > 0) setStreamingPrefs(savedStreaming);
      if (savedCountry) setCountry(savedCountry);
    };

    loadPreferences();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { hostName?: string } = {};

    if (!hostName.trim()) {
      newErrors.hostName = 'Host name is required';
    } else if (hostName.length > 50) {
      newErrors.hostName = 'Host name must be 50 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRoom = async () => {
    if (!validateForm()) return;

    try {
      // Save participant name
      await setParticipantName(hostName);

      // Create room (Convex automatically generates room code)
      // Note: streaming_preferences, country_preference, movie_count, and min_score
      // are not currently stored in the Convex schema
      const room = await createRoom({
        code: '', // Not used - Convex generates this automatically
        category,
        host_id: hostName,
        streaming_preferences: restrictToSubscriptions ? streamingPrefs : [],
        country_preference: country,
        status: 'active',
        movie_count: movieCount,
        min_score: minScore,
      });

      if (room && room._id && room.code) {
        // Save room code
        await setCurrentRoomCode(room.code);
        await addRecentRoomCode(room.code);

        // Navigate to share room screen
        navigation.replace('ShareRoom', {
          roomId: room._id,
          roomCode: room.code,
          hostName: hostName,
        });
      } else {
        Alert.alert('Error', 'Failed to create room - invalid response');
        console.error('Invalid room response:', room);
      }
    } catch (err: any) {
      console.error('Create room exception:', err);
      Alert.alert('Error', err.message || 'Failed to create room');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={[styles.content, IS_TV && styles.tvContent]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, IS_TV && styles.tvTitle]}>Create a Room</Text>
        <TVFocusGuideView autoFocus>
          <Input
            value={hostName}
            onChangeText={(text) => {
              setHostName(text);
              if (errors.hostName) setErrors({ ...errors, hostName: undefined });
            }}
            error={errors.hostName}
            placeholder="Enter your name"
            maxLength={50}
          />
        </TVFocusGuideView>

        <View style={[styles.section, IS_TV && styles.tvSection]}>
          <Text style={[styles.sectionTitle, IS_TV && styles.tvSectionTitle]}>Movie Category</Text>
          <View style={styles.categoryGrid}>
            {MOVIE_CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                title={cat.label}
                variant={category === cat.value ? 'primary' : 'outline'}
                size="small"
                onPress={() => setCategory(cat.value)}
                style={styles.categoryButton}
              />
            ))}
          </View>
        </View>

        <View style={[styles.section, IS_TV && styles.tvSection]}>
          <View style={[styles.checkboxContainer, IS_TV && styles.tvCheckboxContainer]}>
            {IS_TV ? (
              <Pressable
                style={({ focused }) => [
                  styles.checkbox,
                  IS_TV && styles.tvCheckbox,
                  focused && styles.tvCheckboxFocused,
                ]}
                onPress={() => setRestrictToSubscriptions(!restrictToSubscriptions)}
                focusable={true}
              >
                <View style={[styles.checkboxBox, IS_TV && styles.tvCheckboxBox, restrictToSubscriptions && styles.checkboxChecked]}>
                  {restrictToSubscriptions && <Text style={[styles.checkboxMark, IS_TV && styles.tvCheckboxMark]}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, IS_TV && styles.tvCheckboxLabel]}>Restrict to my subscribed services</Text>
              </Pressable>
            ) : (
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setRestrictToSubscriptions(!restrictToSubscriptions)}
              >
                <View style={[styles.checkboxBox, restrictToSubscriptions && styles.checkboxChecked]}>
                  {restrictToSubscriptions && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Restrict to my subscribed services</Text>
              </TouchableOpacity>
            )}
          </View>

          {restrictToSubscriptions && (
            <>
              <Text style={[styles.sectionTitle, IS_TV && styles.tvSectionTitle]}>Select Streaming Services</Text>
              <View style={styles.serviceGrid}>
                {STREAMING_SERVICES.map((service) => (
                  <Button
                    key={service.id}
                    title={service.name}
                    variant={streamingPrefs.includes(service.id) ? 'secondary' : 'outline'}
                    size="small"
                    onPress={() => {
                      if (streamingPrefs.includes(service.id)) {
                        setStreamingPrefs(streamingPrefs.filter((s) => s !== service.id));
                      } else {
                        setStreamingPrefs([...streamingPrefs, service.id]);
                      }
                    }}
                    style={styles.serviceButton}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={[styles.section, IS_TV && styles.tvSection]}>
          <Text style={[styles.sectionTitle, IS_TV && styles.tvSectionTitle]}>Country</Text>
          <View style={[styles.countryGrid, IS_TV && styles.tvCountryGrid]}>
            {COUNTRIES.map((c) => (
              <Button
                key={c.code}
                title={c.name}
                variant={country === c.code ? 'primary' : 'outline'}
                size="small"
                onPress={() => setCountry(c.code)}
                style={[styles.countryButton, IS_TV && styles.tvCountryButton]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.section, IS_TV && styles.tvSection]}>
          <Text style={[styles.sectionTitle, IS_TV && styles.tvSectionTitle]}>Number of Movies</Text>
          <View style={styles.categoryGrid}>
            {MOVIE_COUNT_OPTIONS.map((count) => (
              <Button
                key={count}
                title={`${count} movies`}
                variant={movieCount === count ? 'primary' : 'outline'}
                size="small"
                onPress={() => setMovieCount(count)}
                style={styles.categoryButton}
              />
            ))}
          </View>
        </View>

        <View style={[styles.section, IS_TV && styles.tvSection]}>
          <Text style={[styles.sectionTitle, IS_TV && styles.tvSectionTitle]}>Minimum User Score</Text>
          <View style={styles.categoryGrid}>
            {MIN_SCORE_OPTIONS.map((score) => (
              <Button
                key={score.value}
                title={score.label}
                variant={minScore === score.value ? 'primary' : 'outline'}
                size="small"
                onPress={() => setMinScore(score.value)}
                style={styles.categoryButton}
              />
            ))}
          </View>
        </View>

        <Button
          title="Create Room"
          variant="primary"
          size="large"
          fullWidth
          isLoading={isLoading}
          onPress={handleCreateRoom}
          disabled={!hostName.trim() || (restrictToSubscriptions && streamingPrefs.length === 0)}
          style={styles.createButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  tvContent: {
    paddingHorizontal: spacing._80,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tvTitle: {
    fontSize: 48,
    marginBottom: 24,
  },
  section: {
    marginBottom: spacing.lg,
  },
  tvSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  tvSectionTitle: {
    fontSize: 28,
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexGrow: 0,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceButton: {
    flexGrow: 0,
  },
  countryGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  tvCountryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countryButton: {
    flexGrow: 0,
  },
  tvCountryButton: {
    width: '48%',
  },
  createButton: {
    marginVertical: 24,
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  tvCheckboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tvCheckbox: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  tvCheckboxFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 1.02 }],
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tvCheckboxBox: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderRadius: 8,
    marginRight: 20,
  },
  checkboxChecked: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tvCheckboxMark: {
    fontSize: 28,
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tvCheckboxLabel: {
    fontSize: 24,
  },
});

export default CreateRoomScreen;
