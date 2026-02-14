# Firebase Push Notifications Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for your Unfold Cards app to send daily, weekly, and new category notifications.

## 1. Firebase Project Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and create a new project
3. Follow the setup wizard

### Add Android App
1. In Firebase Console, go to Project Settings
2. Click "Add app" → Android
3. Use your app's package name (e.g., `com.unflodcards`)
4. Download `google-services.json`
5. Place it in your project's `android/app/` directory

### Add iOS App
1. In Firebase Console, go to Project Settings
2. Click "Add app" → iOS
3. Use your app's bundle ID
4. Download `GoogleService-Info.plist`
5. Add it to your Xcode project

## 2. Install Dependencies

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

## 3. Android Configuration

### Add to `android/build.gradle`
```gradle
buildscript {
    dependencies {
        // Add this line
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

### Add to `android/app/build.gradle`
```gradle
// Add to the top of the file
apply plugin: 'com.google.gms.google-services'

// Add to dependencies
dependencies {
    implementation 'com.google.firebase:firebase-messaging'
}
```

## 4. iOS Configuration

### Add to `ios/Podfile`
```ruby
# Add this line at the top
require_relative '../node_modules/@react-native-firebase/app/ios/scripts/firebase.rb'
```

### Install pods
```bash
cd ios && pod install
```

### Configure capabilities in Xcode
1. Open `ios/YourProject.xcworkspace`
2. Go to Signing & Capabilities
3. Add: "Push Notifications" and "Background Modes"
4. In Background Modes, check "Remote notifications"

## 5. Update Firebase Configuration

Replace the placeholder config in `src/config/firebase.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 6. Cloud Functions Setup

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Initialize Cloud Functions
```bash
firebase login
firebase init functions
```

### Deploy Cloud Functions
See `cloud-functions/index.js` for the functions code.

```bash
firebase deploy --only functions
```

## 7. Testing

### Test Push Notifications
1. Build and run your app on a real device (not simulator)
2. Enable notifications in the app settings
3. Use the Firebase Console to send test messages

### Test Topics
1. Subscribe to topics using the app's notification settings
2. Send targeted messages to topics from Firebase Console

## 8. Notification Types

### Daily Reminders
- Topic: `daily_reminders`
- Schedule: 9:00 AM daily
- Trigger: Cloud Function cron job

### Weekly Highlights
- Topic: `weekly_highlights`
- Schedule: Monday 10:00 AM
- Trigger: Cloud Function cron job

### New Category Alerts
- Topic: `new_category_alerts`
- Trigger: When new category is added to database

## 9. Troubleshooting

### Common Issues
1. **Notifications not working on iOS**: Make sure APNs certificates are configured
2. **Topic subscription failing**: Check network connectivity and Firebase config
3. **Background messages not received**: Ensure background modes are enabled

### Debugging
- Check console logs for FCM token
- Use Firebase Console's Cloud Messaging debugging
- Test with real devices, not simulators

## 10. Best Practices

1. Handle permission requests gracefully
2. Provide clear notification settings
3. Use meaningful notification content
4. Respect user preferences
5. Test on both Android and iOS
6. Monitor notification delivery rates
