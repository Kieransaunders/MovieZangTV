"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Category to TMDB genre ID mapping
const CATEGORY_TO_GENRE_ID: Record<string, string | null> = {
  popular: null,
  action: "28",
  adventure: "12",
  animation: "16",
  comedy: "35",
  crime: "80",
  documentary: "99",
  drama: "18",
  family: "10751",
  fantasy: "14",
  history: "36",
  horror: "27",
  music: "10402",
  mystery: "9648",
  romance: "10749",
  "sci-fi": "878",
  thriller: "53",
  war: "10752",
  western: "37",
};

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  genre_ids: number[];
}

interface TMDBResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export const populateRoomWithMovies = action({
  args: {
    roomId: v.id("rooms"),
    category: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"movies">[]> => {
    console.log(`[populateRoomWithMovies] Starting for room ${args.roomId} with category "${args.category}"`);

    // Map category to genre ID
    const genreId = CATEGORY_TO_GENRE_ID[args.category.toLowerCase()];

    if (genreId === undefined) {
      console.error(`[populateRoomWithMovies] Unknown category: ${args.category}`);
      throw new Error(`Unknown category: ${args.category}`);
    }

    console.log(`[populateRoomWithMovies] Category "${args.category}" mapped to genre ID: ${genreId || "none (popular)"}`);

    // Fetch movies from TMDB
    const tmdbParams: {
      page: number;
      sortBy: string;
      withGenres?: string;
    } = {
      page: 1,
      sortBy: "popularity.desc",
    };

    // Only add genre filter if not "popular"
    if (genreId !== null) {
      tmdbParams.withGenres = genreId;
    }

    console.log(`[populateRoomWithMovies] Fetching movies from TMDB with params:`, tmdbParams);

    let tmdbResponse: TMDBResponse;
    try {
      tmdbResponse = await ctx.runAction(api.tmdb.discoverMovies, tmdbParams);
      console.log(`[populateRoomWithMovies] Received ${tmdbResponse.results.length} movies from TMDB`);
    } catch (error) {
      console.error(`[populateRoomWithMovies] Error fetching from TMDB:`, error);
      throw new Error(`Failed to fetch movies from TMDB: ${error}`);
    }

    // Take first 25 movies
    const moviesToAdd = tmdbResponse.results.slice(0, 25);
    console.log(`[populateRoomWithMovies] Processing ${moviesToAdd.length} movies`);

    // Add each movie to the database
    const movieIds: Id<"movies">[] = [];

    for (let i = 0; i < moviesToAdd.length; i++) {
      const movie = moviesToAdd[i];
      console.log(`[populateRoomWithMovies] Adding movie ${i + 1}/${moviesToAdd.length}: "${movie.title}" (TMDB ID: ${movie.id})`);

      try {
        const movieId = await ctx.runMutation(api.votingMovies.addMovie, {
          tmdbId: movie.id,
          title: movie.title,
          overview: movie.overview || undefined,
          posterPath: movie.poster_path || undefined,
          releaseDate: movie.release_date || undefined,
          genreIds: movie.genre_ids || undefined,
        });

        movieIds.push(movieId);
        console.log(`[populateRoomWithMovies] Successfully added movie with ID: ${movieId}`);
      } catch (error) {
        console.error(`[populateRoomWithMovies] Error adding movie "${movie.title}":`, error);
        // Continue with other movies even if one fails
      }
    }

    console.log(`[populateRoomWithMovies] Completed. Added ${movieIds.length} movies to the database`);

    // Link all movies to the room
    if (movieIds.length > 0) {
      console.log(`[populateRoomWithMovies] Linking ${movieIds.length} movies to room ${args.roomId}`);
      try {
        await ctx.runMutation(api.votingMovies.linkMoviesToRoom, {
          roomId: args.roomId,
          movieIds: movieIds,
        });
        console.log(`[populateRoomWithMovies] Successfully linked movies to room`);
      } catch (error) {
        console.error(`[populateRoomWithMovies] Error linking movies to room:`, error);
        throw new Error(`Failed to link movies to room: ${error}`);
      }
    }

    return movieIds;
  },
});
