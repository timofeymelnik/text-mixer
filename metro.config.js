const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const rootNodeModules = path.resolve(projectRoot, 'node_modules');

config.watchFolders = [
  ...config.watchFolders,
  path.resolve(rootNodeModules, '.pnpm'),
];

config.resolver.nodeModulesPaths = [rootNodeModules];
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_, name) => path.join(rootNodeModules, String(name)),
  }
);

module.exports = config;
