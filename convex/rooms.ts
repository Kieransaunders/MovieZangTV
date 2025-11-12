import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to generate a random 4-digit room code
function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Create a new room
export const createRoom = mutation({
  args: {
    category: v.string(),
    hostId: v.string(),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate a unique room code
    let code = generateRoomCode();
    let attempts = 0;

    // Ensure the code is unique (max 10 attempts)
    while (attempts < 10) {
      const existingRoom = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();

      if (!existingRoom) break;
      code = generateRoomCode();
      attempts++;
    }

    if (attempts === 10) {
      throw new Error("Failed to generate unique room code");
    }

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours from now

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      code,
      category: args.category,
      hostId: args.hostId,
      status: "active",
      expiresAt,
      maxParticipants: args.maxParticipants ?? 10,
      createdAt: now,
    });

    // Add host as first participant
    await ctx.db.insert("roomParticipants", {
      roomId,
      participantId: args.hostId,
      joinedAt: now,
    });

    return { roomId, code };
  },
});

// Get a room by its code
export const getRoomByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!room) {
      return null;
    }

    // Return room with computed expired status (don't modify in query)
    if (room.expiresAt < Date.now() && room.status === "active") {
      return { ...room, status: "expired" as const };
    }

    return room;
  },
});

// Get a room by its ID
export const getRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);

    if (!room) {
      return null;
    }

    // Return room with computed expired status (don't modify in query)
    if (room.expiresAt < Date.now() && room.status === "active") {
      return { ...room, status: "expired" as const };
    }

    return room;
  },
});

// Join a room
export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
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

    // Check if participant already joined
    const existingParticipant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (existingParticipant) {
      throw new Error("Already joined this room");
    }

    // Check if room is full
    const participantCount = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect()
      .then((participants) => participants.length);

    if (participantCount >= room.maxParticipants) {
      throw new Error("Room is full");
    }

    // Add participant
    await ctx.db.insert("roomParticipants", {
      roomId: args.roomId,
      participantId: args.participantId,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

// Join a room by code (convenience mutation for mobile)
export const joinRoomByCode = mutation({
  args: {
    roomCode: v.string(),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    // First, find the room by code
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode))
      .first();

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

    // Check if participant already joined
    const existingParticipant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (existingParticipant) {
      throw new Error("Already joined this room");
    }

    // Check if room is full
    const participantCount = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect()
      .then((participants) => participants.length);

    if (participantCount >= room.maxParticipants) {
      throw new Error("Room is full");
    }

    // Add participant
    await ctx.db.insert("roomParticipants", {
      roomId: room._id,
      participantId: args.participantId,
      joinedAt: Date.now(),
    });

    return { roomId: room._id, code: room.code };
  },
});

// Leave a room
export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (!participant) {
      throw new Error("Not a participant in this room");
    }

    await ctx.db.delete(participant._id);

    // Check if room is now empty
    const remainingParticipants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // If no participants left, mark room as completed
    if (remainingParticipants.length === 0) {
      await ctx.db.patch(args.roomId, { status: "completed" });
    }

    return { success: true };
  },
});

// Get all participants in a room
export const getParticipants = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return participants;
  },
});

// Mark voting as complete for a participant
export const markVotingComplete = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.string(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (!participant) {
      throw new Error("Not a participant in this room");
    }

    if (participant.votingCompletedAt) {
      throw new Error("Voting already completed");
    }

    await ctx.db.patch(participant._id, {
      votingCompletedAt: Date.now(),
    });

    return { success: true };
  },
});
