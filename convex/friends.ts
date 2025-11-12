import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendFriendRequest = mutation({
  args: { toUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.toUserId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if request already exists
    const existing = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("fromUserId", userId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existing) {
      throw new Error("Friend request already sent");
    }

    // Check reverse request
    const reverse = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("fromUserId", args.toUserId).eq("toUserId", userId)
      )
      .first();

    if (reverse) {
      throw new Error("This user has already sent you a friend request");
    }

    return await ctx.db.insert("friendRequests", {
      fromUserId: userId,
      toUserId: args.toUserId,
      status: "pending",
    });
  },
});

export const acceptFriendRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request || request.toUserId !== userId) {
      throw new Error("Friend request not found");
    }

    await ctx.db.patch(args.requestId, { status: "accepted" });
  },
});

export const rejectFriendRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request || request.toUserId !== userId) {
      throw new Error("Friend request not found");
    }

    await ctx.db.patch(args.requestId, { status: "rejected" });
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return await Promise.all(
      requests.map(async (req) => {
        const fromUser = await ctx.db.get(req.fromUserId);
        return {
          ...req,
          fromUser,
        };
      })
    );
  },
});

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const sentRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const receivedRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...sentRequests.map((r) => r.toUserId),
      ...receivedRequests.map((r) => r.fromUserId),
    ];

    return await Promise.all(
      friendIds.map(async (id) => await ctx.db.get(id))
    );
  },
});

export const searchUsers = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (!args.email) return [];

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .take(10);

    return users.filter((u) => u._id !== userId);
  },
});

export const getFriendCollections = query({
  args: { friendId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify friendship
    const isFriend = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("fromUserId", userId).eq("toUserId", args.friendId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    const isFriendReverse = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) => 
        q.eq("fromUserId", args.friendId).eq("toUserId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .first();

    if (!isFriend && !isFriendReverse) {
      return [];
    }

    return await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", args.friendId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
  },
});
