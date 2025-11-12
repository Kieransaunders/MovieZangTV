import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createCollection = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("collections", {
      userId,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic,
    });
  },
});

export const listMyCollections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getCollection = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const collection = await ctx.db.get(args.collectionId);
    
    if (!collection) return null;
    
    // Check if user can view this collection
    if (!collection.isPublic && collection.userId !== userId) {
      return null;
    }

    return collection;
  },
});

export const getCollectionItems = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const collection = await ctx.db.get(args.collectionId);
    
    if (!collection) return [];
    if (!collection.isPublic && collection.userId !== userId) {
      return [];
    }

    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    const titles = await Promise.all(
      items.map(async (item) => {
        const title = await ctx.db.get(item.savedTitleId);
        return title;
      })
    );

    return titles.filter((t) => t !== null);
  },
});

export const addToCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    savedTitleId: v.id("savedTitles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== userId) {
      throw new Error("Collection not found");
    }

    // Check if already in collection
    const existing = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .filter((q) => q.eq(q.field("savedTitleId"), args.savedTitleId))
      .first();

    if (existing) return existing._id;

    const itemId = await ctx.db.insert("collectionItems", {
      collectionId: args.collectionId,
      savedTitleId: args.savedTitleId,
    });

    // Create activity
    await ctx.db.insert("activities", {
      userId,
      type: "added_to_collection",
      savedTitleId: args.savedTitleId,
      collectionId: args.collectionId,
    });

    return itemId;
  },
});

export const removeFromCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    savedTitleId: v.id("savedTitles"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== userId) {
      throw new Error("Collection not found");
    }

    const item = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .filter((q) => q.eq(q.field("savedTitleId"), args.savedTitleId))
      .first();

    if (item) {
      await ctx.db.delete(item._id);
    }
  },
});

export const deleteCollection = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== userId) {
      throw new Error("Collection not found");
    }

    // Delete all items in collection
    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.collectionId);
  },
});
