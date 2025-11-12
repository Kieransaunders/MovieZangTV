import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AboutScreenProps } from 'app/types/navigation';
import { Card } from 'app/components/ui/Card';

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#0F0F23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>About MovieZang</Text>
            <Text style={styles.heroSubtitle}>
              Making movie night decisions fun, fast, and friction-free.
            </Text>
            <Text style={styles.heroBrand}>
              Built by{' '}
              <Text
                style={styles.brandLink}
                onPress={() => openURL('https://iconnectit.co.uk')}
              >
                iConnectIT
              </Text>
              {' '}– we make proper awesome apps
            </Text>
          </View>

          {/* Story Section */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Our Story</Text>
            <Text style={styles.paragraph}>
              At{' '}
              <Text
                style={styles.link}
                onPress={() => openURL('https://iconnectit.co.uk')}
              >
                iConnectIT
              </Text>
              , we're passionate about creating apps that solve real-world problems. We've all been there – you finally get everyone together for movie night, only to spend the next 30 minutes scrolling through endless options, with each person saying "I don't know, what do you want to watch?"
            </Text>
            <Text style={styles.paragraph}>
              MovieZang was born from this frustration. Our team at iConnectIT wanted to create a simple, fun way for groups to discover movies everyone will enjoy. No more endless debates, no more decision paralysis – just swipe, match, and watch. Building on the success of our sister app{' '}
              <Text
                style={styles.link}
                onPress={() => openURL('https://watchzang.com')}
              >
                WatchZang
              </Text>
              , we've refined the experience to make it even better.
            </Text>
            <Text style={styles.paragraph}>
              What started as a simple voting tool has grown into a complete entertainment discovery platform. Now you can build watchlists, track what you've seen, connect with friends, and get personalized recommendations – all while keeping that core simplicity that makes group decisions effortless. That's the iConnectIT way: proper awesome apps that just work.
            </Text>
          </Card>

          {/* Values Section */}
          <View style={styles.valuesSection}>
            <Text style={styles.valuesSectionTitle}>What We Believe</Text>

            <View style={styles.valuesGrid}>
              <Card style={styles.valueCard}>
                <View style={styles.valueIconContainer}>
                  <Ionicons name="bulb" size={32} color="#ef4444" />
                </View>
                <Text style={styles.valueTitle}>Simplicity First</Text>
                <Text style={styles.valueText}>
                  Great experiences shouldn't be complicated. We make it easy to get started and fun to use.
                </Text>
              </Card>

              <Card style={styles.valueCard}>
                <View style={styles.valueIconContainer}>
                  <Ionicons name="people" size={32} color="#ef4444" />
                </View>
                <Text style={styles.valueTitle}>Better Together</Text>
                <Text style={styles.valueText}>
                  Movies are meant to be shared. We build features that bring people together, not isolate them.
                </Text>
              </Card>

              <Card style={styles.valueCard}>
                <View style={styles.valueIconContainer}>
                  <Ionicons name="heart" size={32} color="#ef4444" />
                </View>
                <Text style={styles.valueTitle}>Privacy Matters</Text>
                <Text style={styles.valueText}>
                  Your data is yours. We only collect what we need and never sell your information.
                </Text>
              </Card>

              <Card style={styles.valueCard}>
                <View style={styles.valueIconContainer}>
                  <Ionicons name="rocket" size={32} color="#ef4444" />
                </View>
                <Text style={styles.valueTitle}>Always Improving</Text>
                <Text style={styles.valueText}>
                  We listen to our users and constantly evolve to meet their needs and expectations.
                </Text>
              </Card>
            </View>
          </View>

          {/* Technology Section */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Powered by Innovation</Text>
            <Text style={styles.paragraph}>
              Built by the expert team at{' '}
              <Text
                style={styles.link}
                onPress={() => openURL('https://iconnectit.co.uk')}
              >
                iConnectIT
              </Text>
              , MovieZang is crafted with modern web and mobile technologies to deliver a fast, reliable experience across all your devices. Our platform leverages real-time data synchronization, AI-powered recommendations, and comprehensive streaming availability data.
            </Text>
            <Text style={styles.paragraph}>
              At iConnectIT, we believe in building apps that are intuitive, powerful, and delightful to use. Our experience creating successful entertainment apps means we know what works – and what doesn't. Every feature is thoughtfully designed to enhance your movie discovery experience.
            </Text>
            <Text style={styles.paragraph}>
              All movie and TV show data is provided by{' '}
              <Text
                style={styles.link}
                onPress={() => openURL('https://www.themoviedb.org')}
              >
                The Movie Database (TMDB)
              </Text>
              , ensuring you have access to the most comprehensive and up-to-date entertainment information available.
            </Text>
          </Card>

          {/* CTA Section */}
          <Card style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Need Advice on App Building?</Text>
            <Text style={styles.ctaText}>
              The team at iConnectIT built this app. If you need advice on building your own app, get in touch with us. We make proper awesome apps.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => openURL('https://iconnectit.co.uk')}
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButtonGradient}
              >
                <Text style={styles.ctaButtonText}>Contact iConnectIT</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Card>

          {/* Back Button - Moved Lower */}
          <TouchableOpacity
            style={styles.movedBackButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="arrow-back-circle-outline" size={32} color="#8E8E93" />
            <Text style={styles.movedBackButtonText}>Back to Home</Text>
          </TouchableOpacity>

          {/* Footer Attribution */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Movie data provided by{' '}
              <Text
                style={styles.footerLink}
                onPress={() => openURL('https://www.themoviedb.org')}
              >
                TMDB
              </Text>
            </Text>
            <Text style={styles.footerText}>
              Built with ❤️ by{' '}
              <Text
                style={styles.footerLink}
                onPress={() => openURL('https://iconnectit.co.uk')}
              >
                iConnectIT
              </Text>
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  heroBrand: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  brandLink: {
    color: '#ef4444',
    fontWeight: '600',
  },
  card: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    marginBottom: 16,
  },
  link: {
    color: '#ef4444',
    fontWeight: '600',
  },
  valuesSection: {
    marginBottom: 24,
  },
  valuesSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  valuesGrid: {
    gap: 16,
  },
  valueCard: {
    alignItems: 'center',
    padding: 20,
  },
  valueIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  valueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  valueText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'center',
  },
  ctaCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  movedBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  movedBackButtonText: {
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  footerLink: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

export default AboutScreen;
