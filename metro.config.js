const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

console.log('[Metro] Initializing config from:', __dirname);

config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'web', 'native'],
  // Explicitly include react-native so Metro picks the RN condition in package exports.
  // Without this, @firebase/auth falls to its browser ESM bundle (no react-native condition
  // in the firebase/* wrapper package, but present in @firebase/auth directly).
  unstable_conditionNames: [
    'react-native',
    'require',
    'default',
  ],
};

console.log('[NativeWind] Applying NativeWind metro transform...');
const nativewindConfig = withNativeWind(config, { input: './global.css' });
console.log('[NativeWind] ✓ Transform applied');

module.exports = nativewindConfig;
