import React from 'react';
import { Modal, View, StyleSheet, Platform, Text } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Ionicons } from '@expo/vector-icons';

/** RevenueCat dashboard offering identifier (marked as Current). */
export const DEFAULT_OFFERING_ID = 'default_offering';

/** Entitlement identifier configured in RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT_ID = 'premium';

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

const REVENUECAT_API_KEY = getAppConfig();

const getActiveOffering = (offerings) => {
  if (!offerings) return null;
  return offerings.current ?? offerings.all?.[DEFAULT_OFFERING_ID] ?? null;
};

export const hasPremiumEntitlement = (customerInfo) =>
  customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID] !== undefined;

/** Forward native RevenueCat logs to Metro (dev only). */
const enableRevenueCatLogging = () => {
  if (!__DEV__) return;
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.setLogHandler((level, message) => {
      console.warn(`[RevenueCat/${level}] ${message}`);
    });
  } catch (error) {
    console.warn('[RevenueCat] Could not enable logging:', error);
  }
};

export const prefetchOfferingsInBackground = () => {
  Purchases.getOfferings()
    .then((offerings) => {
      const offering = getActiveOffering(offerings);
      console.warn('[RevenueCat] offerings:', {
        current: offerings?.current?.identifier ?? 'none',
        active: offering?.identifier ?? 'none',
        packages:
          offering?.availablePackages?.map((p) => ({
            package: p.identifier,
            product: p.product?.identifier,
            price: p.product?.priceString,
          })) ?? [],
      });
    })
    .catch((err) => {
      console.warn('[RevenueCat] offerings:', err?.message ?? err);
    });
};

export const presentDashboardPaywall = async () => {
  console.warn('[RevenueCat] presentPaywall (native)');
  try {
    const paywallResult = await RevenueCatUI.presentPaywall({
      displayCloseButton: true,
      requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT_ID,
    });
    console.warn('[RevenueCat] presentPaywall result:', paywallResult);
    return { result: paywallResult };
  } catch (error) {
    console.error('[RevenueCat] presentPaywall failed:', error);
    return { result: PAYWALL_RESULT.ERROR, reason: 'use_embedded_paywall', error };
  }
};

const getSecurePaymentLabel = () =>
  Platform.OS === 'ios'
    ? 'Secure payment via Apple App Store'
    : 'Secure payment via Google Play';

/** Full-screen RevenueCat dashboard paywall (no blocking overlays). */
export function RevenueCatPaywallModal({
  visible,
  offering,
  onClose,
  onPurchaseSuccess,
  onPurchaseError,
  onRestoreNoPurchases,
}) {
  if (!visible) {
    return null;
  }

  const handlePremiumUnlocked = (customerInfo) => {
    const hasPremium = hasPremiumEntitlement(customerInfo);
    if (hasPremium) {
      onPurchaseSuccess?.(true, customerInfo);
      onClose();
    }
    return hasPremium;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.paywallContainer}>
        <RevenueCatUI.Paywall
          style={styles.paywall}
          options={{
            ...(offering ? { offering } : {}),
            displayCloseButton: true,
            requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT_ID,
          }}
          onDismiss={() => {
            console.warn('[RevenueCat] Paywall dismissed');
            onClose();
          }}
          onPurchaseStarted={({ packageBeingPurchased }) => {
            console.warn(
              '[RevenueCat] Purchase started:',
              packageBeingPurchased?.identifier
            );
          }}
          onPurchaseCompleted={({ customerInfo }) => {
            console.warn('[RevenueCat] Purchase completed');
            handlePremiumUnlocked(customerInfo);
          }}
          onPurchaseError={({ error }) => {
            console.warn('[RevenueCat] Purchase error:', error?.message ?? error);
            onPurchaseError?.(error);
          }}
          onRestoreCompleted={({ customerInfo }) => {
            console.warn('[RevenueCat] Restore completed');
            const restored = handlePremiumUnlocked(customerInfo);
            if (!restored) {
              onRestoreNoPurchases?.();
            }
          }}
          onRestoreError={({ error }) => {
            console.warn('[RevenueCat] Restore error:', error?.message ?? error);
            onPurchaseError?.(error);
          }}
        />
        <View style={styles.securePaymentBar}>
          <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
          <Text style={styles.securePaymentText}>{getSecurePaymentLabel()}</Text>
        </View>
      </View>
    </Modal>
  );
}

let customerInfoListenerAttached = false;

const attachCustomerInfoListener = () => {
  if (customerInfoListenerAttached) return;
  customerInfoListenerAttached = true;
  Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    console.warn(
      '[RevenueCat] Customer info updated, premium:',
      hasPremiumEntitlement(customerInfo)
    );
  });
};

export const initializeRevenueCat = async () => {
  try {
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('xxxxxxxxxx')) {
      console.warn('RevenueCat API key not configured');
      return false;
    }

    enableRevenueCatLogging();
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      diagnosticsEnabled: __DEV__,
    });
    attachCustomerInfoListener();
    console.warn('[RevenueCat] SDK configured');
    prefetchOfferingsInBackground();
    return true;
  } catch (error) {
    console.error('RevenueCat initialization failed:', error);
    return false;
  }
};

export const isPremiumUser = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return hasPremiumEntitlement(customerInfo);
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
};

export const restorePurchases = async () => {
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
};

export const restorePurchasesWithResult = async () => {
  const customerInfo = await restorePurchases();
  return {
    customerInfo,
    hasPremium: hasPremiumEntitlement(customerInfo),
  };
};

const styles = StyleSheet.create({
  paywallContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  paywall: {
    flex: 1,
  },
  securePaymentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  securePaymentText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export { PAYWALL_RESULT };
