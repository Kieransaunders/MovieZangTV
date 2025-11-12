"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const TMDB_API_TOKEN = process.env.TMDB_API_TOKEN;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const discoverMovies = action({
  args: {
    page: v.optional(v.number()),
    withGenres: v.optional(v.string()),
    withWatchProviders: v.optional(v.string()),
    watchRegion: v.optional(v.string()),
    voteAverageGte: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const params = new URLSearchParams({
      page: String(args.page || 1),
      ...(args.withGenres && { with_genres: args.withGenres }),
      ...(args.withWatchProviders && { with_watch_providers: args.withWatchProviders }),
      ...(args.watchRegion && { watch_region: args.watchRegion }),
      ...(args.voteAverageGte && { "vote_average.gte": String(args.voteAverageGte) }),
      sort_by: args.sortBy || "popularity.desc",
    });

    const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params}`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return await response.json();
  },
});

export const discoverTV = action({
  args: {
    page: v.optional(v.number()),
    withGenres: v.optional(v.string()),
    withWatchProviders: v.optional(v.string()),
    watchRegion: v.optional(v.string()),
    voteAverageGte: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const params = new URLSearchParams({
      page: String(args.page || 1),
      ...(args.withGenres && { with_genres: args.withGenres }),
      ...(args.withWatchProviders && { with_watch_providers: args.withWatchProviders }),
      ...(args.watchRegion && { watch_region: args.watchRegion }),
      ...(args.voteAverageGte && { "vote_average.gte": String(args.voteAverageGte) }),
      sort_by: args.sortBy || "popularity.desc",
    });

    const response = await fetch(`${TMDB_BASE_URL}/discover/tv?${params}`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return await response.json();
  },
});

export const searchMulti = action({
  args: {
    query: v.string(),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const params = new URLSearchParams({
      query: args.query,
      page: String(args.page || 1),
    });

    const response = await fetch(`${TMDB_BASE_URL}/search/multi?${params}`, {
      headers: {
        Authorization: `Bearer ${TMDB_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return await response.json();
  },
});

export const getMovieDetails = action({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${args.movieId}?append_to_response=watch/providers,credits`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return await response.json();
  },
});

export const getTVDetails = action({
  args: { tvId: v.number() },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${args.tvId}?append_to_response=watch/providers,credits`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return await response.json();
  },
});

export const getGenres = action({
  args: { mediaType: v.union(v.literal("movie"), v.literal("tv")) },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${TMDB_BASE_URL}/genre/${args.mediaType}/list`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return await response.json();
  },
});

export const getWatchProviders = action({
  args: { mediaType: v.union(v.literal("movie"), v.literal("tv")) },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${TMDB_BASE_URL}/watch/providers/${args.mediaType}`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return await response.json();
  },
});

export const getMovieVideos = action({
  args: { movieId: v.number() },
  handler: async (ctx, args) => {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${args.movieId}/videos`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter for YouTube trailers only and sort by official trailers first
    const trailers = data.results
      ?.filter((video: any) => video.site === 'YouTube' && video.type === 'Trailer')
      ?.sort((a: any, b: any) => {
        // Prioritize official trailers
        if (a.official && !b.official) return -1;
        if (!a.official && b.official) return 1;
        return 0;
      }) || [];

    return {
      ...data,
      results: trailers,
    };
  },
});
