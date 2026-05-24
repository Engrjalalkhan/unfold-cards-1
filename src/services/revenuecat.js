import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

/** RevenueCat dashboard offering identifier (marked as Current). */
export const DEFAULT_OFFERING_ID = 'default_offering';

const PLAY_PRODUCT_IDS = ['premium:monthly', 'premium:yearly'];
const PRODUCT_PROBE_MS = 8000;
const HELP_OVERLAY_MS = 12000;

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

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);

/** Forward all native RevenueCat logs to Metro. */
const enableRevenueCatLogging = () => {
  try {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    Purchases.setLogHandler((level, message) => {
      console.warn(`[RevenueCat/${level}] ${message}`);
    });
  } catch (error) {
    console.warn('[RevenueCat] Could not enable verbose logging:', error);
  }
};

/** Probe whether Play / RevenueCat products are reachable on this device. */
export const probeSubscriptionProducts = async () => {
  console.warn('[RevenueCat] probing products:', PLAY_PRODUCT_IDS.join(', '));
  try {
    const products = await withTimeout(
      Purchases.getProducts(PLAY_PRODUCT_IDS),
      PRODUCT_PROBE_MS,
      'getProducts'
    );
    console.warn(
      '[RevenueCat] getProducts OK:',
      products.map((p) => ({ id: p.identifier, price: p.priceString }))
    );
    return { ok: true, products };
  } catch (error) {
    console.warn('[RevenueCat] getProducts failed:', error?.message ?? error);
    return { ok: false, error };
  }
};

export const prefetchOfferingsInBackground = () => {
  withTimeout(Purchases.getOfferings(), PRODUCT_PROBE_MS, 'getOfferings')
    .then((offerings) => {
      const offering = getActiveOffering(offerings);
      console.warn('[RevenueCat] offerings OK:', {
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
      console.warn('[RevenueCat] offerings failed:', err?.message ?? err);
    });
};

export const presentDashboardPaywall = async () => {
  console.warn('[RevenueCat] presentDashboardPaywall — native modal');
  try {
    const paywallResult = await RevenueCatUI.presentPaywall({
      displayCloseButton: true,
    });
    console.warn('[RevenueCat] presentPaywall result:', paywallResult);
    return { result: paywallResult };
  } catch (error) {
    console.error('[RevenueCat] presentPaywall failed:', error);
    return { result: PAYWALL_RESULT.ERROR, reason: 'use_embedded_paywall', error };
  }
};

function PaywallHelpOverlay({ onClose }) {
  return (
    <View style={styles.helpOverlay}>
      <View style={styles.helpCard}>
        <Text style={styles.helpTitle}>Subscriptions not loading</Text>
        <Text style={styles.helpBody}>
          The paywall design opened, but Google Play prices did not load. This
          usually happens on debug builds or emulators.{'\n\n'}
          To see real packages and prices:{'\n'}
          1. Upload the app to Play Console → Internal testing{'\n'}
          2. Install from the Play Store test link (not expo run:android){'\n'}
          3. Sign in with a license tester Google account{'\n'}
          4. Confirm products premium:monthly / premium:yearly are Active in Play
          Console{'\n\n'}
          For quick dev testing, add RevenueCat Test Store products in your
          dashboard offering.
        </Text>
        <TouchableOpacity style={styles.helpButton} onPress={onClose}>
          <Text style={styles.helpButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Embedded dashboard paywall + diagnostics overlay when products cannot load. */
export function RevenueCatPaywallModal({
  visible,
  offering,
  onClose,
  onPurchaseSuccess,
}) {
  const [showHelp, setShowHelp] = React.useState(false);
  const [probing, setProbing] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setShowHelp(false);
      setProbing(false);
      return undefined;
    }

    console.warn('[RevenueCat] Paywall modal opened');
    setProbing(true);

    const helpTimer = setTimeout(() => {
      console.warn('[RevenueCat] Paywall still loading — showing help overlay');
      setShowHelp(true);
    }, HELP_OVERLAY_MS);

    probeSubscriptionProducts()
      .then((result) => {
        if (!result.ok) {
          setShowHelp(true);
        }
      })
      .finally(() => setProbing(false));

    return () => clearTimeout(helpTimer);
  }, [visible]);

  if (!visible) {
    return null;
  }

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
            const hasPremium =
              customerInfo?.entitlements?.active?.premium !== undefined;
            onPurchaseSuccess?.(hasPremium, customerInfo);
            onClose();
          }}
          onPurchaseError={({ error }) => {
            console.warn('[RevenueCat] Purchase error:', error?.message ?? error);
          }}
          onRestoreCompleted={({ customerInfo }) => {
            console.warn('[RevenueCat] Restore completed');
            const hasPremium =
              customerInfo?.entitlements?.active?.premium !== undefined;
            if (hasPremium) {
              onPurchaseSuccess?.(true, customerInfo);
              onClose();
            }
          }}
          onRestoreError={({ error }) => {
            console.warn('[RevenueCat] Restore error:', error?.message ?? error);
          }}
        />

        {probing && !showHelp ? (
          <View style={styles.probeBanner}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.probeText}>Loading subscription options…</Text>
          </View>
        ) : null}

        {showHelp ? (
          <PaywallHelpOverlay
            onClose={() => {
              setShowHelp(false);
              onClose();
            }}
          />
        ) : null}
      </View>
    </Modal>
  );
}

export const initializeRevenueCat = async () => {
  try {
    if (!REVENUECAT_API_KEY || REVENUECAT_API_KEY.includes('xxxxxxxxxx')) {
      console.warn('RevenueCat API key not configured - Running in demo mode');
      return false;
    }

    enableRevenueCatLogging();
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      diagnosticsEnabled: true,
    });
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
    return customerInfo.entitlements.active.premium !== undefined;
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

const styles = StyleSheet.create({
  paywallContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  paywall: {
    flex: 1,
  },
  probeBanner: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  probeText: {
    color: '#fff',
    fontSize: 13,
  },
  helpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  helpCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  helpTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  helpBody: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 21,
  },
  helpButton: {
    marginTop: 16,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export { PAYWALL_RESULT };
