/**
 * useRoom Hook
 * Custom hook for room management using Convex
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { AppError } from 'app/types/mobile';

interface CreateRoomInput {
  code: string;
  category: string;
  host_id: string;
  streaming_preferences: string[];
  country_preference: string;
  status: string;
  movie_count: number;
  min_score: number;
}

interface JoinRoomInput {
  room_id: string;
  participant_id: string;
}

export const useRoom = (roomId?: Id<'rooms'>) => {
  const [error, setError] = useState<AppError | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Query room details
  const room = useQuery(
    api.rooms.getRoom,
    roomId ? { roomId } : 'skip'
  );

  // Query participants
  const participants = useQuery(
    api.rooms.getParticipants,
    roomId ? { roomId } : 'skip'
  );

  // Mutations
  const createRoomMutation = useMutation(api.rooms.createRoom);
  const joinRoomByCodeMutation = useMutation(api.rooms.joinRoomByCode);
  const leaveRoomMutation = useMutation(api.rooms.leaveRoom);

  // Create room
  const createRoom = useCallback(async (input: CreateRoomInput) => {
    setError(null);
    setIsCreating(true);

    try {
      // Convex createRoom only accepts category, hostId, and maxParticipants
      // Other parameters like streaming preferences are not stored in the schema
      const result = await createRoomMutation({
        category: input.category,
        hostId: input.host_id,
        maxParticipants: 10, // Default value
      });

      setIsCreating(false);

      // Validate result
      if (!result || !result.roomId || !result.code) {
        throw new Error('Invalid room creation response');
      }

      // Map Convex response { roomId, code } to expected format { _id, code }
      return {
        _id: result.roomId,
        code: result.code,
      };
    } catch (err: any) {
      setIsCreating(false);
      console.error('Create room error:', err);
      const appError: AppError = {
        type: 'network_error',
        message: err.message || 'Failed to create room',
        retryable: true,
        retryAction: async () => { await createRoom(input); },
      };
      setError(appError);
      return null;
    }
  }, [createRoomMutation]);

  // Join room
  const joinRoom = useCallback(async (input: JoinRoomInput) => {
    setError(null);

    try {
      // input.room_id is actually a room code
      // input.participant_id is the participant's name
      const result = await joinRoomByCodeMutation({
        roomCode: input.room_id,
        participantId: input.participant_id,
      });

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to join room';
      const errorType = errorMessage.includes('full') || errorMessage.includes('not found')
        ? 'validation_error'
        : 'network_error';

      const appError: AppError = {
        type: errorType,
        message: errorMessage,
        retryable: errorType === 'network_error',
        retryAction: errorType === 'network_error' ? async () => { await joinRoom(input); } : undefined,
      };
      setError(appError);
      return null;
    }
  }, [joinRoomByCodeMutation]);

  // Leave room
  const leaveRoom = useCallback(async (participantId: string) => {
    if (!roomId) return false;

    setError(null);

    try {
      await leaveRoomMutation({
        roomId,
        participantId,
      });

      return true;
    } catch (err: any) {
      const appError: AppError = {
        type: 'network_error',
        message: err.message || 'Failed to leave room',
        retryable: true,
        retryAction: async () => { await leaveRoom(participantId); },
      };
      setError(appError);
      return false;
    }
  }, [roomId, leaveRoomMutation]);

  return {
    room: room || null,
    participants: participants || [],
    isLoading: roomId ? (room === undefined || participants === undefined) : isCreating,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    refreshParticipants: () => {}, // Not needed with Convex - auto-reactive
    clearError: () => setError(null),
  };
};
