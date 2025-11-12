/**
 * AsyncStorage Types
 * TypeScript types for local device storage
 */

// Storage keys enum for type safety
export enum StorageKey {
  PARTICIPANT_NAME = '@movieZang:participant_name',
  STREAMING_PREFERENCES = '@movieZang:streaming_preferences',
  COUNTRY_PREFERENCE = '@movieZang:country_preference',
  CURRENT_ROOM_CODE = '@movieZang:current_room_code',
  RECENT_ROOM_CODES = '@movieZang:recent_room_codes',
  HAS_COMPLETED_ONBOARDING = '@movieZang:has_completed_onboarding',
  APP_VERSION = '@movieZang:app_version',
  THEME_PREFERENCE = '@movieZang:theme_preference',
  ACCESSIBILITY_SETTINGS = '@movieZang:accessibility_settings',
}

// Storage data schema
export interface LocalStorageData {
  // User preferences
  participant_name?: string;
  streaming_preferences: string[];
  country_preference: string;

  // Session management
  current_room_code?: string;
  last_room_codes: string[];

  // App state
  has_completed_onboarding: boolean;
  app_version: string;

  // UI preferences
  theme_preference: 'light' | 'dark' | 'auto';
  accessibility_settings: AccessibilitySettings;
}

export interface AccessibilitySettings {
  screen_reader_enabled: boolean;
  high_contrast_enabled: boolean;
  font_size: 'small' | 'medium' | 'large';
  reduce_motion: boolean;
}

// Storage operation result types
export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

export interface StorageError {
  code: 'READ_ERROR' | 'WRITE_ERROR' | 'DELETE_ERROR' | 'PARSE_ERROR' | 'QUOTA_EXCEEDED';
  message: string;
  key?: StorageKey;
}

// Storage methods interface
export interface StorageService {
  // Basic operations
  getItem<T = string>(key: StorageKey): Promise<StorageResult<T>>;
  setItem(key: StorageKey, value: any): Promise<StorageResult<void>>;
  removeItem(key: StorageKey): Promise<StorageResult<void>>;
  clear(): Promise<StorageResult<void>>;

  // Typed getters/setters
  getParticipantName(): Promise<string | null>;
  setParticipantName(name: string): Promise<void>;

  getStreamingPreferences(): Promise<string[]>;
  setStreamingPreferences(services: string[]): Promise<void>;

  getCountryPreference(): Promise<string>;
  setCountryPreference(country: string): Promise<void>;

  getCurrentRoomCode(): Promise<string | null>;
  setCurrentRoomCode(code: string): Promise<void>;
  clearCurrentRoomCode(): Promise<void>;

  getRecentRoomCodes(): Promise<string[]>;
  addRecentRoomCode(code: string): Promise<void>;

  getHasCompletedOnboarding(): Promise<boolean>;
  setHasCompletedOnboarding(completed: boolean): Promise<void>;

  getAppVersion(): Promise<string>;
  setAppVersion(version: string): Promise<void>;

  getThemePreference(): Promise<'light' | 'dark' | 'auto'>;
  setThemePreference(theme: 'light' | 'dark' | 'auto'): Promise<void>;

  getAccessibilitySettings(): Promise<AccessibilitySettings>;
  setAccessibilitySettings(settings: AccessibilitySettings): Promise<void>;
}

// Storage defaults
export const STORAGE_DEFAULTS: Partial<LocalStorageData> = {
  streaming_preferences: [],
  country_preference: 'US',
  last_room_codes: [],
  has_completed_onboarding: false,
  theme_preference: 'auto',
  accessibility_settings: {
    screen_reader_enabled: false,
    high_contrast_enabled: false,
    font_size: 'medium',
    reduce_motion: false,
  },
};

// Storage validation helpers
export const StorageValidation = {
  isValidParticipantName: (name: string): boolean => {
    return name.length >= 1 && name.length <= 50;
  },

  isValidRoomCode: (code: string): boolean => {
    return /^\d{4}$/.test(code);
  },

  isValidStreamingPreferences: (services: string[]): boolean => {
    return Array.isArray(services) && services.every(s => typeof s === 'string');
  },

  isValidCountryPreference: (country: string): boolean => {
    return ['US', 'GB', 'CA', 'AU'].includes(country);
  },

  isValidAppVersion: (version: string): boolean => {
    return /^\d+\.\d+\.\d+$/.test(version);
  },
};

// Recent room codes configuration
export const RECENT_ROOM_CODES_CONFIG = {
  MAX_RECENT_CODES: 5,
  STORAGE_KEY: StorageKey.RECENT_ROOM_CODES,
} as const;
