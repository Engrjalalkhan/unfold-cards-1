module.exports = {
  dependencies: {
    'react-native-firebase_messaging': {
      platforms: {
        android: {
          manifestPlaceholders: {
            // Remove conflicting Firebase metadata
          },
        },
      },
    },
  },
  project: {
    android: {
      sourceDir: '../android',
      manifestPath: '../android/app/src/main/AndroidManifest.xml',
    },
  },
};
