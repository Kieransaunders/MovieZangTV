# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MovieZang TV** is a multi-platform React Native app for collaborative movie voting and discovery, optimized for TV platforms (Apple TV, Android TV) while supporting mobile and web. Built with Expo 53, React Native TV 0.79.1-1, and Convex backend.

**Key Concept**: Users create or join rooms using 4-digit codes, swipe through movies together, vote, chat in real-time, and see results ranked by group preferences.

## Quick Start Commands

### Development
```bash
# Install dependencies
yarn

# Start Expo dev server
yarn start
# or
npm start

# Run on specific platforms
yarn ios              # iPhone/iPad simulator
yarn android          # Android phone emulator
yarn web              # Web browser

# TV builds (requires prebuild first)
yarn prebuild:tv      # Generate TV native projects
yarn ios              # Run on Apple TV simulator
yarn android --device tv_api_31  # Run on Android TV emulator

# Standard mobile builds
yarn prebuild         # Generate mobile native projects
```

### Build & Test
```bash
# TypeScript validation
yarn compile          # Check types without emitting files

# Code quality
yarn lint             # Run ESLint and auto-fix + format with Prettier
yarn format           # Format code with Prettier

# Testing
yarn test             # Run Jest tests
yarn test:watch       # Jest watch mode
yarn test:maestro     # Run Maestro e2e tests

# EAS Build (cloud builds)
eas build --profile development --platform ios
eas build --profile development:tv --platform ios      # For Apple TV
eas build --profile production --platform android
```

### Convex Backend
```bash
npx convex dev        # Connect to backend, watch for schema changes, generate types
```

## Architecture

### Tech Stack
- **Framework**: Expo SDK 53 with prebuild workflow (ejected native projects)
- **React Native**: react-native-tvos 0.79.1-1 (fork with TV support)
- **Navigation**: React Navigation 7 (native-stack)
- **Backend**: Convex (real-time, serverless)
- **State Management**: Convex queries/mutations (no MobX, no Redux)
- **Styling**: StyleSheet + theme tokens (spacing, colors, typography)

### Key Dependencies
- `@react-native-tvos/config-tv`: Expo plugin for TV support
- `@convex-dev/presence`: Real-time presence (typing indicators, online status)
- `expo-linear-gradient`: Gradients for UI
- `expo-sharing`: Share room codes to other apps
- `expo-linking`: Deep linking for room codes

### Project Structure
```
app/
├── components/         # Reusable UI components
│   ├── ui/            # Base components (Button, Card, Input, MovieCard)
│   ├── ChatPanel.tsx  # Room chat interface
│   ├── FloatingChatButton.tsx
│   ├── ParticipantsList.tsx
│   ├── ReactionOverlay.tsx  # Live voting reactions
│   └── TypingIndicator.tsx
├── screens/           # Full-screen views
│   ├── HomeScreen.tsx
│   ├── CreateRoomScreen.tsx
│   ├── JoinRoomScreen.tsx
│   ├── ShareRoomScreen.tsx
│   ├── RoomScreen.tsx         # Main voting interface
│   ├── ResultsScreen.tsx
│   └── AboutScreen.tsx
├── navigators/        # React Navigation setup
│   ├── AppNavigator.tsx       # Stack navigator with deep linking
│   ├── navigationUtilities.ts # Navigation helpers, TV layout utils
│   └── types.ts              # Navigation param types
├── hooks/             # Custom React hooks
│   ├── useRoom.ts            # Room data, participants, status
│   ├── useVoting.ts          # Vote submission, tracking
│   ├── useDetailedResults.ts # Calculate results with streaming links
│   ├── useVotingCompletion.ts
│   ├── useRoomPresence.ts    # Presence tracking
│   └── useAsyncStorage.ts
├── utils/             # Utilities
│   ├── streamingDeepLinks.ts # Generate links to Netflix, Disney+, etc.
│   ├── deepLinking.ts        # Parse room codes from URLs
│   ├── sharing.ts            # Share room invites
│   ├── accessibility.ts      # TV-specific a11y helpers
│   ├── performance.ts        # Image prefetching
│   └── storage.ts            # AsyncStorage wrapper
├── types/             # TypeScript type definitions
│   ├── navigation.ts         # React Navigation types
│   ├── mobile.ts            # App-specific types
│   ├── storage.ts           # AsyncStorage types
│   └── supabase.ts          # Supabase types (if using)
├── theme/             # Design tokens
│   ├── colors.ts
│   ├── spacing.ts           # TV-scaled spacing (2x mobile)
│   ├── typography.ts
│   └── timing.ts
├── config/            # App configuration
│   └── config.base.ts       # Navigation persistence, error handling
└── app.tsx            # Root component, Convex provider

convex/                # Convex backend functions
├── schema.ts          # Database schema (rooms, votes, messages, etc.)
├── rooms.ts           # Room CRUD, join/leave
├── votes.ts           # Vote recording
├── votingMovies.ts    # Movie data for rooms
├── messages.ts        # Chat messages
├── voteReactions.ts   # Live reaction animations
├── presence.ts        # Typing indicators, online status
├── tmdb.ts            # TMDB API integration
└── auth.ts            # Auth (optional, may not be used for TV)
```

