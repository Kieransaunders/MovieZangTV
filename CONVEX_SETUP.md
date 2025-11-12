# MovieZang TV App - Convex Backend Configuration

## App Overview

**This is the MovieZang TV App** - A separate TV-optimized version of MovieZang
- **Web App**: https://moviezang.com (separate codebase)
- **TV App**: This project (com.moviezang.tv)
- **Backend**: Shared Convex deployment

## Convex Deployment

### Production URL
```
https://kindhearted-dalmatian-79.convex.cloud
```

### Configuration Files
1. **`.env.local`** - Used by Convex CLI (`npx convex dev`)
   - `CONVEX_DEPLOYMENT=kindhearted-dalmatian-79`
   - `EXPO_PUBLIC_CONVEX_URL=https://kindhearted-dalmatian-79.convex.cloud`

2. **`app.json`** - Expo configuration
   - `extra.convexUrl`: "https://kindhearted-dalmatian-79.convex.cloud"

3. **`app/app.tsx`** - Runtime configuration
   - Uses `process.env.EXPO_PUBLIC_CONVEX_URL` from .env.local
   - Fallback: "https://kindhearted-dalmatian-79.convex.cloud"

## Shared Backend

The TV app shares the **same Convex backend** as the web app:
- ✅ **Users** are synchronized across web and TV
- ✅ **Rooms** are accessible from both platforms
- ✅ **Votes** and **chat** sync in real-time
- ✅ **Collections** and **saved titles** are shared

## Environment Variables (Convex Dashboard)

These are set in the Convex dashboard at https://dashboard.convex.dev/

### Required Variables

#### `SITE_URL`
- **Purpose**: Used for authentication callbacks
- **For Web App**: `https://moviezang.com`
- **For TV App**: `moviezang://` (custom URL scheme)
- **Current Setting**: Check dashboard - may need to support multiple URLs

#### `TMDB_API_TOKEN`
- **Purpose**: The Movie Database API access
- **Required**: Yes
- **Status**: Should already be set from web app

#### `TRAKT_CLIENT_ID`
- **Purpose**: Trakt.tv API for additional movie data
- **Required**: No (optional)
- **Status**: Check if needed for TV app features

## Deep Linking

### TV App URL Schemes
- **Custom Scheme**: `moviezang://`
- **Universal Links**: Not using web domain (that's for the web app)

### Example Deep Links
```
moviezang://                    → Home screen
moviezang://create              → Create room
moviezang://room/AB12           → Join room AB12
moviezang://results/XY99        → View results for room XY99
```

## Platform Identifiers

### iOS/tvOS
- **Bundle Identifier**: `com.moviezang.tv`
- **Supports Apple TV**: Yes
- **Supports iPad**: Yes

### Android/Android TV
- **Package Name**: `com.moviezang.tv`
- **Supports Android TV**: Yes
- **Banner**: Required for Android TV launcher

## Development Workflow

### Start Convex Dev Server
```bash
npx convex dev
```
This will:
- Connect to the kindhearted-dalmatian-79 deployment
- Watch for changes in `convex/` directory
- Generate TypeScript types in `convex/_generated/`

### Start Expo Dev Server
```bash
npm start
# or
expo start
```

### Build for TV
```bash
# iOS/tvOS
npm run prebuild:tv
eas build --profile production_tv --platform ios

# Android TV
npm run prebuild:tv
eas build --platform android
```

## Important Notes

1. **Don't modify the Convex schema** without coordinating with the web app team
2. **SITE_URL** may need to be updated in Convex dashboard to support TV app auth
3. **Backend changes** will affect both web and TV apps
4. **Real-time features** work across all platforms using the shared backend

## Troubleshooting

### Convex Connection Issues
- Verify `EXPO_PUBLIC_CONVEX_URL` is set correctly
- Check Convex deployment status at dashboard
- Ensure no firewall blocking `*.convex.cloud` domains

### Type Generation Issues
- Run `npx convex dev` to regenerate types
- Check `convex/_generated/` directory exists
- Verify `convex.json` configuration is correct

### Deep Linking Issues
- Verify `scheme: "moviezang"` is in app.json
- Test with `npx uri-scheme open moviezang:// --ios`
- Check Expo CLI output for registered URL schemes
