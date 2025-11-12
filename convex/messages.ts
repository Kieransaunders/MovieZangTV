import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message to a room
export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate message
    const trimmedMessage = args.message.trim();
    if (!trimmedMessage) {
      throw new Error("Message cannot be empty");
    }

    if (trimmedMessage.length > 500) {
      throw new Error("Message too long (max 500 characters)");
    }

    // Insert message
    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      participantId: args.participantId,
      message: trimmedMessage,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Get all messages for a room
export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("asc")
      .collect();

    return messages;
  },
});

// Get recent messages (last 50)
export const getRecentMessages = query({
  args: {
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(limit);

    // Reverse to show oldest first
    return messages.reverse();
  },
});

// Add or toggle a reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    participantId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already reacted with this emoji
    const existing = await ctx.db
      .query("messageReactions")
      .withIndex("by_participant_and_message", (q) =>
        q.eq("participantId", args.participantId).eq("messageId", args.messageId)
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .first();

    if (existing) {
      // Remove reaction if it exists (toggle off)
      await ctx.db.delete(existing._id);
      return { removed: true };
    } else {
      // Add new reaction
      await ctx.db.insert("messageReactions", {
        messageId: args.messageId,
        participantId: args.participantId,
        emoji: args.emoji,
        createdAt: Date.now(),
      });
      return { removed: false };
    }
  },
});

// Get reactions for messages in a room
export const getMessageReactions = query({
  args: {
    messageIds: v.array(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("messageReactions")
      .filter((q) =>
        q.or(
          ...args.messageIds.map((id) => q.eq(q.field("messageId"), id))
        )
      )
      .collect();

    // Group by message and emoji - return as array to avoid emoji keys
    const grouped: Record<string, Array<{ emoji: string; count: number; users: string[] }>> = {};

    for (const reaction of reactions) {
      const msgId = reaction.messageId;
      if (!grouped[msgId]) grouped[msgId] = [];

      // Find existing emoji in array
      const existing = grouped[msgId].find((r) => r.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reaction.participantId);
      } else {
        grouped[msgId].push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.participantId],
        });
      }
    }

    return grouped;
  },
});