## Important Patterns

### 1. TV-First Design
- **Focus States**: All interactive elements MUST have visible focus indicators for TV remotes.
- **Spacing**: Use theme spacing tokens (already 2x mobile scale for TV readability).
- **Component Sizing**: MovieCards, Buttons, and text are sized for 10-foot UI.
- **Navigation**: D-pad and remote control friendly (no complex gestures).

Example focus pattern:
```tsx
<Pressable
  style={({ focused }) => [
    styles.button,
    focused && { borderColor: colors.tint, borderWidth: 3 }
  ]}
>
  {/* content */}
</Pressable>
```

### 2. Real-Time Architecture (Convex)
- **No Local State for Server Data**: Use `useQuery()` for reading, `useMutation()` for writing.
- **Auto-Subscribing**: Convex queries automatically re-render on backend changes.
- **Presence**: Use `@convex-dev/presence` for typing indicators and online status.

Example query pattern:
```tsx
import { useQuery, useMutation } from "convex/react"
import { api } from "convex/_generated/api"

const room = useQuery(api.rooms.getRoom, { roomId })
const joinRoom = useMutation(api.rooms.joinRoom)
```

### 3. Navigation with Deep Linking
- **Custom Scheme**: `moviezang://`
- **Universal Links**: `https://moviezang.app` (configured but may need DNS setup)
- **Room Codes**: Parse from URLs like `moviezang://room/1234` or `moviezang://results/1234`

Deep link structure (app/navigators/AppNavigator.tsx:34):
```
moviezang://                    → Home
moviezang://create              → CreateRoom
moviezang://room/AB12           → Room (with roomCode param)
moviezang://results/AB12        → Results
```

### 4. Multi-Platform Support
- **Mobile**: iPhone, iPad, Android phones/tablets
- **TV**: Apple TV (tvOS), Android TV, Fire TV
- **Web**: Experimental (Metro bundler for web)

Platform switching:
```bash
# Switch to TV mode
EXPO_TV=1 npx expo prebuild --clean
yarn ios  # Runs on Apple TV simulator

# Switch back to mobile
npx expo prebuild --clean
yarn ios  # Runs on iPhone simulator
```

## Convex Backend

### Deployment
- **URL**: `https://kindhearted-dalmatian-79.convex.cloud`
- **Shared Backend**: TV app shares same Convex deployment as web app (moviezang.com)
- **Environment**: Set in `.env.local` (`EXPO_PUBLIC_CONVEX_URL`)

### Key Schema Tables
- `rooms`: Voting rooms (code, category, status, expiresAt)
- `roomParticipants`: Who's in each room (tracks votingCompletedAt)
- `movies`: Movie data (tmdbId, title, poster, streamingPlatforms)
- `roomMovies`: Junction table (room-to-movies, ordered by position)
- `votes`: User votes (like/dislike per movie, per participant)
- `messages`: Chat messages in rooms
- `voteReactions`: Temporary live reactions (for UI animations)
- `typingStatus`: Temporary typing indicators

### Important Convex Patterns
- **Room Codes**: 4-digit codes, unique, generated in `convex/rooms.ts:generateRoomCode()`
- **24-Hour TTL**: Rooms expire after 24 hours (checked in queries, patched to "expired" status)
- **Voting Completion**: Track per participant with `votingCompletedAt` timestamp
- **Movie Deduplication**: Movies table uses `by_tmdb_id` index to avoid duplicates

### Environment Variables (Convex Dashboard)
Set at https://dashboard.convex.dev/:
- `TMDB_API_TOKEN`: The Movie Database API key (required for movie data)
- `SITE_URL`: May need updating for TV app deep linking (currently web-focused)
- `TRAKT_CLIENT_ID`: Optional, for Trakt.tv integration

## TV-Specific Considerations

### Focus Management
- **TVFocusGuideView**: Use for complex layouts (not yet implemented in all screens)
- **hasTVPreferredFocus**: Set initial focus on screen load
- **Default Focus States**: Pressable components automatically handle focus

### Assets
- **Android TV Banner**: Required for launcher (`assets/images/tv_banner.png` → `android/app/src/main/res/drawable/`)
- **Apple TV Icons**: Layered icons for parallax effect (configured in `app.json` via `@react-native-tvos/config-tv` plugin)
- **Top Shelf Images**: Apple TV home screen images (1920x720, 2320x720 wide, @2x variants)

Current assets are placeholder Ignite branding. Phase 9 of migration will replace with MovieZang branding.

### Navigation Utilities
Helper for TV layout checks (app/navigators/navigationUtilities.ts):
```tsx
import { Platform } from "react-native"

// Check if running on TV
const isTV = Platform.isTV

// Apply TV-specific styles
const buttonSize = isTV ? 60 : 44
```

## Common Tasks

