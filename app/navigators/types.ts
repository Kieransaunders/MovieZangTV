/**
 * Navigation Types and Screen Parameters
 * Defines TypeScript types for React Navigation stack
 */

import { NativeStackScreenProps } from "@react-navigation/native-stack"

/**
 * Root Stack Parameter List
 * Defines all routes and their parameters in the app
 */
export type AppStackParamList = {
  Home: undefined
  About: undefined
  CreateRoom: undefined
  JoinRoom: undefined
  ShareRoom: {
    roomCode: string
    roomId: string
    hostName: string
  }
  Room: {
    roomId: string
    roomCode: string
    participantName: string
  }
  Results: {
    roomId: string
    roomCode: string
  }
}

/**
 * Screen Props type helper
 * Automatically generates navigation prop types for each route
 */
export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

/**
 * Navigation Props for each screen
 */
export type HomeScreenProps = AppStackScreenProps<"Home">
export type AboutScreenProps = AppStackScreenProps<"About">
export type CreateRoomScreenProps = AppStackScreenProps<"CreateRoom">
export type JoinRoomScreenProps = AppStackScreenProps<"JoinRoom">
export type ShareRoomScreenProps = AppStackScreenProps<"ShareRoom">
export type RoomScreenProps = AppStackScreenProps<"Room">
export type ResultsScreenProps = AppStackScreenProps<"Results">
