/**
 * useRoomPresence Hook
 * Manages presence tracking for participants in a room using Convex
 * React Native version with app lifecycle handling and typing status
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

interface UseRoomPresenceProps {
  roomId: Id<'rooms'>;
  participantName: string;
}

export const useRoomPresence = ({ roomId, participantName }: UseRoomPresenceProps) => {
  const appState = useRef(AppState.currentState);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionId] = useState(() => `${Date.now()}-${Math.random()}`);

  // Mutations
  const heartbeatMutation = useMutation(api.presence.heartbeat);
  const disconnectMutation = useMutation(api.presence.disconnect);
  const setTypingMutation = useMutation(api.presence.setTypingStatus);

  // Query the list of present users
  const presenceList = useQuery(
    api.presence.list,
    roomId ? { roomToken: roomId } : 'skip'
  );

  // Query typing users
  const typingUsers = useQuery(
    api.presence.getTypingUsers,
    roomId ? { roomId } : 'skip'
  ) || [];

  // Send heartbeat every 5 seconds
  useEffect(() => {
    if (!roomId || !participantName) return;

    const sendHeartbeat = async () => {
      if (appState.current === 'active') {
        try {
          await heartbeatMutation({
            roomId,
            userId: participantName,
            sessionId,
            interval: 10000, // 10 second timeout
          });
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for periodic heartbeats
    intervalRef.current = setInterval(sendHeartbeat, 5000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Disconnect when component unmounts
      disconnectMutation({ sessionToken: sessionId }).catch((error) => {
        console.error('Failed to disconnect:', error);
      });
    };
  }, [roomId, participantName, sessionId, heartbeatMutation, disconnectMutation]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;

      // Send heartbeat when app comes to foreground
      if (nextAppState === 'active' && roomId && participantName) {
        heartbeatMutation({
          roomId,
          userId: participantName,
          sessionId,
          interval: 10000,
        }).catch((error) => {
          console.error('Failed to send heartbeat on foreground:', error);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [roomId, participantName, sessionId, heartbeatMutation]);

  // Function to set typing status
  const setTypingStatus = useCallback(async (typing: boolean) => {
    if (!roomId) return;

    try {
      await setTypingMutation({
        roomId,
        participantId: participantName,
        isTyping: typing,
      });
    } catch (error) {
      console.error('Failed to set typing status:', error);
    }

    // Auto-clear typing status after 3 seconds of inactivity
    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTypingMutation({
          roomId,
          participantId: participantName,
          isTyping: false,
        }).catch((error) => {
          console.error('Failed to clear typing status:', error);
        });
      }, 3000);
    }
  }, [roomId, participantName, setTypingMutation]);

  // Extract online participants from presence list
  const onlineParticipants = presenceList
    ? presenceList.map((user) => user.userId)
    : [];

  // Filter out current participant from typing users
  const filteredTypingUsers = typingUsers.filter((user) => user !== participantName);

  return {
    onlineParticipants,
    totalOnline: onlineParticipants.length,
    isOnline: (name: string) => onlineParticipants.includes(name),
    typingUsers: filteredTypingUsers,
    setTypingStatus,
  };
};
