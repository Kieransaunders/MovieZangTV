/**
 * useVotingCompletion Hook
 * Tracks voting completion status across all participants using Convex (auto-reactive!)
 */

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export interface VotingCompletionStatus {
  completedParticipants: number;
  totalParticipants: number;
  completionPercentage: number;
  isAllComplete: boolean;
  isLoading: boolean;
  error: string | null;
  completedParticipantIds: string[];
  pendingParticipantIds: string[];
  participantIds: string[];
}

export const useVotingCompletion = (roomId: string): VotingCompletionStatus => {
  // Query voting progress from Convex (auto-reactive!)
  const votingProgress = useQuery(
    api.votes.getVotingProgress,
    { roomId: roomId as Id<'rooms'> }
  );

  // Compute completion status from query result
  const status = useMemo((): VotingCompletionStatus => {
    if (!votingProgress) {
      return {
        completedParticipants: 0,
        totalParticipants: 0,
        completionPercentage: 0,
        isAllComplete: false,
        isLoading: true,
        error: null,
        completedParticipantIds: [],
        pendingParticipantIds: [],
        participantIds: [],
      };
    }

    const totalCount = votingProgress.participantIds.length;
    const completedCount = votingProgress.completedParticipantIds.length;
    const completionPercentage = totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;
    const isAllComplete = totalCount > 0 && completedCount === totalCount;

    return {
      completedParticipants: completedCount,
      totalParticipants: totalCount,
      completionPercentage,
      isAllComplete,
      isLoading: false,
      error: null,
      completedParticipantIds: votingProgress.completedParticipantIds,
      pendingParticipantIds: votingProgress.pendingParticipantIds,
      participantIds: votingProgress.participantIds,
    };
  }, [votingProgress]);

  return status;
};
