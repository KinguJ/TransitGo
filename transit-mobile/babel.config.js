module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',       //  ✅  now in the **presets** array
    ],
    plugins: [
      'react-native-reanimated/plugin' // keep only what you really use
    ],
  };
}; 