# App Icon for Notifications

To add your app logo to notifications, follow these steps:

## 1. Add App Icon Asset

Create an `assets` folder in your project root if it doesn't exist:

```
e:\React Native Projects\unfold-cards\assets\
├── images\
│   ├── app-icon.png
│   └── notification-icon.png
```

## 2. Icon Specifications

- **Size**: 64x64 pixels for notification icons
- **Format**: PNG with transparency
- **Design**: Simple, recognizable logo
- **Background**: Transparent or solid color that contrasts well

## 3. Update Notification Service

Once you have the icon, uncomment these lines in `src/services/notificationService.js`:

```javascript
// In scheduleDailyQuestionReminder function
icon: require('../../assets/images/app-icon.png'),

// In Firebase message handler
icon: require('../../assets/images/app-icon.png'),

// In other notification functions
icon: require('../../assets/images/app-icon.png'),
```

## 4. Alternative: Use Default App Icon

For React Native, you can also use the default app icon:

```javascript
// Add this import at the top
import { Platform } from 'react-native';

// In notification content
icon: Platform.OS === 'android' 
  ? 'ic_launcher' 
  : require('../../assets/images/app-icon.png'),
```

## 5. Android Configuration

For Android, you may need to add this to `android/app/src/main/AndroidManifest.xml`:

```xml
<application
  android:icon="@mipmap/ic_launcher"
  android:roundIcon="@mipmap/ic_launcher_round"
  ...>
```

## 6. Test the Notifications

After adding the icon:
1. Enable daily notifications in the app
2. Test with a scheduled notification
3. Check that the icon appears in the notification shade

## Current Status

✅ Sound enabled for all notifications
✅ Badge count enabled
✅ App logo placeholder added (uncomment when icon is ready)
✅ Firebase push notifications configured
✅ Local notifications as fallback

Your notifications will now play sound and show app branding when you enable daily notifications!
