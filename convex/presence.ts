import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";

// Initialize the Presence component
export const presence = new Presence(components.presence);

// Heartbeat to maintain presence in a room
export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
    isTyping: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Track presence using the room ID as the room token
    // Note: Store typing status in separate table for now
    return await presence.heartbeat(
      ctx,
      args.roomId,
      args.userId,
      args.sessionId,
      args.interval
    );
  },
});

// List all users present in a room
export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

// Disconnect a user session from presence
export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});

// Set typing status for a user in a room
export const setTypingStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.isTyping) {
      // Check if typing status already exists
      const existing = await ctx.db
        .query("typingStatus")
        .withIndex("by_participant_and_room", (q) =>
          q.eq("participantId", args.participantId).eq("roomId", args.roomId)
        )
        .first();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          updatedAt: Date.now(),
        });
      } else {
        // Insert new
        await ctx.db.insert("typingStatus", {
          roomId: args.roomId,
          participantId: args.participantId,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Remove typing status
      const existing = await ctx.db
        .query("typingStatus")
        .withIndex("by_participant_and_room", (q) =>
          q.eq("participantId", args.participantId).eq("roomId", args.roomId)
        )
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }
  },
});

// Get typing users in a room
export const getTypingUsers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const threeSecondsAgo = Date.now() - 3000;

    const typingUsers = await ctx.db
      .query("typingStatus")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gte(q.field("updatedAt"), threeSecondsAgo))
      .collect();

    return typingUsers.map((t) => t.participantId);
  },
});
