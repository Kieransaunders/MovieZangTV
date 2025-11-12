import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActivityFeed = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get friends
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

    // Get activities from friends
    const allActivities = [];
    for (const friendId of friendIds) {
      const activities = await ctx.db
        .query("activities")
        .withIndex("by_user", (q) => q.eq("userId", friendId))
        .order("desc")
        .take(20);
      allActivities.push(...activities);
    }

    // Sort by creation time
    allActivities.sort((a, b) => b._creationTime - a._creationTime);

    // Enrich with user and title data
    return await Promise.all(
      allActivities.slice(0, 50).map(async (activity) => {
        const user = await ctx.db.get(activity.userId);
        const title = await ctx.db.get(activity.savedTitleId);
        const collection = activity.collectionId
          ? await ctx.db.get(activity.collectionId)
          : null;

        return {
          ...activity,
          user,
          title,
          collection,
        };
      })
    );
  },
});
