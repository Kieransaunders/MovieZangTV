import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Add or get a movie for voting
export const addMovie = mutation({
  args: {
    tmdbId: v.number(),
    title: v.string(),
    overview: v.optional(v.string()),
    posterPath: v.optional(v.string()),
    releaseDate: v.optional(v.string()),
    genreIds: v.optional(v.array(v.number())),
    streamingPlatforms: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if movie already exists
    const existingMovie = await ctx.db
      .query("movies")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .first();

    if (existingMovie) {
      return existingMovie._id;
    }

    // Create new movie
    const movieId = await ctx.db.insert("movies", {
      tmdbId: args.tmdbId,
      title: args.title,
      overview: args.overview,
      posterPath: args.posterPath,
      releaseDate: args.releaseDate,
      genreIds: args.genreIds,
      streamingPlatforms: args.streamingPlatforms,
      createdAt: Date.now(),
    });

    return movieId;
  },
});

// Link movies to a room
export const linkMoviesToRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    movieIds: v.array(v.id("movies")),
  },
  handler: async (ctx, args) => {
    // Add each movie-room link with position
    for (let i = 0; i < args.movieIds.length; i++) {
      await ctx.db.insert("roomMovies", {
        roomId: args.roomId,
        movieId: args.movieIds[i],
        position: i,
      });
    }

    return { success: true, count: args.movieIds.length };
  },
});

// Get movie by ID
export const getMovie = query({
  args: {
    movieId: v.id("movies"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.movieId);
  },
});

// Get movie by TMDB ID
export const getMovieByTmdbId = query({
  args: {
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("movies")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .first();
  },
});

// Get all movies for a room
export const getRoomMovies = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    // Get all room-movie links for this room
    const roomMovies = await ctx.db
      .query("roomMovies")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("asc")
      .collect();

    // Fetch all movies in order
    const movies = await Promise.all(
      roomMovies.map((rm) => ctx.db.get(rm.movieId))
    );

    // Filter out any null values (in case a movie was deleted)
    return movies.filter((movie) => movie !== null);
  },
});
