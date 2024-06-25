const { getDefaultConfig } = require("expo/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.extraNodeModules = {
  ...defaultConfig.resolver.extraNodeModules,
  crypto: require.resolve("./cryptoPolyfill"),
  stream: require.resolve("stream-browserify"),
  buffer: require.resolve("buffer"),
};

module.exports = defaultConfig;
