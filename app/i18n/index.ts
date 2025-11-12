/**
 * Stub i18n module for legacy components that aren't used.
 * This prevents TypeScript errors without adding the full i18n-js dependency.
 */

export type TxKeyPath = string

export const translate = (key: TxKeyPath): string => key

export const isRTL = false
