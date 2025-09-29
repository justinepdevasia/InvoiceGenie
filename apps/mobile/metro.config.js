const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Set the project root to the mobile app directory
config.projectRoot = __dirname;

module.exports = config;