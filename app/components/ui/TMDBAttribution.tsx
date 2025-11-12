import React from 'react';
import { Text, StyleSheet, Image, View, TouchableOpacity, Linking, ViewStyle } from 'react-native';

interface TMDBAttributionProps {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export const TMDBAttribution: React.FC<TMDBAttributionProps> = ({
  size = 'sm',
  style
}) => {
  const sizeStyles = {
    sm: { fontSize: 9, logoHeight: 20 },
    md: { fontSize: 11, logoHeight: 28 },
    lg: { fontSize: 13, logoHeight: 36 }
  };

  const currentSize = sizeStyles[size];

  const handleTMDBPress = () => {
    Linking.openURL('https://www.themoviedb.org');
  };

  const handleIConnectPress = () => {
    Linking.openURL('https://iconnectit.co.uk');
  };

  return (
    <View style={[styles.container, style]}>
      {/* TMDB Attribution */}
      <TouchableOpacity
        style={styles.section}
        onPress={handleTMDBPress}
        activeOpacity={0.7}
        focusable={true}
      >
        <Image
          source={require('../../../assets/images/TMDB.png')}
          style={{ height: currentSize.logoHeight, width: currentSize.logoHeight * 4 }}
          resizeMode="contain"
        />
        <Text style={[styles.text, { fontSize: currentSize.fontSize - 1 }]}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>
      </TouchableOpacity>

      {/* Separator */}
      <View style={styles.separator} />

      {/* iConnectIT Attribution */}
      <TouchableOpacity
        style={styles.section}
        onPress={handleIConnectPress}
        activeOpacity={0.7}
        focusable={true}
      >
        <Image
          source={require('../../../assets/images/iconnectit.png')}
          style={{ height: currentSize.logoHeight, width: currentSize.logoHeight * 2.5 }}
          resizeMode="contain"
        />
        <Text style={[styles.mainText, { fontSize: currentSize.fontSize }]}>
          Developed with ❤️ by <Text style={styles.bold}>iConnectIT</Text>
        </Text>
        <Text style={[styles.text, { fontSize: currentSize.fontSize - 1 }]}>
          Built by iConnectIT – we make proper awesome apps.
        </Text>
        <Text style={[styles.copyright, { fontSize: currentSize.fontSize - 2 }]}>
          © 2025 iConnectIT LTD. All rights reserved.
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  section: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  separator: {
    width: '60%',
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 12,
  },
  mainText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 14,
  },
  bold: {
    fontWeight: '600',
    color: '#D1D5DB',
  },
  text: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
    lineHeight: 12,
  },
  copyright: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 10,
  },
});

export default TMDBAttribution;