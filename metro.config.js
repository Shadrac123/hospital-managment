// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// --- Firebase JS SDK + Expo SDK 54 compatibility ---
// Expo SDK 53+ enables `unstable_enablePackageExports` in Metro by default.
// Firebase ships CommonJS (.cjs) builds for React Native, and the new package
// exports resolution picks the wrong entry point, producing the runtime error
// "Component auth has not been registered yet".
// Disabling package exports + adding `cjs` to sourceExts forces Metro to use the
// resolution path Firebase expects. See:
// https://github.com/expo/expo/issues/36588
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
