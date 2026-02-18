// Expo Firebase Configuration
// Proper Firebase initialization for Expo push notifications
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import * as Notifications from 'expo-notifications';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz3k3QZ8w3W5uK4l7Yq6v8",
  authDomain: "unfold-cards-8f621.firebaseapp.com",
  projectId: "572808569364", 
  storageBucket: "unfold-cards-8f621.appspot.com",
  messagingSenderId: "572808569364",
  appId: "1:572808569364:web:572808569364",
  measurementId: "G-XXXXXXXX"
};

let firebaseApp;
let messaging;

try {
  firebaseApp = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully for Expo');
  
  // Initialize Firebase Messaging for web/development
  if (typeof window !== 'undefined') {
    messaging = getMessaging(firebaseApp);
    console.log('Firebase Messaging initialized for web');
  }
} catch (error) {
  console.log('Firebase initialization error:', error);
  firebaseApp = null;
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
