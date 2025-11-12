/**
 * Reusable Input Component
 * Material Design-inspired text input for mobile app
 */

import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';

const IS_TV = Platform.isTV;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, IS_TV && styles.tvContainer, containerStyle]}>
      {label && <Text style={[styles.label, IS_TV && styles.tvLabel]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          IS_TV && styles.tvInputContainer,
          error && styles.errorContainer,
          IS_TV && isFocused && styles.tvFocusedContainer,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            IS_TV && styles.tvInput,
            leftIcon ? styles.inputWithLeftIcon : null,
            style as any,
          ]}
          placeholderTextColor="#8E8E93"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>

      {error && <Text style={[styles.errorText, IS_TV && styles.tvErrorText]}>{error}</Text>}
      {helperText && !error && <Text style={[styles.helperText, IS_TV && styles.tvHelperText]}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  tvContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  tvLabel: {
    fontSize: 20,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  tvInputContainer: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#4A4A4C',
  },
  tvFocusedContainer: {
    borderColor: '#ef4444',
    backgroundColor: '#252527',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  errorContainer: {
    borderColor: '#FF3B30',
  },
  iconContainer: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tvInput: {
    fontSize: 24,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  tvErrorText: {
    fontSize: 18,
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  tvHelperText: {
    fontSize: 18,
    marginTop: 8,
  },
});

export default Input;
