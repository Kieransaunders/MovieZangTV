/**
 * Shared Supabase Types
 * TypeScript types matching the web app's Supabase schema
 */

// Room entity types
export interface Room {
  id: string;
  code: string;
  category: string;
  host_id: string;
  streaming_preferences: string[];
  country_preference: string;
  status: 'active' | 'completed' | 'expired';
  max_participants: number;
  movie_count: number;
  min_score: number;
  created_at: string;
  updated_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  participant_id: string;
  joined_at: string;
  voting_completed_at?: string | null;
}

export interface Vote {
  id: string;
  room_id: string;
  participant_id: string;
  movie_id: string;
  vote: boolean;
  voted_at: string;
}

// Room creation input type
export interface CreateRoomInput {
  code: string;
  category: string;
  host_id: string;
  streaming_preferences: string[];
  country_preference: string;
  status?: 'active';
  max_participants?: number;
  movie_count?: number;
  min_score?: number;
}

// Vote submission input type
export interface SubmitVoteInput {
  room_id: string;
  participant_id: string;
  movie_id: string;
  vote_type: 'like' | 'dislike';
}

// Join room input type
export interface JoinRoomInput {
  room_id: string;
  participant_id: string;
}

// Streaming provider interfaces (matching web app)
export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
}

export interface StreamingCountryAvailability {
  link?: string;
  flatrate?: StreamingProvider[];
  buy?: StreamingProvider[];
  rent?: StreamingProvider[];
  ads?: StreamingProvider[];
  free?: StreamingProvider[];
}

// Movie data type (matching web app structure)
export interface Movie {
  id: string;
  title: string;
  poster_path: string | null;
  overview: string | null;
  release_date: string | null;
  tmdb_id: number;
  genre_ids: number[] | null;
  streaming_platforms?: Record<string, StreamingCountryAvailability> | null;
  vote_average?: number;
  runtime?: number;
}

// Voting results aggregation type
export interface VotingResult {
  movie_id: string;
  movie: Movie;
  like_count: number;
  dislike_count: number;
  total_votes: number;
  vote_percentage: number;
}

// Real-time subscription payload types
export interface RealtimePayload<T = any> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  errors: any;
}

export interface RoomUpdatePayload extends RealtimePayload<Room> {
  new: Room;
}

export interface ParticipantUpdatePayload extends RealtimePayload<RoomParticipant> {
  new: RoomParticipant;
}

export interface VoteUpdatePayload extends RealtimePayload<Vote> {
  new: Vote;
}

// Supabase error types
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Query response types
export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: SupabaseError | null;
  count?: number;
}

// Room validation constants
export const ROOM_VALIDATION = {
  CODE_LENGTH: 4,
  CODE_PATTERN: /^\d{4}$/,
  PARTICIPANT_NAME_MIN: 1,
  PARTICIPANT_NAME_MAX: 50,
  DEFAULT_MAX_PARTICIPANTS: 10,
} as const;

// Movie categories matching web app
export const MOVIE_CATEGORIES = [
  { value: 'popular', label: 'Popular' },
  { value: 'action', label: 'Action' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'animation', label: 'Animation' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'crime', label: 'Crime' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'drama', label: 'Drama' },
  { value: 'family', label: 'Family' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'history', label: 'History' },
  { value: 'horror', label: 'Horror' },
  { value: 'music', label: 'Music' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
  { value: 'sci-fi', label: 'Science Fiction' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'war', label: 'War' },
  { value: 'western', label: 'Western' },
] as const;

// Streaming services with TMDB provider IDs
export const STREAMING_SERVICES = [
  { id: 'netflix', name: 'Netflix', providerId: 8 },
  { id: 'amazon', name: 'Amazon Prime Video', providerId: 119 },
  { id: 'disney', name: 'Disney+', providerId: 337 },
  { id: 'hulu', name: 'Hulu', providerId: 15 },
  { id: 'hbo', name: 'HBO Max', providerId: 384 },
  { id: 'apple', name: 'Apple TV+', providerId: 350 },
  { id: 'paramount', name: 'Paramount+', providerId: 531 },
  { id: 'peacock', name: 'Peacock', providerId: 387 },
] as const;

export type StreamingService = typeof STREAMING_SERVICES[number];

// Country options - expanded list matching web app
export const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
] as const;

export type CountryCode = typeof COUNTRIES[number]['code'];

// Movie count options
export const MOVIE_COUNT_OPTIONS = [10, 20, 30, 50] as const;

// Minimum score options
export const MIN_SCORE_OPTIONS = [
  { value: 0, label: 'Any score' },
  { value: 5, label: '5.0+' },
  { value: 6, label: '6.0+' },
  { value: 7, label: '7.0+' },
  { value: 8, label: '8.0+' },
] as const;
