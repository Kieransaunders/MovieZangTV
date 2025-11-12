/**
 * Reusable Button Component
 * Material Design-inspired button for mobile app
 */

import React from 'react';
import {
  TouchableOpacity,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const IS_TV = Platform.isTV;

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'like' | 'nope';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  ...props
}) => {
  const getButtonStyles = (focused?: boolean): ViewStyle[] => [
    styles.button,
    IS_TV && styles.tvButton,
    variant !== 'primary' && (styles as any)[`${variant}Button`],
    IS_TV && variant !== 'primary' && (styles as any)[`tv${variant.charAt(0).toUpperCase() + variant.slice(1)}Button`],
    (styles as any)[`${size}Button`],
    IS_TV && (styles as any)[`tv${size.charAt(0).toUpperCase() + size.slice(1)}Button`],
    fullWidth && styles.fullWidth,
    (disabled || isLoading) && styles.disabled,
    IS_TV && focused && styles.tvFocused,
    IS_TV && focused && variant === 'primary' && styles.tvPrimaryFocused,
    IS_TV && focused && variant === 'outline' && styles.tvOutlineFocused,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    IS_TV && styles.tvText,
    (styles as any)[`${variant}Text`],
    (styles as any)[`${size}Text`],
    IS_TV && (styles as any)[`tv${size.charAt(0).toUpperCase() + size.slice(1)}Text`],
  ].filter(Boolean) as TextStyle[];

  const renderContent = () => (
    <>
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? '#fff' : '#ef4444'} />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </>
  );

  // Use gradient for primary button
  if (variant === 'primary') {
    if (IS_TV) {
      return (
        <Pressable
          disabled={disabled || isLoading}
          focusable={true}
          {...props}
        >
          {({ focused }) => (
            <LinearGradient
              colors={['#ef4444', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[getButtonStyles(focused), styles.gradientButton]}
            >
              {renderContent()}
            </LinearGradient>
          )}
        </Pressable>
      );
    }

    return (
      <TouchableOpacity
        disabled={disabled || isLoading}
        activeOpacity={0.7}
        {...props}
      >
        <LinearGradient
          colors={['#ef4444', '#f97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[getButtonStyles(), styles.gradientButton]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Non-primary buttons
  if (IS_TV) {
    return (
      <Pressable
        style={({ focused }) => getButtonStyles(focused)}
        disabled={disabled || isLoading}
        focusable={true}
        {...props}
      >
        {renderContent()}
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // TV Base Styles
  tvButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  tvText: {
    fontWeight: '700',
  },

  // TV Focus States
  tvFocused: {
    transform: [{ scale: 1.05 }],
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  tvPrimaryFocused: {
    shadowColor: '#ef4444',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  tvOutlineFocused: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#f97316',
  },

  // TV Variant Overrides
  tvOutlineButton: {
    borderWidth: 3,
  },
  tvSecondaryButton: {
    backgroundColor: '#5856D6',
  },

  // Variants
  gradientButton: {
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  likeButton: {
    backgroundColor: '#f2c35c',
  },
  nopeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E95A4E',
  },

  // Sizes
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  // TV Size Overrides
  tvSmallButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  tvMediumButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  tvLargeButton: {
    paddingVertical: 24,
    paddingHorizontal: 40,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#ef4444',
  },
  ghostText: {
    color: '#ef4444',
  },
  likeText: {
    color: '#1C1C1E',
  },
  nopeText: {
    color: '#E95A4E',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // TV Text Size Overrides
  tvSmallText: {
    fontSize: 20,
  },
  tvMediumText: {
    fontSize: 24,
  },
  tvLargeText: {
    fontSize: 32,
  },
});

export default Button;