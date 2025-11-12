/**
 * HomeScreen Component
 * Main landing screen with create/join room options
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreenProps } from 'app/types/navigation';
import { FeatureCard } from 'app/components/ui/FeatureCard';
import { TMDBAttribution } from 'app/components/ui/TMDBAttribution';
import { useAsyncStorage } from 'app/hooks/useAsyncStorage';
import { spacing } from 'app/theme';
import logoImage from '../../assets/images/icon.png';

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { getRecentRoomCodes } = useAsyncStorage();
  // With Convex, we're always connected (no need for connection status)
  const connectionStatus = 'connected';

  useEffect(() => {
    // Preload recent room codes for quick access
    getRecentRoomCodes();
  }, []);

  const handleCreateRoom = () => {
    navigation.navigate('CreateRoom');
  };

  const handleJoinRoom = () => {
    navigation.navigate('JoinRoom');
  };

  const handleAbout = () => {
    navigation.navigate('About');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#0F0F23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* About Button - Top Right */}
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={handleAbout}
          focusable={true}
        >
          <Ionicons name="information-circle-outline" size={28} color="#8E8E93" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo/Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#ef4444', '#f97316']}
                  style={styles.logoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image source={logoImage} style={styles.headerLogo} />
                </LinearGradient>
              </View>
              
              <Text style={styles.title}>
                <Text style={styles.titleGradient}>MovieZang</Text>
              </Text>
              <Text style={styles.subtitle}>
                Swipe through movies with friends and discover what everyone wants to watch. 
                The perfect way to end the "what should we watch?" debate.
              </Text>
            </View>

            {/* Connection status */}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: connectionStatus === 'connected' ? '#34C759' : '#FF3B30' },
                ]}
              />
              <Text style={styles.statusText}>
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={handleCreateRoom}
                disabled={connectionStatus !== 'connected'}
                focusable={true}
              >
                <LinearGradient
                  colors={['#ef4444', '#f97316']}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Create Room</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.joinButton]}
                onPress={handleJoinRoom}
                disabled={connectionStatus !== 'connected'}
                focusable={true}
              >
                <View style={styles.actionButtonOutline}>
                  <Ionicons name="enter" size={24} color="#ef4444" />
                  <Text style={styles.actionButtonOutlineText}>Join Room</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <FeatureCard
                title="Quick & Easy"
                description="Join in seconds with a 4-digit code. No accounts required."
              />

              <FeatureCard
                title="Find Matches"
                description="See ranked results of movies everyone loved, with streaming links."
              />
            </View>

            {/* TMDB Attribution */}
            <TMDBAttribution />
          </View>
        </ScrollView>
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
  aboutButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
  headerLogo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  popcornAccent: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  popcornEmoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleGradient: {
    color: '#ef4444',
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButton: {
    // Gradient styling handled by LinearGradient
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  joinButton: {
    borderWidth: 2,
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
  },
  actionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButtonOutlineText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  featuresContainer: {
    gap: 16,
  },
});

export default HomeScreen;
