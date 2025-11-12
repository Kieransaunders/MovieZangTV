import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Search for movies using the Trakt.tv API
 * Supports pagination and extended info
 */
export const searchMovies = action({
  args: {
    query: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    extended: v.optional(v.string()), // "full" for full details
  },
  handler: async (ctx, args) => {
    const clientId = process.env.TRAKT_CLIENT_ID;

    if (!clientId) {
      throw new Error("TRAKT_CLIENT_ID not configured");
    }

    try {
      // Build query parameters
      const params = new URLSearchParams({
        query: args.query,
      });

      if (args.page) params.append("page", args.page.toString());
      if (args.limit) params.append("limit", args.limit.toString());
      if (args.extended) params.append("extended", args.extended);

      const response = await fetch(
        `https://api.trakt.tv/search/movie?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            "trakt-api-version": "2",
            "trakt-api-key": clientId,
          },
        }
      );

      if (!response.ok) {
        // Check for rate limiting
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`Trakt API error: ${response.status} ${response.statusText}`);
      }

      // Get pagination headers
      const pagination = {
        page: parseInt(response.headers.get("X-Pagination-Page") || "1"),
        limit: parseInt(response.headers.get("X-Pagination-Limit") || "10"),
        pageCount: parseInt(response.headers.get("X-Pagination-Page-Count") || "1"),
        itemCount: parseInt(response.headers.get("X-Pagination-Item-Count") || "0"),
      };

      const data = await response.json();

      // Transform Trakt.tv response to a cleaner format
      return {
        results: data.map((item: any) => ({
          score: item.score,
          movie: {
            title: item.movie.title,
            year: item.movie.year,
            ids: item.movie.ids,
            tagline: item.movie.tagline,
            overview: item.movie.overview,
            released: item.movie.released,
            runtime: item.movie.runtime,
            country: item.movie.country,
            trailer: item.movie.trailer,
            homepage: item.movie.homepage,
            status: item.movie.status,
            rating: item.movie.rating,
            votes: item.movie.votes,
            comment_count: item.movie.comment_count,
            language: item.movie.language,
            genres: item.movie.genres,
            certification: item.movie.certification,
          },
        })),
        pagination,
      };
    } catch (error) {
      console.error("Error searching Trakt.tv:", error);
      throw error;
    }
  },
});

/**
 * Get detailed movie information from Trakt.tv
 */
export const getMovieDetails = action({
  args: {
    traktId: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.TRAKT_CLIENT_ID;

    if (!clientId) {
      throw new Error("TRAKT_CLIENT_ID not configured");
    }

    try {
      const response = await fetch(
        `https://api.trakt.tv/movies/${args.traktId}?extended=full`,
        {
          headers: {
            "Content-Type": "application/json",
            "trakt-api-version": "2",
            "trakt-api-key": clientId,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`Trakt API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching movie details from Trakt.tv:", error);
      throw error;
    }
  },
});

/**
 * Get trending movies from Trakt.tv
 */
export const getTrendingMovies = action({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    extended: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.TRAKT_CLIENT_ID;

    if (!clientId) {
      throw new Error("TRAKT_CLIENT_ID not configured");
    }

    try {
      const params = new URLSearchParams();
      if (args.page) params.append("page", args.page.toString());
      if (args.limit) params.append("limit", args.limit.toString());
      if (args.extended) params.append("extended", args.extended);

      const queryString = params.toString();
      const url = `https://api.trakt.tv/movies/trending${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": clientId,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`Trakt API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching trending movies from Trakt.tv:", error);
      throw error;
    }
  },
});

/**
 * Get popular movies from Trakt.tv
 */
export const getPopularMovies = action({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    extended: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.TRAKT_CLIENT_ID;

    if (!clientId) {
      throw new Error("TRAKT_CLIENT_ID not configured");
    }

    try {
      const params = new URLSearchParams();
      if (args.page) params.append("page", args.page.toString());
      if (args.limit) params.append("limit", args.limit.toString());
      if (args.extended) params.append("extended", args.extended);

      const queryString = params.toString();
      const url = `https://api.trakt.tv/movies/popular${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "trakt-api-version": "2",
          "trakt-api-key": clientId,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`Trakt API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching popular movies from Trakt.tv:", error);
      throw error;
    }
  },
});
