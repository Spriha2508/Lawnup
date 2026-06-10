const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude the logs/ directory — Metro watches the whole project root by default,
// so any write to logs/*.log triggers a full reload loop during dev.
const { FileStore } = require('metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, '.metro-cache') }),
];

config.watchFolders = config.watchFolders ?? [];

config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'web', 'native'],
  // Explicitly include react-native so Metro picks the RN condition in package exports.
  // Without this, @firebase/auth falls to its browser ESM bundle.
  unstable_conditionNames: [
    'react-native',
    'require',
    'default',
  ],
  blockList: [
    // Never watch the dev log directory — writes here cause Metro reload loops
    new RegExp(`${path.join(__dirname, 'logs').replace(/\\/g, '\\\\')}(/.*)?$`),
    // Also exclude scripts output, functions build artefacts, git internals
    new RegExp(`${path.join(__dirname, 'scripts').replace(/\\/g, '\\\\')}(/.*)?$`),
    new RegExp(`${path.join(__dirname, 'functions', 'lib').replace(/\\/g, '\\\\')}(/.*)?$`),
  ],
};

const nativewindConfig = withNativeWind(config, { input: './global.css' });

module.exports = nativewindConfig;
