/**
 * Navigation Types and Screen Parameters
 * Defines TypeScript types for React Navigation stack
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Root Stack Parameter List
export type RootStackParamList = {
  Home: undefined;
  About: undefined;
  CreateRoom: undefined;
  JoinRoom: undefined;
  ShareRoom: {
    roomCode: string;
    roomId: string;
    hostName: string;
  };
  Room: {
    roomId: string;
    roomCode: string;
    participantName: string;
  };
  Results: {
    roomId: string;
    roomCode: string;
  };
};

// Navigation Props for each screen
export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type AboutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'About'>;
export type CreateRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateRoom'>;
export type JoinRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'JoinRoom'>;
export type ShareRoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShareRoom'>;
export type RoomScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Room'>;
export type ResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;

// Route Props for each screen
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type AboutScreenRouteProp = RouteProp<RootStackParamList, 'About'>;
export type CreateRoomScreenRouteProp = RouteProp<RootStackParamList, 'CreateRoom'>;
export type JoinRoomScreenRouteProp = RouteProp<RootStackParamList, 'JoinRoom'>;
export type ShareRoomScreenRouteProp = RouteProp<RootStackParamList, 'ShareRoom'>;
export type RoomScreenRouteProp = RouteProp<RootStackParamList, 'Room'>;
export type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

// Combined Screen Props
export type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
};

export type AboutScreenProps = {
  navigation: AboutScreenNavigationProp;
  route: AboutScreenRouteProp;
};

export type CreateRoomScreenProps = {
  navigation: CreateRoomScreenNavigationProp;
  route: CreateRoomScreenRouteProp;
};

export type JoinRoomScreenProps = {
  navigation: JoinRoomScreenNavigationProp;
  route: JoinRoomScreenRouteProp;
};

export type ShareRoomScreenProps = {
  navigation: ShareRoomScreenNavigationProp;
  route: ShareRoomScreenRouteProp;
};

export type RoomScreenProps = {
  navigation: RoomScreenNavigationProp;
  route: RoomScreenRouteProp;
};

export type ResultsScreenProps = {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
};

// Deep linking configuration types
export type DeepLinkConfig = {
  screens: {
    Home: string;
    JoinRoom: {
      path: 'join/:roomCode';
      parse: {
        roomCode: (roomCode: string) => string;
      };
    };
    ShareRoom: {
      path: 'room/:roomCode/share';
      parse: {
        roomCode: (roomCode: string) => string;
      };
    };
  };
};

// Navigation utilities
export const navigationUtils = {
  // Navigate to share room with proper params
  navigateToShareRoom: (
    navigation: CreateRoomScreenNavigationProp,
    params: RootStackParamList['ShareRoom']
  ) => {
    navigation.navigate('ShareRoom', params);
  },

  // Navigate to room with proper params
  navigateToRoom: (
    navigation: HomeScreenNavigationProp | JoinRoomScreenNavigationProp | ShareRoomScreenNavigationProp,
    params: RootStackParamList['Room']
  ) => {
    navigation.navigate('Room', params);
  },

  // Navigate to results with proper params
  navigateToResults: (
    navigation: RoomScreenNavigationProp,
    params: RootStackParamList['Results']
  ) => {
    navigation.navigate('Results', params);
  },

  // Go back to home
  navigateToHome: (navigation: any) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  },
};
