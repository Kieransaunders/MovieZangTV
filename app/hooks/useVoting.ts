/**
 * useVoting Hook
 * Custom hook for voting functionality using Convex
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { AppError, VotingProgress } from 'app/types/mobile';

interface Movie {
  id: string;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  tmdb_id: number;
  genre_ids: number[];
  streaming_platforms?: any;
}

interface SubmitVoteInput {
  room_id: string;
  participant_id: string;
  movie_id: string;
  vote_type: 'like' | 'dislike';
}

export const useVoting = (roomId: string, participantId: string, movies: Movie[] = []) => {
  const [error, setError] = useState<AppError | null>(null);

  // Query votes for this room (auto-reactive!)
  const votes = useQuery(api.votes.getVotes, { roomId: roomId as Id<'rooms'> }) || [];

  // Filter my votes
  const myVotes = useMemo(() => {
    return votes.filter((vote) => vote.participantId === participantId);
  }, [votes, participantId]);

  // Mutation for submitting votes
  const submitVoteMutation = useMutation(api.votes.submitVote);

  // Submit vote
  const submitVote = useCallback(async (input: SubmitVoteInput) => {
    setError(null);

    try {
      const vote = await submitVoteMutation({
        roomId: roomId as Id<'rooms'>,
        participantId: input.participant_id,
        movieId: input.movie_id as Id<'movies'>,
        voteType: input.vote_type,
      });

      return vote;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit vote';
      const errorType = errorMessage.includes('duplicate') || errorMessage.includes('already')
        ? 'validation_error'
        : 'network_error';

      const appError: AppError = {
        type: errorType,
        message: errorMessage,
        retryable: errorType === 'network_error',
        retryAction: errorType === 'network_error' ? async () => { await submitVote(input); } : undefined,
      };
      setError(appError);
      return null;
    }
  }, [roomId, submitVoteMutation]);

  // Get voting progress
  const getVotingProgress = useCallback((): VotingProgress => {
    const votedMovies = myVotes.length;
    const totalMovies = movies.length;
    const remainingMovies = Math.max(0, totalMovies - votedMovies);
    const progressPercentage = totalMovies > 0
      ? Math.round((votedMovies / totalMovies) * 100)
      : 0;

    return {
      totalMovies,
      votedMovies,
      remainingMovies,
      progressPercentage,
    };
  }, [myVotes, movies]);

  // Check if voted for a movie
  const hasVoted = useCallback((movieId: string): boolean => {
    return myVotes.some((vote) => vote.movieId === movieId);
  }, [myVotes]);

  // Get vote type for a movie
  const getVoteType = useCallback((movieId: string): 'like' | 'dislike' | null => {
    const vote = myVotes.find((v) => v.movieId === movieId);
    if (!vote) return null;
    return vote.voteType;
  }, [myVotes]);

  // Fetch results (computed from votes)
  const fetchResults = useCallback(async () => {
    // Results are computed in real-time from votes query
    // No need to fetch separately
  }, []);

  return {
    votes,
    myVotes,
    votingResults: [], // Will be computed from votes in the component
    isLoading: votes === undefined,
    error,
    submitVote,
    hasVoted,
    getVoteType,
    getVotingProgress,
    fetchResults,
    refreshVotes: () => {}, // Not needed with Convex - auto-reactive
    clearError: () => setError(null),
  };
};
