import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { Paywall } from 'react-native-purchases-ui';

// Get API key from app.json
const getAppConfig = () => {
  try {
    const appJson = require('../../app.json');
    const revenueCatConfig = appJson.expo.extra.revenueCat;
    return Platform.select({
      ios: revenueCatConfig.iosApiKey,
      android: revenueCatConfig.androidApiKey,
    });
  } catch (error) {
    console.warn('Could not load RevenueCat API keys from app.json');
    return null;
  }
};

// RevenueCat configuration
const REVENUECAT_API_KEY = getAppConfig();

// Initialize RevenueCat
export const initializeRevenueCat = async () => {
  try {
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('xxxxxxxxxx')) {
      console.warn('RevenueCat API key not configured - Running in demo mode');
      return false; // Return false to trigger demo mode
    }

    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    console.log('RevenueCat initialized successfully');
    return true;
  } catch (error) {
    console.error('RevenueCat initialization failed:', error);
    return false;
  }
};

// Check if user has premium access
export const isPremiumUser = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active.premium !== undefined;
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
};

// Present RevenueCat Paywall with UI
export const presentPaywall = async () => {
  try {
    console.log('🎯 Presenting RevenueCat Paywall...');
    
    // First try to get offerings to ensure products are available
    const offerings = await Purchases.getOfferings();
    console.log('📦 Available offerings for paywall:', offerings);
    
    if (!offerings.current) {
      console.log('❌ No current offering available, using demo mode');
      return await presentDemoPaywall();
    }
    
    // Check if Paywall UI is available
    console.log('🔍 Checking Paywall UI availability...');
    console.log('📱 Paywall object:', Paywall);
    console.log('🔧 Paywall.present function:', Paywall?.present);
    
    if (Paywall && typeof Paywall.present === 'function') {
      console.log('✅ Paywall UI is available, presenting dashboard paywall...');
      const result = await Paywall.present({
        offeringIdentifier: offerings.current.identifier,
      });
      console.log('✅ Paywall result:', result);
      return result;
    } else {
      console.log('❌ Paywall UI not available - package not properly installed or linked');
      console.log('💡 Install: npm install react-native-purchases-ui');
      console.log('🔄 Trying alternative approach...');
      return await presentCustomPaywall();
    }
  } catch (error) {
    console.error('❌ Failed to present paywall:', error);
    console.error('🔍 Error details:', error.message);
    // Fallback to demo mode
    return await presentDemoPaywall();
  }
};

// Custom paywall using offerings (without UI package)
export const presentCustomPaywall = async () => {
  try {
    console.log('Getting offerings from RevenueCat...');
    const offerings = await Purchases.getOfferings();
    
    console.log('All offerings:', offerings);
    console.log('Current offering:', offerings.current);
    console.log('Available packages:', offerings.current?.availablePackages);
    
    if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
      // Get the first available package
      const firstPackage = offerings.current.availablePackages[0];
      console.log('Found package:', firstPackage);
      console.log('Package identifier:', firstPackage.identifier);
      console.log('Package price:', firstPackage.product.priceString);
      
      // For now, just return success without purchasing (for testing)
      console.log('🎭 TEST MODE: Would purchase package:', firstPackage.identifier);
      return { result: 'purchased', customerInfo: null, testMode: true };
      
      // Uncomment below for real purchase:
      // const { customerInfo } = await Purchases.purchasePackage(firstPackage);
      // return { result: 'purchased', customerInfo };
    } else {
      console.log('No offerings or packages available');
      return { result: 'no_offering' };
    }
  } catch (error) {
    console.error('Custom paywall failed:', error);
    throw error;
  }
};

// Present paywall with specific offering
export const presentPaywallWithOffering = async (offeringIdentifier) => {
  try {
    // Check if Paywall is available
    if (!Paywall) {
      console.error('Paywall UI not available. Make sure react-native-purchases-ui is properly installed.');
      return await presentCustomPaywall();
    }
    
    console.log(`Presenting paywall with offering: ${offeringIdentifier}`);
    const result = await Paywall.present({
      offeringIdentifier,
    });
    return result;
  } catch (error) {
    console.error('Failed to present paywall with offering:', error);
    // Fallback to custom paywall
    return await presentCustomPaywall();
  }
};

// Present dashboard paywall (uses published paywall from dashboard)
export const presentDashboardPaywall = async () => {
  try {
    console.log('🎨 Presenting RevenueCat Dashboard Paywall...');
    
    // Get offerings to find the current one
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      console.log('❌ No current offering found for dashboard paywall');
      console.log('💡 Make sure you have configured offerings in RevenueCat dashboard');
      return await presentDemoPaywall();
    }
    
    console.log(`✅ Using current offering: ${offerings.current.identifier}`);
    console.log(`📦 Available packages: ${offerings.current.availablePackages.length}`);
    
    // Check if Paywall UI is available
    if (!Paywall) {
      console.log('❌ Paywall UI not available - react-native-purchases-ui not properly installed');
      console.log('💡 Install: npm install react-native-purchases-ui');
      console.log('💡 Then run: npx pod-install (iOS) or cd android && ./gradlew clean (Android)');
      return await presentCustomPaywall();
    }
    
    console.log('✅ Paywall UI is available, presenting dashboard paywall...');
    
    // Present the dashboard paywall with current offering
    const result = await Paywall.present({
      offeringIdentifier: offerings.current.identifier,
    });
    
    console.log('✅ Dashboard paywall presented successfully');
    console.log('📊 Paywall result:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to present dashboard paywall:', error);
    console.error('🔍 Error details:', error.message);
    
    // Check if it's a specific error type
    if (error.message.includes('not configured') || error.message.includes('no paywall')) {
      console.log('💡 No paywall configured in RevenueCat dashboard');
      console.log('💡 Go to RevenueCat dashboard → Paywalls → Create paywall');
    }
    
    // Fallback to custom paywall
    console.log('🔄 Falling back to custom paywall...');
    return await presentCustomPaywall();
  }
};

// Demo paywall for testing without RevenueCat setup
export const presentDemoPaywall = async () => {
  return new Promise((resolve) => {
    console.log('🎭 DEMO MODE: Showing demo paywall');
    console.log('In a real implementation, this would show your RevenueCat dashboard paywall');
    
    // Simulate user interaction after 2 seconds
    setTimeout(() => {
      console.log('🎭 DEMO: User completed purchase');
      resolve({ result: 'purchased', demo: true });
    }, 2000);
  });
};

// Fallback: Present paywall using offerings (without UI)
export const presentPaywallFallback = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      // Use the first available package from the current offering
      const firstPackage = offerings.current.availablePackages[0];
      if (firstPackage) {
        const { customerInfo } = await Purchases.purchasePackage(firstPackage);
        return { result: 'purchased', customerInfo };
      }
    }
    return { result: 'cancelled' };
  } catch (error) {
    console.error('Fallback paywall failed:', error);
    throw error;
  }
};

// Get current offerings
export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return null;
  }
};

// Purchase package
export const purchasePackage = async (packageToPurchase) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    return customerInfo;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
};

// Restore purchases
export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restoreTransactions();
    return customerInfo;
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
};
