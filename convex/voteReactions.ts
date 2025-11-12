import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Record a vote reaction (like/dislike) for real-time display
export const recordVoteReaction = mutation({
  args: {
    roomId: v.id("rooms"),
    movieId: v.id("movies"),
    participantId: v.string(),
    reaction: v.union(v.literal("like"), v.literal("dislike")),
  },
  handler: async (ctx, args) => {
    // Store the reaction with a short TTL (will be cleaned up after 5 seconds)
    const reactionId = await ctx.db.insert("voteReactions", {
      roomId: args.roomId,
      movieId: args.movieId,
      participantId: args.participantId,
      reaction: args.reaction,
      createdAt: Date.now(),
    });

    return reactionId;
  },
});

// Get recent vote reactions for a room (last 5 seconds)
export const getRecentReactions = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const fiveSecondsAgo = Date.now() - 5000;

    const reactions = await ctx.db
      .query("voteReactions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gte(q.field("createdAt"), fiveSecondsAgo))
      .collect();

    // Enrich reactions with movie titles
    const enrichedReactions = await Promise.all(
      reactions.map(async (reaction) => {
        const movie = await ctx.db.get(reaction.movieId);
        return {
          ...reaction,
          movieTitle: movie?.title || "Unknown Movie",
        };
      })
    );

    return enrichedReactions;
  },
});

// Cleanup old reactions (called periodically)
export const cleanupOldReactions = mutation({
  args: {},
  handler: async (ctx) => {
    const fiveSecondsAgo = Date.now() - 5000;

    const oldReactions = await ctx.db
      .query("voteReactions")
      .filter((q) => q.lt(q.field("createdAt"), fiveSecondsAgo))
      .collect();

    // Delete old reactions
    for (const reaction of oldReactions) {
      await ctx.db.delete(reaction._id);
    }

    return { deleted: oldReactions.length };
  },
});
