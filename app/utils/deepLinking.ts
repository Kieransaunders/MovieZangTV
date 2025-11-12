/**
 * Deep Linking Configuration
 * Handle deep links for room codes
 */

import * as Linking from 'expo-linking';
import { DeepLinkData } from 'app/types/mobile';

export class DeepLinkingService {
  private readonly prefix = 'movieZang://';
  private readonly webPrefix = 'https://movieZang.app';

  /**
   * Parse deep link URL
   */
  parseDeepLink(url: string): DeepLinkData {
    try {
      const { hostname, path, queryParams } = Linking.parse(url);

      // Handle join room link: movieZang://join/1234 or https://movieZang.app/join/1234
      if (path?.includes('join/') || hostname === 'join') {
        const roomCode = path?.replace('join/', '') || queryParams?.roomCode;

        if (roomCode && /^\d{4}$/.test(roomCode as string)) {
          return {
            type: 'join_room',
            roomCode: roomCode as string,
          };
        }
      }

      return { type: 'unknown' };
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return { type: 'unknown' };
    }
  }

  /**
   * Create deep link URL for room
   */
  createRoomLink(roomCode: string): string {
    return `${this.prefix}join/${roomCode}`;
  }

  /**
   * Create web fallback URL for room
   */
  createWebLink(roomCode: string): string {
    return `${this.webPrefix}/join/${roomCode}`;
  }

  /**
   * Create universal link (works for both app and web)
   */
  createUniversalLink(roomCode: string): string {
    // Universal links use HTTPS and will open the app if installed,
    // otherwise fall back to web
    return this.createWebLink(roomCode);
  }

  /**
   * Get initial deep link URL (app opened via link)
   */
  async getInitialURL(): Promise<string | null> {
    try {
      return await Linking.getInitialURL();
    } catch (error) {
      console.error('Failed to get initial URL:', error);
      return null;
    }
  }

  /**
   * Add deep link listener
   */
  addListener(callback: (data: DeepLinkData) => void): { remove: () => void } {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const data = this.parseDeepLink(url);
      callback(data);
    });

    return {
      remove: () => subscription.remove(),
    };
  }

  /**
   * Handle initial deep link (on app launch)
   */
  async handleInitialLink(): Promise<DeepLinkData | null> {
    try {
      const url = await this.getInitialURL();
      if (!url) return null;

      return this.parseDeepLink(url);
    } catch (error) {
      console.error('Failed to handle initial link:', error);
      return null;
    }
  }

  /**
   * Validate room code from deep link
   */
  validateRoomCode(roomCode: string): boolean {
    return /^\d{4}$/.test(roomCode);
  }

  /**
   * Create shareable link with metadata
   */
  createShareableLink(roomCode: string, hostName?: string): {
    url: string;
    message: string;
  } {
    const url = this.createUniversalLink(roomCode);
    const message = hostName
      ? `${hostName} invited you to join room ${roomCode} on MovieZang!`
      : `Join room ${roomCode} on MovieZang!`;

    return { url, message };
  }
}

export const deepLinkingService = new DeepLinkingService();

/**
 * Deep linking configuration for React Navigation
 */
export const linkingConfig = {
  prefixes: ['movieZang://', 'https://movieZang.app'],
  config: {
    screens: {
      Home: '',
      CreateRoom: 'create',
      JoinRoom: {
        path: 'join/:roomCode?',
        parse: {
          roomCode: (roomCode: string) => roomCode,
        },
      },
      Room: {
        path: 'room/:roomCode',
        parse: {
          roomCode: (roomCode: string) => roomCode,
        },
      },
      Results: {
        path: 'results/:roomCode',
        parse: {
          roomCode: (roomCode: string) => roomCode,
        },
      },
    },
  },
};
