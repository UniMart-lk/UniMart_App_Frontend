// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-maps') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/react-native-maps.web.js'),
        type: 'sourceFile',
      };
    }
    if (
      moduleName === 'react-native/Libraries/Utilities/codegenNativeComponent' ||
      moduleName.endsWith('/codegenNativeComponent')
    ) {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/codegenNativeComponent.web.js'),
        type: 'sourceFile',
      };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
