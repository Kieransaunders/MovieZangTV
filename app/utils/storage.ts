/**
 * AsyncStorage Utilities
 * Helper functions for local storage operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StorageKey,
  LocalStorageData,
  STORAGE_DEFAULTS,
  AccessibilitySettings,
} from 'app/types/storage';

export class StorageUtils {
  /**
   * Get all user preferences
   */
  async getUserPreferences(): Promise<Partial<LocalStorageData>> {
    try {
      const keys = [
        StorageKey.PARTICIPANT_NAME,
        StorageKey.STREAMING_PREFERENCES,
        StorageKey.COUNTRY_PREFERENCE,
        StorageKey.THEME_PREFERENCE,
      ];

      const values = await AsyncStorage.multiGet(keys);
      const preferences: Partial<LocalStorageData> = {};

      values.forEach(([key, value]) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            switch (key) {
              case StorageKey.PARTICIPANT_NAME:
                preferences.participant_name = parsed;
                break;
              case StorageKey.STREAMING_PREFERENCES:
                preferences.streaming_preferences = parsed;
                break;
              case StorageKey.COUNTRY_PREFERENCE:
                preferences.country_preference = parsed;
                break;
              case StorageKey.THEME_PREFERENCE:
                preferences.theme_preference = parsed;
                break;
            }
          } catch {
            // If not JSON, use as string
            if (key === StorageKey.PARTICIPANT_NAME) {
              preferences.participant_name = value;
            }
          }
        }
      });

      return preferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  /**
   * Save user preferences in batch
   */
  async saveUserPreferences(preferences: Partial<LocalStorageData>): Promise<boolean> {
    try {
      const items: [string, string][] = [];

      if (preferences.participant_name !== undefined) {
        items.push([
          StorageKey.PARTICIPANT_NAME,
          JSON.stringify(preferences.participant_name),
        ]);
      }

      if (preferences.streaming_preferences !== undefined) {
        items.push([
          StorageKey.STREAMING_PREFERENCES,
          JSON.stringify(preferences.streaming_preferences),
        ]);
      }

      if (preferences.country_preference !== undefined) {
        items.push([
          StorageKey.COUNTRY_PREFERENCE,
          JSON.stringify(preferences.country_preference),
        ]);
      }

      if (preferences.theme_preference !== undefined) {
        items.push([
          StorageKey.THEME_PREFERENCE,
          JSON.stringify(preferences.theme_preference),
        ]);
      }

      await AsyncStorage.multiSet(items);
      return true;
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      return false;
    }
  }

  /**
   * Clear all user data (logout/reset)
   */
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Clear only session data (keep preferences)
   */
  async clearSessionData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        StorageKey.CURRENT_ROOM_CODE,
      ]);
      return true;
    } catch (error) {
      console.error('Failed to clear session data:', error);
      return false;
    }
  }

  /**
   * Migrate data from old version
   */
  async migrateData(fromVersion: string, toVersion: string): Promise<boolean> {
    try {
      // Example migration logic
      if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
        // Perform migration tasks
        const oldData = await this.getUserPreferences();
        await this.saveUserPreferences(oldData);
      }

      // Update app version
      await AsyncStorage.setItem(StorageKey.APP_VERSION, toVersion);
      return true;
    } catch (error) {
      console.error('Failed to migrate data:', error);
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo(): Promise<{
    totalKeys: number;
    estimatedSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const values = await AsyncStorage.multiGet(keys);

      let estimatedSize = 0;
      values.forEach(([key, value]) => {
        estimatedSize += key.length + (value?.length || 0);
      });

      return {
        totalKeys: keys.length,
        estimatedSize, // in bytes
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { totalKeys: 0, estimatedSize: 0 };
    }
  }

  /**
   * Initialize storage with defaults
   */
  async initializeDefaults(): Promise<boolean> {
    try {
      const currentPrefs = await this.getUserPreferences();

      const defaults: Partial<LocalStorageData> = {
        streaming_preferences: currentPrefs.streaming_preferences || STORAGE_DEFAULTS.streaming_preferences,
        country_preference: currentPrefs.country_preference || STORAGE_DEFAULTS.country_preference,
        has_completed_onboarding: currentPrefs.has_completed_onboarding ?? STORAGE_DEFAULTS.has_completed_onboarding,
        theme_preference: currentPrefs.theme_preference || STORAGE_DEFAULTS.theme_preference,
      };

      await this.saveUserPreferences(defaults);
      return true;
    } catch (error) {
      console.error('Failed to initialize defaults:', error);
      return false;
    }
  }

  /**
   * Export all data (for backup)
   */
  async exportData(): Promise<Record<string, any> | null> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const values = await AsyncStorage.multiGet(keys);

      const data: Record<string, any> = {};
      values.forEach(([key, value]) => {
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      });

      return data;
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * Import data (from backup)
   */
  async importData(data: Record<string, any>): Promise<boolean> {
    try {
      const items: [string, string][] = Object.entries(data).map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]);

      await AsyncStorage.multiSet(items);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

export const storageUtils = new StorageUtils();
