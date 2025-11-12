import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getRandomTitlesFromCollection = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== userId) {
      return null;
    }

    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    if (items.length < 2) {
      return null;
    }

    // Get random two items
    const shuffled = items.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);

    const titles = await Promise.all(
      selected.map(async (item) => await ctx.db.get(item.savedTitleId))
    );

    return titles.filter((t) => t !== null);
  },
});
