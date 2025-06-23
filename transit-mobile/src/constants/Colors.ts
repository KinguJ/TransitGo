// TransitGo Mobile App Colors - Matching Web App Design System

export const Colors = {
  // Primary Brand Colors
  primary: {
    blue: '#2563EB',    // Blue-600 - Primary brand color
    blueHover: '#1D4ED8', // Blue-700 - Hover state
    blueLight: '#EFF6FF', // Blue-50 - Light backgrounds
    blueBorder: '#BFDBFE', // Blue-200 - Borders
  },

  // Transport Mode Colors (matching web app)
  transport: {
    bus: '#2563EB',     // Blue - Bus routes
    metro: '#DC2626',   // Red-600 - Metro lines  
    tram: '#059669',    // Green-600 - Tram routes
  },

  // Semantic Colors
  success: {
    primary: '#059669',   // Green-600
    light: '#F0FDF4',     // Green-50
    border: '#BBF7D0',    // Green-200
    text: '#166534',      // Green-800
  },

  error: {
    primary: '#DC2626',   // Red-600
    light: '#FEF2F2',     // Red-50
    border: '#FECACA',    // Red-200
    text: '#991B1B',      // Red-800
  },

  warning: {
    primary: '#D97706',   // Amber-600
    light: '#FFFBEB',     // Amber-50
    border: '#FDE68A',    // Amber-200
    text: '#92400E',      // Amber-800
  },

  // Neutral Colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background Colors
  background: {
    primary: '#F9FAFB',   // Gray-50 - Main background
    secondary: '#FFFFFF', // White - Card backgrounds
    tertiary: '#F3F4F6',  // Gray-100 - Section backgrounds
  },

  // Text Colors
  text: {
    primary: '#111827',   // Gray-900 - Primary text
    secondary: '#4B5563', // Gray-600 - Secondary text
    tertiary: '#6B7280',  // Gray-500 - Tertiary text
    light: '#9CA3AF',     // Gray-400 - Light text
    white: '#FFFFFF',     // White text
  },

  // Border Colors
  border: {
    light: '#F3F4F6',     // Gray-100
    medium: '#E5E7EB',    // Gray-200
    dark: '#D1D5DB',      // Gray-300
  },

  // Shadow Colors (for elevation)
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.15)',
  },
};

// Responsive breakpoints (for future responsive features)
export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

// Common spacing values
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography scale
export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export default Colors; 