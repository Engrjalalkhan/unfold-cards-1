import { Platform, Share, Alert } from 'react-native';

// Convert hex color to rgba
export const hexToRgba = (hex, alpha = 1) => {
  try {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      let c = hex.substring(1).split('');
      if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      c = '0x' + c.join('');
      // eslint-disable-next-line no-bitwise
      return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
  } catch (e) {}
  return hex;
};

// Helper to get a YYYY-MM-DD date key
export const getDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// Cross-platform sharing helper
export const shareQuestionText = async (text) => {
  try {
    if (Platform.OS === 'web') {
      // Prefer native Web Share API when available
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text, title: 'Unfold Cards' });
        return true;
      }
      // Fallback: copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Copied to clipboard. Share it anywhere!');
        } else {
          Alert.alert('Copied to clipboard', 'Question text copied. Share it anywhere!');
        }
        return true;
      }
      Alert.alert('Sharing unavailable', 'Please copy the text manually to share.');
      return false;
    }
    const result = await Share.share({ message: text });
    return result?.action === Share.sharedAction;
  } catch (e) {
    // Last fallback for web: attempt clipboard copy
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Copied to clipboard.');
        } else {
          Alert.alert('Copied to clipboard', 'Question text copied.');
        }
        return true;
      } catch {}
    }
    Alert.alert('Share error', 'Unable to share right now.');
    return false;
  }
};
