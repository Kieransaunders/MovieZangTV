/**
 * useDetailedResults Hook
 * Fetches detailed voting results with movie metadata and participant status
 */

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

interface VoteDetail {
  participantId: string;
  vote: boolean;
}

export interface DetailedMovieResult {
  id: string;
  movie: {
    _id: string;
    title: string;
    posterPath: string;
    overview: string;
    tmdbId: number;
    releaseDate: string;
    genreIds: number[];
    streamingPlatforms?: any;
  };
  totalVotes: number;
  positiveVotes: number;
  negativeVotes: number;
  matchPercentage: number;
  votingDetails: VoteDetail[];
}

export interface ParticipantStatus {
  participantId: string;
  votingCompletedAt?: number;
}

interface UseDetailedResultsReturn {
  results: DetailedMovieResult[];
  participants: ParticipantStatus[];
  isLoading: boolean;
  completedParticipants: number;
  totalParticipants: number;
  completionPercentage: number;
  isAllComplete: boolean;
  refresh: () => void;
}

/**
 * Mobile-friendly replica of the web detailed results hook
 */
export const useDetailedResults = (roomId: string): UseDetailedResultsReturn => {
  // Fetch detailed results from Convex
  const data = useQuery(
    api.votes.getDetailedResults,
    roomId ? { roomId: roomId as Id<'rooms'> } : 'skip'
  );

  const isLoading = data === undefined;

  const results: DetailedMovieResult[] = useMemo(() => {
    if (!data?.results) return [];

    return data.results.map((result) => ({
      id: result.movie?._id || '',
      movie: result.movie || {
        _id: '',
        title: '',
        posterPath: '',
        overview: '',
        tmdbId: 0,
        releaseDate: '',
        genreIds: [],
      },
      totalVotes: result.totalVotes,
      positiveVotes: result.positiveVotes,
      negativeVotes: result.negativeVotes,
      matchPercentage: result.matchPercentage,
      votingDetails: result.votingDetails.map((v: any) => ({
        participantId: v.participantId,
        vote: v.vote,
      })),
    }));
  }, [data?.results]);

  const participants: ParticipantStatus[] = useMemo(() => {
    if (!data?.participants) return [];

    return data.participants.map((p) => ({
      participantId: p.participantId,
      votingCompletedAt: p.votingCompletedAt,
    }));
  }, [data?.participants]);

  const { completedParticipants, totalParticipants } = useMemo(() => {
    const total = participants.length;
    const completed = participants.filter((p) => p.votingCompletedAt !== undefined).length;
    return { completedParticipants: completed, totalParticipants: total };
  }, [participants]);

  const completionPercentage = totalParticipants > 0
    ? Math.round((completedParticipants / totalParticipants) * 100)
    : 0;

  const isAllComplete = totalParticipants > 0 && completedParticipants === totalParticipants;

  return {
    results,
    participants,
    isLoading,
    completedParticipants,
    totalParticipants,
    completionPercentage,
    isAllComplete,
    refresh: () => {}, // Convex handles reactivity automatically
  };
};

export default useDetailedResults;
