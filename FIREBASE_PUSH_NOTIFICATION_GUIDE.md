# Firebase Push Notifications Setup Guide

## 🚀 **Step 1: Test Your Current Setup**

### **A. Test Local Notifications First**
1. Open your app
2. Go to **Profile Screen**
3. Tap **"Enable Notifications"**
4. Toggle **"Daily Question Reminder"** ON
5. Tap **"Send Now"** test button
6. Check if you receive a notification immediately

### **B. Check Firebase Initialization**
1. Open your app's console/logs
2. Look for these messages:
   - `"Firebase Messaging initialized successfully"`
   - `"FCM Token: ..."`
   - `"Authorization status: ..."`

## 🔧 **Step 2: Firebase Console Setup**

### **A. Create Cloud Functions (Optional - For Scheduled Notifications)**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **"unfold-cards-8f621"**
3. Go to **Build → Cloud Functions**
4. Click **"Get started"**
5. Deploy the provided Cloud Functions from your project

### **B. Test Push Notifications from Console**
1. In Firebase Console → **Engagement → Cloud Messaging**
2. Click **"Create your first campaign"**
3. Choose **"Notification message"**
4. Fill in:
   - **Notification title**: "Test from Firebase"
   - **Notification text**: "This is a test push notification"
   - **Target**: "User segment" → "App" → "Android app"
5. Click **"Next"** → **"Next"** → **"Publish"**

## 📱 **Step 3: Android Configuration**

### **A. Verify google-services.json is Properly Placed**
Make sure your file is at:
```
e:\React Native Projects\unfold-cards\android\app\google-services.json
```

### **B. Check Android Manifest**
Open `android/app/src/main/AndroidManifest.xml` and ensure it has:
```xml
<application
    ...>
    <service
        android:name=".java.com.rafeeque2.unfoldcards.MessagingService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
</application>
```

## 🍎 **Step 4: iOS Configuration (When Ready)**

### **A. Add GoogleService-Info.plist**
1. Download from Firebase Console → Project Settings → Your Apps → iOS
2. Place in `ios/unfold-cards/GoogleService-Info.plist`

### **B. Enable Push Notifications in Xcode**
1. Open `ios/unfold-cards.xcworkspace`
2. Go to **Signing & Capabilities**
3. Click **"+ Capability"**
4. Add **"Push Notifications"**
5. Add **"Background Modes"** → Check **"Remote notifications"**

## 🧪 **Step 5: Test Push Notifications**

### **A. Test Topic Subscriptions**
1. In your app, enable notifications in Profile screen
2. Check console logs for:
   - `"Subscribed to daily_reminders"`
   - `"Subscribed to weekly_highlights"`
   - `"Subscribed to new_category_alerts"`

### **B. Send Test Push to Topic**
1. In Firebase Console → Cloud Messaging
2. Create new notification
3. Target: **"User segment"** → **"Topic"**
4. Enter topic name: `daily_reminders`
5. Send notification

### **C. Test with Cloud Functions (If Deployed)**
Use the provided Cloud Functions to send:
```javascript
// Test daily notification
POST https://your-region-unfold-cards-8f621.cloudfunctions.net/sendDailyNotification

// Test custom notification
POST https://your-region-unfold-cards-8f621.cloudfunctions.net/sendCustomNotification
{
  "topic": "daily_reminders",
  "title": "Test Daily Question",
  "body": "This is a test from Cloud Functions!"
}
```

## 🔍 **Step 6: Troubleshooting**

### **Common Issues & Solutions:**

#### **Issue 1: No FCM Token**
- **Check**: Firebase initialization logs
- **Solution**: Ensure google-services.json is correctly placed
- **Rebuild**: `npx react-native run-android`

#### **Issue 2: Permission Denied**
- **Check**: Notification permissions on device
- **Solution**: Go to Settings → Apps → Unfold Cards → Permissions → Notifications

#### **Issue 3: Background Notifications Not Working**
- **Check**: App is killed or in background
- **Solution**: Ensure proper background handling in notificationService.js

#### **Issue 4: Topic Subscription Failed**
- **Check**: Network connection
- **Solution**: Ensure Firebase is initialized before subscribing

## 📊 **Step 7: Monitor Performance**

### **A. Check Firebase Console**
1. Go to **Engagement → Cloud Messaging**
2. Monitor **Delivery reports**
3. Check **Open rates** and **engagement**

### **B. Check App Logs**
Monitor these key metrics:
- FCM token generation
- Topic subscription success/failure
- Message reception in foreground/background
- Notification display success

## ✅ **Success Checklist**

When you have:
- [ ] Local notifications working (test button)
- [ ] Firebase initialized successfully
- [ ] FCM token generated
- [ ] Topic subscriptions working
- [ ] Push notifications received from Firebase Console
- [ ] Background notifications working
- [ ] Sound and badge working

## 🎯 **Quick Test Commands**

### **Test Immediate Function:**
```javascript
// In your app console
sendImmediateDailyNotification();
```

### **Check Firebase Status:**
```javascript
// Check if Firebase is working
import messaging from '@react-native-firebase/messaging';
console.log('Firebase available:', !!messaging().isDeviceRegisteredForRemoteMessages);
```

## 📞 **Need Help?**

If you encounter issues:
1. Check console logs for error messages
2. Verify google-services.json placement
3. Ensure Android permissions are granted
4. Test with app in foreground and background

Your Firebase push notification system is ready to go! 🚀
