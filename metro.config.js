const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Chrome extension has its own node_modules and build; keep Metro out of it.
const extensionDir = path.resolve(__dirname, 'extension').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [].concat(config.resolver.blockList ?? [], new RegExp(`^${extensionDir}[\\\\/].*`));

module.exports = config;
