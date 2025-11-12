/**
 * useAsyncStorage Hook
 * Custom hook for AsyncStorage operations with type safety
 */

import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StorageKey,
  StorageResult,
  StorageError,
  STORAGE_DEFAULTS,
  StorageValidation,
  AccessibilitySettings,
} from 'app/types/storage';

export const useAsyncStorage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<StorageError | null>(null);

  // Generic get item
  const getItem = useCallback(async <T = string>(key: StorageKey): Promise<StorageResult<T>> => {
    setIsLoading(true);
    setError(null);

    try {
      const value = await AsyncStorage.getItem(key);

      if (value === null) {
        return { success: true, data: undefined };
      }

      try {
        const parsed = JSON.parse(value) as T;
        return { success: true, data: parsed };
      } catch {
        // If not JSON, return as string
        return { success: true, data: value as T };
      }
    } catch (err) {
      const error = err as Error;
      const storageError: StorageError = {
        code: 'READ_ERROR',
        message: error.message || 'Failed to read from storage',
        key,
      };
      setError(storageError);
      return { success: false, error: storageError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generic set item
  const setItem = useCallback(async <T = unknown>(key: StorageKey, value: T): Promise<StorageResult<void>> => {
    setIsLoading(true);
    setError(null);

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return { success: true };
    } catch (err) {
      const error = err as Error;
      const storageError: StorageError = {
        code: error.message?.includes('quota') ? 'QUOTA_EXCEEDED' : 'WRITE_ERROR',
        message: error.message || 'Failed to write to storage',
        key,
      };
      setError(storageError);
      return { success: false, error: storageError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remove item
  const removeItem = useCallback(async (key: StorageKey): Promise<StorageResult<void>> => {
    setIsLoading(true);
    setError(null);

    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (err) {
      const error = err as Error;
      const storageError: StorageError = {
        code: 'DELETE_ERROR',
        message: error.message || 'Failed to delete from storage',
        key,
      };
      setError(storageError);
      return { success: false, error: storageError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Typed getters/setters
  const getParticipantName = useCallback(async (): Promise<string | null> => {
    const result = await getItem<string>(StorageKey.PARTICIPANT_NAME);
    return result.data || null;
  }, [getItem]);

  const setParticipantName = useCallback(async (name: string): Promise<boolean> => {
    if (!StorageValidation.isValidParticipantName(name)) {
      return false;
    }
    const result = await setItem(StorageKey.PARTICIPANT_NAME, name);
    return result.success;
  }, [setItem]);

  const getStreamingPreferences = useCallback(async (): Promise<string[]> => {
    const result = await getItem<string[]>(StorageKey.STREAMING_PREFERENCES);
    return result.data || STORAGE_DEFAULTS.streaming_preferences || [];
  }, [getItem]);

  const setStreamingPreferences = useCallback(async (services: string[]): Promise<boolean> => {
    if (!StorageValidation.isValidStreamingPreferences(services)) {
      return false;
    }
    const result = await setItem(StorageKey.STREAMING_PREFERENCES, services);
    return result.success;
  }, [setItem]);

  const getCountryPreference = useCallback(async (): Promise<string> => {
    const result = await getItem<string>(StorageKey.COUNTRY_PREFERENCE);
    return result.data || STORAGE_DEFAULTS.country_preference || 'US';
  }, [getItem]);

  const setCountryPreference = useCallback(async (country: string): Promise<boolean> => {
    if (!StorageValidation.isValidCountryPreference(country)) {
      return false;
    }
    const result = await setItem(StorageKey.COUNTRY_PREFERENCE, country);
    return result.success;
  }, [setItem]);

  const getCurrentRoomCode = useCallback(async (): Promise<string | null> => {
    const result = await getItem<string>(StorageKey.CURRENT_ROOM_CODE);
    return result.data || null;
  }, [getItem]);

  const setCurrentRoomCode = useCallback(async (code: string): Promise<boolean> => {
    if (!StorageValidation.isValidRoomCode(code)) {
      return false;
    }
    const result = await setItem(StorageKey.CURRENT_ROOM_CODE, code);
    return result.success;
  }, [setItem]);

  const clearCurrentRoomCode = useCallback(async (): Promise<boolean> => {
    const result = await removeItem(StorageKey.CURRENT_ROOM_CODE);
    return result.success;
  }, [removeItem]);

  const getRecentRoomCodes = useCallback(async (): Promise<string[]> => {
    const result = await getItem<string[]>(StorageKey.RECENT_ROOM_CODES);
    return result.data || [];
  }, [getItem]);

  const addRecentRoomCode = useCallback(async (code: string): Promise<boolean> => {
    if (!StorageValidation.isValidRoomCode(code)) {
      return false;
    }

    const recent = await getRecentRoomCodes();
    const updated = [code, ...recent.filter((c) => c !== code)].slice(0, 5);
    const result = await setItem(StorageKey.RECENT_ROOM_CODES, updated);
    return result.success;
  }, [getItem, setItem, getRecentRoomCodes]);

  const getHasCompletedOnboarding = useCallback(async (): Promise<boolean> => {
    const result = await getItem<boolean>(StorageKey.HAS_COMPLETED_ONBOARDING);
    return result.data || false;
  }, [getItem]);

  const setHasCompletedOnboarding = useCallback(async (completed: boolean): Promise<boolean> => {
    const result = await setItem(StorageKey.HAS_COMPLETED_ONBOARDING, completed);
    return result.success;
  }, [setItem]);

  const getThemePreference = useCallback(async (): Promise<'light' | 'dark' | 'auto'> => {
    const result = await getItem<'light' | 'dark' | 'auto'>(StorageKey.THEME_PREFERENCE);
    return result.data || 'auto';
  }, [getItem]);

  const setThemePreference = useCallback(async (theme: 'light' | 'dark' | 'auto'): Promise<boolean> => {
    const result = await setItem(StorageKey.THEME_PREFERENCE, theme);
    return result.success;
  }, [setItem]);

  const getAccessibilitySettings = useCallback(async (): Promise<AccessibilitySettings> => {
    const result = await getItem<AccessibilitySettings>(StorageKey.ACCESSIBILITY_SETTINGS);
    return result.data || STORAGE_DEFAULTS.accessibility_settings!;
  }, [getItem]);

  const setAccessibilitySettings = useCallback(async (settings: AccessibilitySettings): Promise<boolean> => {
    const result = await setItem(StorageKey.ACCESSIBILITY_SETTINGS, settings);
    return result.success;
  }, [setItem]);

  const clearAll = useCallback(async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    isLoading,
    error,
    getItem,
    setItem,
    removeItem,
    getParticipantName,
    setParticipantName,
    getStreamingPreferences,
    setStreamingPreferences,
    getCountryPreference,
    setCountryPreference,
    getCurrentRoomCode,
    setCurrentRoomCode,
    clearCurrentRoomCode,
    getRecentRoomCodes,
    addRecentRoomCode,
    getHasCompletedOnboarding,
    setHasCompletedOnboarding,
    getThemePreference,
    setThemePreference,
    getAccessibilitySettings,
    setAccessibilitySettings,
    clearAll,
    clearError: () => setError(null),
  };
};
