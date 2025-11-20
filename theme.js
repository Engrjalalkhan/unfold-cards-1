export const lightTheme = {
  name: 'light',
  colors: {
    background: '#E9D7FF',
    surface: '#FFFFFF',
    surfaceTint: '#F5EEFF',
    border: '#E6D6FF',
    primary: '#9D4EDD',
    primaryText: '#3B245A',
    text: '#2F2752',
    textMuted: '#7A6FA3',
    overlay: 'rgba(47,39,82,0.10)',
    shadow: 'rgba(124,77,255,0.18)',
  },
  gradients: {
    zone: ['#FFFFFF', '#F5EEFF'],
    category: ['#FFFFFF', '#F5EEFF'],
    onboarding: ['#E9D7FF', '#FFFFFF'],
    cta: ['#9D4EDD', '#7B2CBF'],
  },
  radius: { xl: 20, lg: 16, md: 12, sm: 10 },
  spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 },
};

export const darkTheme = {
  name: 'dark',
  colors: {
    background: '#1A1A2E',
    surface: '#16213E',
    surfaceTint: '#0F3460',
    border: '#2A2A4A',
    primary: '#9D4EDD',
    primaryText: '#FFFFFF',
    text: '#E0E0E0',
    textMuted: '#A0A0A0',
    overlay: 'rgba(255,255,255,0.10)',
    shadow: 'rgba(0,0,0,0.30)',
  },
  gradients: {
    zone: ['#16213E', '#0F3460'],
    category: ['#16213E', '#0F3460'],
    onboarding: ['#1A1A2E', '#16213E'],
    cta: ['#9D4EDD', '#7B2CBF'],
  },
  radius: { xl: 20, lg: 16, md: 12, sm: 10 },
  spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 },
};

export const theme = lightTheme; // Default to light theme