import React from 'react';
import { Text, StyleSheet, Image, TouchableOpacity, Linking, ViewStyle } from 'react-native';

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

  const handlePress = () => {
    Linking.openURL('https://iconnectit.co.uk');
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={require('../../../assets/iconnectit.png')}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginTop: 8,
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