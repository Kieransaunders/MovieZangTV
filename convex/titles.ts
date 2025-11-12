import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveTitle = mutation({
  args: {
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseDate: v.optional(v.string()),
    streamingPlatforms: v.optional(v.any()),
    director: v.optional(v.string()),
    actors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already saved
    const existing = await ctx.db
      .query("savedTitles")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("savedTitles", {
      userId,
      tmdbId: args.tmdbId,
      mediaType: args.mediaType,
      title: args.title,
      posterPath: args.posterPath,
      releaseDate: args.releaseDate,
      isWatched: false,
      streamingPlatforms: args.streamingPlatforms,
      director: args.director,
      actors: args.actors,
    });
  },
});

export const getMySavedTitles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("savedTitles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getSavedTitle = query({
  args: { tmdbId: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("savedTitles")
      .withIndex("by_user_and_tmdb", (q) => 
        q.eq("userId", userId).eq("tmdbId", args.tmdbId)
      )
      .first();
  },
});

export const markAsWatched = mutation({
  args: {
    savedTitleId: v.id("savedTitles"),
    isWatched: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const title = await ctx.db.get(args.savedTitleId);
    if (!title || title.userId !== userId) {
      throw new Error("Title not found");
    }

    await ctx.db.patch(args.savedTitleId, {
      isWatched: args.isWatched,
    });

    if (args.isWatched) {
      await ctx.db.insert("activities", {
        userId,
        type: "watched",
        savedTitleId: args.savedTitleId,
      });
    }
  },
});

export const rateTitle = mutation({
  args: {
    savedTitleId: v.id("savedTitles"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const title = await ctx.db.get(args.savedTitleId);
    if (!title || title.userId !== userId) {
      throw new Error("Title not found");
    }

    await ctx.db.patch(args.savedTitleId, {
      rating: args.rating,
      review: args.review,
    });

    await ctx.db.insert("activities", {
      userId,
      type: args.review ? "reviewed" : "rated",
      savedTitleId: args.savedTitleId,
    });
  },
});

export const deleteTitle = mutation({
  args: { savedTitleId: v.id("savedTitles") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const title = await ctx.db.get(args.savedTitleId);
    if (!title || title.userId !== userId) {
      throw new Error("Title not found");
    }

    // Delete from all collections
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_saved_title", (q) => q.eq("savedTitleId", args.savedTitleId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.savedTitleId);
  },
});
