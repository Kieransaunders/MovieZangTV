/**
 * Mobile-Specific Types
 * TypeScript types unique to the mobile app implementation
 */

import { Movie, VotingResult } from './supabase';

// App state types
export interface AppState {
  currentRoom: CurrentRoomState | null;
  userPreferences: UserPreferences;
  connectionStatus: ConnectionStatus;
}

export interface CurrentRoomState {
  roomId: string;
  roomCode: string;
  participantName: string;
  isHost: boolean;
  category: string;
  streamingPreferences: string[];
  countryPreference: string;
}

export interface UserPreferences {
  participantName?: string;
  streamingPreferences: string[];
  countryPreference: string;
  hasCompletedOnboarding: boolean;
  recentRoomCodes: string[];
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// Error handling types
export interface AppError {
  type: 'network_error' | 'validation_error' | 'session_expired' | 'unknown_error';
  message: string;
  retryable: boolean;
  retryAction?: () => void | Promise<void>;
  field?: string;
}

export interface NetworkError extends AppError {
  type: 'network_error';
  retryable: true;
  retryAction: () => Promise<void>;
}

export interface ValidationError extends AppError {
  type: 'validation_error';
  field: string;
  retryable: false;
}

export interface SessionError extends AppError {
  type: 'session_expired';
  message: 'Session expired. Please rejoin the room.';
  retryable: true;
  roomCode?: string;
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: AppError;
}

// Movie card swipe types
export interface SwipeGesture {
  direction: 'left' | 'right';
  velocity: number;
  movie: Movie;
}

export interface SwipeResult {
  movieId: string;
  voteType: 'like' | 'dislike';
  isSuccessful: boolean;
  error?: AppError;
}

// Room sharing types
export interface ShareRoomOptions {
  roomCode: string;
  platform: 'ios' | 'android';
  deepLinkUrl: string;
  shareMessage: string;
}

export interface ShareResult {
  isSuccessful: boolean;
  platform: 'ios' | 'android';
  error?: string;
}

// Participant list types
export interface ParticipantListItem {
  id: string;
  name: string;
  isHost: boolean;
  isCurrentUser: boolean;
  joinedAt: string;
  isActive: boolean;
}

// Voting progress types
export interface VotingProgress {
  totalMovies: number;
  votedMovies: number;
  remainingMovies: number;
  progressPercentage: number;
}

// Results display types
export interface ResultsDisplayData {
  topMatches: VotingResult[];
  allResults: VotingResult[];
  totalVotes: number;
  participantCount: number;
  roomCode: string;
}

// Deep linking types
export interface DeepLinkData {
  type: 'join_room' | 'unknown';
  roomCode?: string;
  params?: Record<string, string>;
}

// Performance monitoring types
export interface PerformanceMetrics {
  appStartupTime: number;
  animationFPS: number;
  memoryUsage: number;
  networkLatency: number;
}

// Accessibility types
export interface AccessibilityState {
  screenReaderEnabled: boolean;
  highContrastEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

// Form state types
export interface CreateRoomFormState {
  hostName: string;
  category: string;
  streamingPreferences: string[];
  countryPreference: string;
  errors: {
    hostName?: string;
    category?: string;
    streamingPreferences?: string;
    countryPreference?: string;
  };
  isValid: boolean;
}

export interface JoinRoomFormState {
  roomCode: string;
  participantName: string;
  errors: {
    roomCode?: string;
    participantName?: string;
  };
  isValid: boolean;
}

// Cache types for offline support
export interface CachedMovie {
  movie: Movie;
  cachedAt: string;
  expiresAt: string;
}

export interface CacheState {
  movies: Map<string, CachedMovie>;
  roomData: Map<string, any>;
  lastSyncTime: string | null;
}

// Animation types
export interface CardAnimation {
  translateX: number;
  translateY: number;
  rotate: number;
  opacity: number;
}

// Toast/Notification types
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}
