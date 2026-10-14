const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const config = getDefaultConfig(__dirname);
// The installed Android debug client's multipart/chunked decoder fails before JS starts.
// Negotiate a regular bundle response; keep errors and all non-bundle requests intact.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  if (req.url?.split('?')[0].endsWith('.bundle')) {
    req.headers.accept = 'application/javascript';
  }
  return middleware(req, res, next);
};
// Native build outputs (including preserved CMake caches) are not JS sources.
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  /(^|[\\/])android[\\/](?:app[\\/])?(?:build|\.cxx[^\\/]*|\.gradle)(?:[\\/]|$)/,
];
module.exports = withNativeWind(config, {
  input: './global.css',
});
