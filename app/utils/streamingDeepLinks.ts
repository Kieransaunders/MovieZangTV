/**
 * Streaming App Deep Links
 * Maps TMDB provider IDs to deep link URL schemes for Apple TV
 */

import { Platform } from 'react-native';

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
}

/**
 * TMDB Provider ID to Deep Link mapping
 * Based on common streaming provider IDs from TMDB API
 */
const PROVIDER_DEEP_LINKS: Record<number, string> = {
  // Netflix
  8: 'netflix://',

  // Amazon Prime Video
  9: 'primevideo://',
  119: 'primevideo://', // Amazon Prime Video (alternate ID)

  // Disney Plus
  337: 'disneyplus://',

  // HBO Max / Max
  384: 'hbomax://',
  1899: 'max://',

  // Hulu
  15: 'hulu://',

  // Apple TV+
  350: 'videos://',

  // Paramount+
  531: 'paramountplus://',

  // Peacock
  386: 'peacocktv://',

  // YouTube
  192: 'youtube://',

  // Crunchyroll
  283: 'crunchyroll://',

  // Showtime
  37: 'showtime://',

  // Starz
  43: 'starz://',

  // ESPN+
  619: 'espnplus://',

  // MGM+
  583: 'mgmplus://',

  // AMC+
  526: 'amcplus://',

  // Tubi
  283: 'tubitv://',

  // Pluto TV
  300: 'plutotv://',

  // fuboTV
  257: 'fubotv://',

  // Sling TV
  299: 'slingtv://',
};

/**
 * Get deep link URL for a streaming provider
 */
export function getProviderDeepLink(providerId: number): string | null {
  return PROVIDER_DEEP_LINKS[providerId] || null;
}

/**
 * Get the best available streaming link
 * Prioritizes installed apps on tvOS, falls back to web on iOS
 */
export function getBestStreamingLink(
  streamingData: {
    flatrate?: StreamingProvider[];
    rent?: StreamingProvider[];
    buy?: StreamingProvider[];
    link?: string;
  },
  tmdbId?: number
): { url: string; type: 'deeplink' | 'web'; providerName?: string } | null {
  if (!streamingData) return null;

  // On Apple TV, try to find a deep linkable provider
  if (Platform.isTV) {
    // Check flatrate (subscription) providers first
    const flatrateProviders = streamingData.flatrate || [];
    for (const provider of flatrateProviders) {
      const deepLink = getProviderDeepLink(provider.provider_id);
      if (deepLink) {
        // Some apps support direct content linking with TMDB ID
        const contentUrl = getContentDeepLink(provider.provider_id, tmdbId);
        return {
          url: contentUrl || deepLink,
          type: 'deeplink',
          providerName: provider.provider_name,
        };
      }
    }

    // If no subscription providers, check rental options
    const rentProviders = streamingData.rent || [];
    for (const provider of rentProviders) {
      const deepLink = getProviderDeepLink(provider.provider_id);
      if (deepLink) {
        const contentUrl = getContentDeepLink(provider.provider_id, tmdbId);
        return {
          url: contentUrl || deepLink,
          type: 'deeplink',
          providerName: provider.provider_name,
        };
      }
    }

    // If no deep links available, return null (button will be hidden)
    return null;
  }

  // On iPhone/iPad, use JustWatch web link
  if (streamingData.link) {
    return {
      url: streamingData.link,
      type: 'web',
    };
  }

  return null;
}

/**
 * Get content-specific deep link if supported by the provider
 */
function getContentDeepLink(providerId: number, tmdbId?: number): string | null {
  if (!tmdbId) return null;

  switch (providerId) {
    case 8: // Netflix - needs Netflix ID, not TMDB ID
      // Would need to convert TMDB ID to Netflix ID via API
      return null;

    case 337: // Disney+
      return `disneyplus://content/tmdb/${tmdbId}`;

    case 350: // Apple TV+
      return `videos://tv.apple.com/movie/tmdb/${tmdbId}`;

    case 192: // YouTube
      // Would need YouTube video ID
      return null;

    default:
      return null;
  }
}

/**
 * Get a user-friendly message for when a streaming app isn't installed
 */
export function getAppNotInstalledMessage(providerName?: string): string {
  if (providerName) {
    return `${providerName} app is not installed. Please install it from the App Store to watch this movie.`;
  }
  return 'The streaming app is not installed. Please install it from the App Store.';
}

/**
 * Get list of all supported streaming providers
 */
export function getSupportedProviders(): Array<{ id: number; name: string; deepLink: string }> {
  const providers = [
    { id: 8, name: 'Netflix', deepLink: 'netflix://' },
    { id: 9, name: 'Prime Video', deepLink: 'primevideo://' },
    { id: 337, name: 'Disney+', deepLink: 'disneyplus://' },
    { id: 384, name: 'HBO Max', deepLink: 'hbomax://' },
    { id: 1899, name: 'Max', deepLink: 'max://' },
    { id: 15, name: 'Hulu', deepLink: 'hulu://' },
    { id: 350, name: 'Apple TV+', deepLink: 'videos://' },
    { id: 531, name: 'Paramount+', deepLink: 'paramountplus://' },
    { id: 386, name: 'Peacock', deepLink: 'peacocktv://' },
  ];

  return providers;
}
