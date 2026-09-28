const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const config = getDefaultConfig(__dirname);
// Native build outputs (including preserved CMake caches) are not JS sources.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  /(^|[\\/])android[\\/](?:app[\\/])?(?:build|\.cxx[^\\/]*|\.gradle)(?:[\\/]|$)/,
];
module.exports = withNativeWind(config, {
  input: './global.css',
});
