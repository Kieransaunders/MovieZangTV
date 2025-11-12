// Typography configuration for MovieZang TV
// Using system fonts for optimal TV performance and native feel

import { Platform } from "react-native"

// No custom fonts to load - using system fonts for better TV performance
export const customFontsToLoad = {}

const fonts = {
  helveticaNeue: {
    // iOS/tvOS system font
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
    bold: "HelveticaNeue-Bold",
  },
  sfPro: {
    // iOS/tvOS San Francisco font
    light: "System",
    normal: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
  },
  courier: {
    // iOS/tvOS monospace font
    normal: "Courier",
  },
  sansSerif: {
    // Android/Android TV system font
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
    bold: "sans-serif-bold",
  },
  monospace: {
    // Android/Android TV monospace font
    normal: "monospace",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   * Uses native system fonts for optimal TV performance.
   */
  primary: Platform.select({ ios: fonts.sfPro, android: fonts.sansSerif }),
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: Platform.select({ ios: fonts.helveticaNeue, android: fonts.sansSerif }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
}
