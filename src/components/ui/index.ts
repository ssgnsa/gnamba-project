/**
 * UI Components Barrel Export
 *
 * The public/vitrine pages are the only consumers of this barrel and they use
 * the PremiumUI component set (iconRight, interactive, size="lg", etc.).
 * Route primitives to PremiumUI (single source of truth) instead of the
 * design-system variants whose prop APIs differ.
 */

export * from "./PremiumUI";
export * from "./Toast";
export * from "./SyncRemoteButton";
export * from "./SelectWithCreate";
// design-system kit remains directly importable: @/components/ui/design-system/*