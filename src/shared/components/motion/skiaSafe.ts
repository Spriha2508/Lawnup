/**
 * Skia availability guard.
 *
 * Skia is a NATIVE module. In Expo Go — or in any app binary built before
 * `@shopify/react-native-skia` was added — the native side is missing and
 * importing the package throws at module-eval, crashing the app at boot.
 *
 * We require() it inside try/catch so that failure is contained to a boolean.
 * Skia-powered components render their full effect only when this is true and
 * degrade to a Reanimated fallback otherwise. After a proper dev build
 * (`npx expo run:android`) this resolves true and you get the real thing.
 */
let available = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@shopify/react-native-skia');
  available = !!(mod && mod.Skia && mod.Canvas);
} catch {
  available = false;
}

export const isSkiaAvailable = available;
