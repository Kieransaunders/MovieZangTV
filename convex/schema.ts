import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Collections (custom lists like "Want to Watch", "Favorites", etc.)
  collections: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  }).index("by_user", ["userId"]),

  // Saved titles (movies/TV shows)
  savedTitles: defineTable({
    userId: v.id("users"),
    tmdbId: v.number(),
    mediaType: v.union(v.literal("movie"), v.literal("tv")),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseDate: v.optional(v.string()),
    isWatched: v.boolean(),
    rating: v.optional(v.number()), // 1-5 stars
    review: v.optional(v.string()),
    streamingPlatforms: v.optional(v.any()), // Streaming providers data from TMDB
    director: v.optional(v.string()), // Director name
    actors: v.optional(v.array(v.string())), // Main actors (top 5)
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tmdb", ["userId", "tmdbId"]),

  // Collection items (many-to-many relationship)
  collectionItems: defineTable({
    collectionId: v.id("collections"),
    savedTitleId: v.id("savedTitles"),
  })
    .index("by_collection", ["collectionId"])
    .index("by_saved_title", ["savedTitleId"]),

  // Friend requests
  friendRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
  })
    .index("by_to_user", ["toUserId"])
    .index("by_from_user", ["fromUserId"])
    .index("by_users", ["fromUserId", "toUserId"]),

  // Activity feed
  activities: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("watched"),
      v.literal("rated"),
      v.literal("reviewed"),
      v.literal("added_to_collection")
    ),
    savedTitleId: v.id("savedTitles"),
    collectionId: v.optional(v.id("collections")),
  }).index("by_user", ["userId"]),

  // Voting rooms
  rooms: defineTable({
    code: v.string(), // 4-digit room code
    category: v.string(), // Movie category/genre
    hostId: v.string(), // User ID of the host
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("expired")
    ),
    expiresAt: v.number(), // Timestamp
    maxParticipants: v.number(), // Default 10
    createdAt: v.number(), // Timestamp
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  // Room participants
  roomParticipants: defineTable({
    roomId: v.id("rooms"),
    participantId: v.string(), // User ID
    joinedAt: v.number(), // Timestamp
    votingCompletedAt: v.optional(v.number()), // Timestamp when voting completed
  })
    .index("by_room", ["roomId"])
    .index("by_participant", ["participantId"]),

  // Room-Movie associations (junction table)
  roomMovies: defineTable({
    roomId: v.id("rooms"),
    movieId: v.id("movies"),
    position: v.number(), // Order in which movies should be shown
  })
    .index("by_room", ["roomId"])
    .index("by_movie", ["movieId"]),

  // Movies in voting rooms
  movies: defineTable({
    tmdbId: v.number(),
    title: v.string(),
    overview: v.optional(v.string()),
    posterPath: v.optional(v.string()),
    releaseDate: v.optional(v.string()),
    genreIds: v.optional(v.array(v.number())),
    streamingPlatforms: v.optional(v.any()), // Flexible structure for streaming data
    voteAverage: v.optional(v.number()), // TMDB rating (0-10)
    runtime: v.optional(v.number()), // Runtime in minutes
    director: v.optional(v.string()), // Director name
    cast: v.optional(v.array(v.string())), // Main cast members
    createdAt: v.number(), // Timestamp
  }).index("by_tmdb_id", ["tmdbId"]),

  // Votes
  votes: defineTable({
    roomId: v.id("rooms"),
    movieId: v.id("movies"),
    participantId: v.string(), // User ID
    voteType: v.union(v.literal("like"), v.literal("dislike")),
    votedAt: v.number(), // Timestamp
  })
    .index("by_room", ["roomId"])
    .index("by_movie", ["movieId"])
    .index("by_participant", ["participantId"]),

  // Room messages (chat)
  messages: defineTable({
    roomId: v.id("rooms"),
    participantId: v.string(), // User ID
    message: v.string(),
    createdAt: v.number(), // Timestamp
  })
    .index("by_room", ["roomId", "createdAt"]),

  // Message reactions
  messageReactions: defineTable({
    messageId: v.id("messages"),
    participantId: v.string(), // User ID who reacted
    emoji: v.string(), // Emoji unicode (👍, ❤️, 😂)
    createdAt: v.number(), // Timestamp
  })
    .index("by_message", ["messageId"])
    .index("by_participant_and_message", ["participantId", "messageId"]),

  // Vote reactions (temporary, for live reaction display)
  voteReactions: defineTable({
    roomId: v.id("rooms"),
    movieId: v.id("movies"),
    participantId: v.string(), // User ID who voted
    reaction: v.union(v.literal("like"), v.literal("dislike")),
    createdAt: v.number(), // Timestamp
  })
    .index("by_room", ["roomId"])
    .index("by_movie", ["movieId"]),

  // Typing status (temporary, for live typing indicators)
  typingStatus: defineTable({
    roomId: v.id("rooms"),
    participantId: v.string(), // User ID who is typing
    updatedAt: v.number(), // Timestamp
  })
    .index("by_room", ["roomId"])
    .index("by_participant_and_room", ["participantId", "roomId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