### Adding a New Screen
1. Create screen file in `app/screens/NewScreen.tsx`
2. Add route to `AppStackParamList` in `app/navigators/types.ts`
3. Add `<Stack.Screen>` to `AppNavigator.tsx`
4. Update deep linking config if needed (same file)
5. Ensure focus states work on TV

### Adding Convex Backend Function
1. Create/edit file in `convex/` (e.g., `convex/myFeature.ts`)
2. Import `{ query, mutation }` from `convex/_generated/server`
3. Define with `v` validators from `convex/values`
4. Run `npx convex dev` to regenerate types
5. Import from `convex/_generated/api` in React components

### Testing on TV
```bash
# Apple TV
yarn prebuild:tv
yarn ios
# Select "Apple TV" target in simulator

# Android TV
yarn prebuild:tv
yarn android --device tv_api_31
# Requires Android TV emulator created in Android Studio
```

### Updating Dependencies
- **React Native TV**: Only use `react-native-tvos` fork, not standard RN
- **Expo SDK**: Ensure TV compatibility (check Expo docs)
- **Breaking Changes**: Test on iOS, Android, AND TV after major updates

## Known Issues & Warnings

### TypeScript Errors
- **47 Errors in Unused Files**: Old Ignite boilerplate (Reactotron, i18n, old API) - safe to ignore
- **Asset Imports**: Ensure `types/assets.d.ts` exists for `.png` imports

### Migration Status (see tv_migration_task.md)
- **Phases 1-8**: ✅ Complete (setup, Convex, screens, navigation)
- **Phase 9**: ❌ Assets not yet replaced (still Ignite branding)
- **Phase 10**: ❌ TV-specific testing pending
- **Phase 11**: ❌ Production builds pending

### TV Testing
- Focus states partially implemented (needs TVFocusGuideView in forms)
- Deep linking untested on physical devices
- Top shelf images are Ignite placeholders

## Environment Setup

### Required Files
- `.env.local`: Convex deployment URL, may contain Supabase keys
  ```
  CONVEX_DEPLOYMENT=kindhearted-dalmatian-79
  EXPO_PUBLIC_CONVEX_URL=https://kindhearted-dalmatian-79.convex.cloud
  ```
- `.env`: May contain additional secrets (not tracked in git)

### First-Time Setup
```bash
yarn                  # Install dependencies
npx convex dev        # Connect to backend, generate types
yarn prebuild:tv      # Generate TV native projects
yarn ios              # Run on Apple TV simulator
```

## Code Style

### Import Paths
- Use `app/` prefix (configured in tsconfig.json)
- Example: `import { Button } from "app/components/ui/Button"`

### Component Structure
- Functional components with TypeScript
- StyleSheet at bottom of file
- Props interfaces above component
- Export component as default

### Naming Conventions
- Components: PascalCase (`MovieCard.tsx`)
- Hooks: camelCase with `use` prefix (`useRoom.ts`)
- Utils: camelCase (`streamingDeepLinks.ts`)
- Convex functions: camelCase (`getRoomByCode`)

### Theme Usage
Always use theme tokens over hardcoded values:
```tsx
import { colors, spacing, typography } from "app/theme"

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,        // Not: padding: 16
    backgroundColor: colors.background,
  },
  text: {
    ...typography.body,         // Includes fontSize, lineHeight, fontFamily
    color: colors.text,
  },
})
```

## Testing Strategy

### Unit Tests
- Jest with `@testing-library/react-native`
- Test hooks in isolation
- Mock Convex queries/mutations

### E2E Tests
- Maestro for flow testing
- `.maestro/` directory contains test flows
- Run with `yarn test:maestro`

### Manual Testing Checklist (TV)
1. Focus navigation with D-pad/remote
2. MovieCard voting (left/right swipe or buttons)
3. Room code entry (4 digits)
4. Chat typing and sending
5. Real-time updates (vote reactions, participant list)
6. Results calculation accuracy
7. Deep linking from outside app

## Deployment

### EAS Build Profiles (eas.json)
- `development`: Local debug builds, simulator only
- `development:tv`: Same but with `EXPO_TV=1` env var
- `development:device`: Physical device debug builds
- `preview`: Internal distribution (TestFlight, APK)
- `preview:tv`: TV preview builds
- `production`: App Store release

### Build Commands
```bash
# iOS
eas build --profile production --platform ios

# Apple TV
eas build --profile development:tv --platform ios

# Android
eas build --profile production --platform android
```

## Resources

- **Expo TV Docs**: https://docs.expo.dev/guides/react-native-tvos/
- **React Navigation TV**: https://reactnavigation.org/docs/tv-support
- **Convex Docs**: https://docs.convex.dev/
- **TMDB API**: https://developers.themoviedb.org/3
- **Migration Tracker**: See `tv_migration_task.md` for detailed progress

## Package Identity

- **Package Name**: `com.moviezang.tv`
- **App Name**: MovieZang
- **Scheme**: `moviezang://`
- **Bundle ID (iOS)**: `com.moviezang.tv`
- **Bundle ID (tvOS)**: `com.moviezang.tv`
- **Android Package**: `com.moviezang.tv`
