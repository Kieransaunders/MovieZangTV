import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Submit a vote for a movie
export const submitVote = mutation({
  args: {
    roomId: v.id("rooms"),
    movieId: v.id("movies"),
    participantId: v.string(),
    voteType: v.union(v.literal("like"), v.literal("dislike")),
  },
  handler: async (ctx, args) => {
    // Check if room exists and is active
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "active") {
      throw new Error(`Room is ${room.status}`);
    }

    if (room.expiresAt < Date.now()) {
      await ctx.db.patch(room._id, { status: "expired" });
      throw new Error("Room has expired");
    }

    // Check if participant is in the room
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (!participant) {
      throw new Error("Not a participant in this room");
    }

    // Check if movie exists
    const movie = await ctx.db.get(args.movieId);
    if (!movie) {
      throw new Error("Movie not found");
    }

    // Check if participant already voted for this movie
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) =>
        q.and(
          q.eq(q.field("movieId"), args.movieId),
          q.eq(q.field("participantId"), args.participantId)
        )
      )
      .first();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        voteType: args.voteType,
        votedAt: Date.now(),
      });
      return { voteId: existingVote._id, updated: true };
    }

    // Create new vote
    const voteId = await ctx.db.insert("votes", {
      roomId: args.roomId,
      movieId: args.movieId,
      participantId: args.participantId,
      voteType: args.voteType,
      votedAt: Date.now(),
    });

    return { voteId, updated: false };
  },
});

// Get all votes for a room
export const getVotes = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return votes;
  },
});

// Get voting progress for a room
export const getVotingProgress = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get all participants
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const totalParticipants = participants.length;
    const completedParticipants = participants.filter(
      (p) => p.votingCompletedAt !== undefined
    );
    const pendingParticipants = participants.filter(
      (p) => p.votingCompletedAt === undefined
    );

    const completionPercentage =
      totalParticipants > 0 ? (completedParticipants.length / totalParticipants) * 100 : 0;

    const isAllComplete = totalParticipants > 0 && completedParticipants.length === totalParticipants;

    return {
      totalParticipants,
      completedParticipants: completedParticipants.length,
      pendingParticipants: pendingParticipants.length,
      completionPercentage: Math.round(completionPercentage),
      isAllComplete,
      participantIds: participants.map((p) => p.participantId),
      completedParticipantIds: completedParticipants.map((p) => p.participantId),
      pendingParticipantIds: pendingParticipants.map((p) => p.participantId),
    };
  },
});

// Get voting results with match scores
export const getResults = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get all votes for the room
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get all participants
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const totalParticipants = participants.length;

    // Group votes by movie
    const movieVotes = votes.reduce(
      (acc, vote) => {
        const movieIdStr = vote.movieId;
        if (!acc[movieIdStr]) {
          acc[movieIdStr] = {
            movieId: vote.movieId,
            likes: 0,
            dislikes: 0,
            voters: new Set<string>(),
          };
        }

        if (vote.voteType === "like") {
          acc[movieIdStr].likes++;
        } else {
          acc[movieIdStr].dislikes++;
        }
        acc[movieIdStr].voters.add(vote.participantId);

        return acc;
      },
      {} as Record<
        string,
        {
          movieId: any;
          likes: number;
          dislikes: number;
          voters: Set<string>;
        }
      >
    );

    // Calculate match scores
    const results = await Promise.all(
      Object.values(movieVotes).map(async (movieData) => {
        const movie = await ctx.db.get(movieData.movieId);

        // Match score calculation:
        // - All participants must have voted (voters.size === totalParticipants)
        // - All votes must be "like" (likes === totalParticipants && dislikes === 0)
        // - Otherwise, it's not a perfect match
        const isMatch =
          movieData.voters.size === totalParticipants &&
          movieData.likes === totalParticipants &&
          movieData.dislikes === 0;

        // Calculate match percentage
        const matchScore =
          totalParticipants > 0
            ? Math.round((movieData.likes / totalParticipants) * 100)
            : 0;

        return {
          movie,
          likes: movieData.likes,
          dislikes: movieData.dislikes,
          totalVotes: movieData.voters.size,
          matchScore,
          isMatch,
        };
      })
    );

    // Sort by match score (highest first)
    results.sort((a, b) => b.matchScore - a.matchScore);

    return results;
  },
});

// Get detailed voting results with individual vote information
export const getDetailedResults = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get all votes for the room
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get all participants
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Group votes by movie
    const movieVotes = votes.reduce(
      (acc, vote) => {
        const movieIdStr = vote.movieId;
        if (!acc[movieIdStr]) {
          acc[movieIdStr] = {
            movieId: vote.movieId,
            likes: 0,
            dislikes: 0,
            votingDetails: [],
          };
        }

        // Add vote detail
        acc[movieIdStr].votingDetails.push({
          participantId: vote.participantId,
          vote: vote.voteType === "like",
        });

        if (vote.voteType === "like") {
          acc[movieIdStr].likes++;
        } else {
          acc[movieIdStr].dislikes++;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          movieId: any;
          likes: number;
          dislikes: number;
          votingDetails: Array<{ participantId: string; vote: boolean }>;
        }
      >
    );

    // Calculate match scores and include detailed vote information
    const results = await Promise.all(
      Object.values(movieVotes)
        .filter((movieData) => movieData.likes > 0) // Only movies with at least one like
        .map(async (movieData) => {
          const movie = await ctx.db.get(movieData.movieId);

          const totalVotes = movieData.votingDetails.length;
          const matchPercentage =
            totalVotes > 0
              ? Math.round((movieData.likes / totalVotes) * 100)
              : 0;

          return {
            movie,
            totalVotes,
            positiveVotes: movieData.likes,
            negativeVotes: movieData.dislikes,
            matchPercentage,
            votingDetails: movieData.votingDetails,
          };
        })
    );

    // Sort by match percentage (highest first), then by positive votes
    results.sort(
      (a, b) =>
        b.matchPercentage - a.matchPercentage ||
        b.positiveVotes - a.positiveVotes
    );

    return {
      results,
      participants: participants.map((p) => ({
        participantId: p.participantId,
        votingCompletedAt: p.votingCompletedAt,
      })),
    };
  },
});

// Mark voting as complete for a participant
export const markVotingComplete = mutation({
  args: {
    roomId: v.id("rooms"),
    participantName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the participant
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("participantId"), args.participantName))
      .first();

    if (!participant) {
      throw new Error("Participant not found in room");
    }

    // Update voting completion timestamp
    await ctx.db.patch(participant._id, {
      votingCompletedAt: Date.now(),
    });

    return { success: true };
  },
});

// Reset voting completion for a participant (allows re-voting)
export const resetVotingCompletion = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the participant
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (!participant) {
      throw new Error("Participant not found in room");
    }

    // Remove voting completion timestamp
    await ctx.db.patch(participant._id, {
      votingCompletedAt: undefined,
    });

    return { success: true };
  },
});
