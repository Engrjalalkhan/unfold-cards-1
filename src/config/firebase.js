// Expo Firebase Configuration
// Proper Firebase initialization for Expo push notifications
import { initializeApp, getApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import * as Notifications from 'expo-notifications';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCNECdSoMOcmMseymPO6f1HJ6OeSTuQCGg",
  authDomain: "unfold-cards-8f621.firebaseapp.com",
  projectId: "unfold-cards-8f621",
  storageBucket: "unfold-cards-8f621.appspot.com",
  messagingSenderId: "572808569364",
  appId: "1:572808569364:android:d42c51ca0ac93dd070fd01"
};

// Initialize Firebase app
let firebaseApp;
let messaging;

try {
  firebaseApp = initializeApp(firebaseConfig);
  messaging = getMessaging(firebaseApp);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.log('Firebase already initialized or error:', error);
  // Use existing app if already initialized
  try {
    firebaseApp = getApp();
    messaging = getMessaging(firebaseApp);
  } catch (e) {
    console.log('Using fallback - Firebase not available');
  }
}

// Configure Expo notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Export configuration and services
export { firebaseApp, messaging, Notifications };
export default firebaseConfig;
