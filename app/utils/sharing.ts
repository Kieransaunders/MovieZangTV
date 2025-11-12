/**
 * Native Sharing Implementation
 * Platform-specific sharing using Expo Sharing API
 */

import { Platform, Share as RNShare } from 'react-native';
import { ShareRoomOptions, ShareResult } from 'app/types/mobile';

// Conditionally import expo-sharing only on supported platforms (not tvOS)
type ExpoSharingModule = {
  isAvailableAsync: () => Promise<boolean>;
} | null;

let Sharing: ExpoSharingModule = null;
if (!Platform.isTV) {
  try {
    Sharing = require('expo-sharing') as ExpoSharingModule;
  } catch (error) {
    console.warn('expo-sharing not available on this platform');
  }
}

export class SharingService {
  /**
   * Check if sharing is available on the device
   */
  async isAvailable(): Promise<boolean> {
    if (!Sharing || Platform.isTV) {
      return false;
    }
    try {
      return await Sharing.isAvailableAsync();
    } catch (error) {
      return false;
    }
  }

  /**
   * Share room code using native platform sharing
   */
  async shareRoom(options: ShareRoomOptions): Promise<ShareResult> {
    const { roomCode, deepLinkUrl, shareMessage } = options;

    // tvOS doesn't support the native Share API (no Action Sheet)
    if (Platform.isTV) {
      return {
        isSuccessful: false,
        platform: Platform.OS as 'ios' | 'android',
        error: 'Sharing is not supported on Apple TV. Please share the room code manually: ' + roomCode,
      };
    }

    try {
      // Use React Native Share API for better platform support
      const result = await RNShare.share({
        message: Platform.OS === 'android'
          ? `${shareMessage}\n\n${deepLinkUrl}`
          : shareMessage,
        url: Platform.OS === 'ios' ? deepLinkUrl : undefined,
        title: 'Join my MovieZang room!',
      });

      if (result.action === RNShare.sharedAction) {
        return {
          isSuccessful: true,
          platform: Platform.OS as 'ios' | 'android',
        };
      } else if (result.action === RNShare.dismissedAction) {
        return {
          isSuccessful: false,
          platform: Platform.OS as 'ios' | 'android',
          error: 'Share dismissed by user',
        };
      }

      return {
        isSuccessful: false,
        platform: Platform.OS as 'ios' | 'android',
        error: 'Unknown share result',
      };
    } catch (error) {
      const err = error as Error;
      return {
        isSuccessful: false,
        platform: Platform.OS as 'ios' | 'android',
        error: err.message || 'Failed to share',
      };
    }
  }

  /**
   * Share voting results
   */
  async shareResults(
    roomCode: string,
    topMovieTitle: string,
    matchPercentage: number
  ): Promise<ShareResult> {
    const message = `We picked "${topMovieTitle}" (${matchPercentage}% match) in room ${roomCode}! Join us at MovieZang to find your next movie!`;
    const deepLinkUrl = `https://www.moviezang.com/join/${roomCode}`;

    // tvOS doesn't support the native Share API (no Action Sheet)
    if (Platform.isTV) {
      return {
        isSuccessful: false,
        platform: Platform.OS as 'ios' | 'android',
        error: 'Sharing is not supported on Apple TV',
      };
    }

    try {
      const result = await RNShare.share({
        message: Platform.OS === 'android' ? `${message}\n\n${deepLinkUrl}` : message,
        url: Platform.OS === 'ios' ? deepLinkUrl : undefined,
        title: 'Check out our movie pick!',
      });

      if (result.action === RNShare.sharedAction) {
        return {
          isSuccessful: true,
          platform: Platform.OS as 'ios' | 'android',
        };
      }

      return {
        isSuccessful: false,
        platform: Platform.OS as 'ios' | 'android',
        error: 'Share dismissed',
      };
    } catch (error) {
      const err = error as Error;
      return {
        isSuccessful: false,
        platform: Platform.OS as 'ios' | 'android',
        error: err.message || 'Failed to share results',
      };
    }
  }

  /**
   * Generate deep link URL for room
   */
  generateDeepLink(roomCode: string): string {
    return `https://www.moviezang.com/join/${roomCode}`;
  }

  /**
   * Generate share message for room
   */
  generateShareMessage(roomCode: string, hostName?: string): string {
    const baseMessage = `Join my MovieZang room with code: ${roomCode}`;
    return hostName ? `${hostName} invited you to ${baseMessage}` : baseMessage;
  }
}

export const sharingService = new SharingService();
