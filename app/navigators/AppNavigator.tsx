/**
 * The app navigator contains the primary navigation flows for MovieZang TV.
 * It provides a simple stack navigation structure optimized for TV experiences.
 */
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import React from "react"
import { useColorScheme } from "react-native"
import Config from "../config"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import { colors } from "app/theme"
import { AppStackParamList } from "./types"

// Import MovieZang screens
import HomeScreen from "app/screens/HomeScreen"
import CreateRoomScreen from "app/screens/CreateRoomScreen"
import JoinRoomScreen from "app/screens/JoinRoomScreen"
import ShareRoomScreen from "app/screens/ShareRoomScreen"
import RoomScreen from "app/screens/RoomScreen"
import ResultsScreen from "app/screens/ResultsScreen"
import AboutScreen from "app/screens/AboutScreen"

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Deep linking configuration for MovieZang
const linking = {
  prefixes: ['moviezang://', 'https://moviezang.app'],
  config: {
    screens: {
      Home: '',
      About: 'about',
      CreateRoom: 'create',
      JoinRoom: 'join',
      ShareRoom: 'room/:roomCode/share',
      Room: 'room/:roomCode',
      Results: 'results/:roomCode',
    },
  },
}

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName="Home"
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'MovieZang',
        }}
      />

      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About',
        }}
      />

      <Stack.Screen
        name="CreateRoom"
        component={CreateRoomScreen}
        options={{
          title: 'Create Room',
        }}
      />

      <Stack.Screen
        name="JoinRoom"
        component={JoinRoomScreen}
        options={{
          title: 'Join Room',
        }}
      />

      <Stack.Screen
        name="ShareRoom"
        component={ShareRoomScreen}
        options={({ route }) => ({
          title: `Share Room ${route.params.roomCode}`,
        })}
      />

      <Stack.Screen
        name="Room"
        component={RoomScreen}
        options={({ route }) => ({
          title: `Room ${route.params.roomCode}`,
          gestureEnabled: false, // Prevent accidental swipe back during voting
        })}
      />

      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          title: 'Results',
        }}
      />
    </Stack.Navigator>
  )
}

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export function AppNavigator(props: NavigationProps) {
  const colorScheme = useColorScheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      linking={linking}
      {...props}
    >
      <AppStack />
    </NavigationContainer>
  )
}
