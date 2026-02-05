export const lightTheme = {
  name: 'light',
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceTint: '#F8F9FA',
    border: '#E9ECEF',
    primary: '#8B5CF6',
    primaryText: '#6B3AA0',
    text: '#212529',
    textMuted: '#6C757D',
    overlay: 'rgba(139,92,246,0.15)',
    shadow: 'rgba(0,0,0,0.1)',
  },
  gradients: {
    zone: ['#F5E6FF', '#ECE1FF'],
    category: ['#F5E6FF', '#ECE1FF'],
    onboarding: ['#E8D5F7', '#F5E6FF'],
    cta: ['#8B5CF6', '#7C3AED'],
  },
  radius: { xl: 20, lg: 16, md: 12, sm: 10 },
  spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 },
};

export const darkTheme = {
  name: 'dark',
  colors: {
    background: '#2D1B69',
    surface: '#3D2A7F',
    surfaceTint: '#4A3A8C',
    border: '#5A4A9C',
    primary: '#B794F6',
    primaryText: '#F0E6FF',
    text: '#E6D6FF',
    textMuted: '#B794F6',
    overlay: 'rgba(183,148,246,0.20)',
    shadow: 'rgba(157,78,221,0.40)',
  },
  gradients: {
    zone: ['#3D2A7F', '#4A3A8C'],
    category: ['#3D2A7F', '#4A3A8C'],
    onboarding: ['#2D1B69', '#3D2A7F'],
    cta: ['#B794F6', '#9D4EDD'],
  },
  radius: { xl: 20, lg: 16, md: 12, sm: 10 },
  spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 },
};

export const theme = lightTheme; // Default to light theme