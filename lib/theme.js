/**
 * ==============================================================================
 * OKARA CENTRALIZED THEME SYSTEM & DESIGN TOKENS
 * ==============================================================================
 * This file serves as the single source of truth for the OKARA brand identity.
 * To re-theme or customize the visual aesthetics of the entire store, modify
 * the values in this configuration. Components consume these tokens via CSS
 * variables (`var(--color-primary)`, etc.) or the `theme` object.
 */

export const OKARA_DEFAULT_THEME = {
  name: 'OKARA Signature Noir & Blanc',
  version: '1.0.0',
  colors: {
    // Primary brand identity (Black)
    primary: '#0A0A0A',
    primaryHover: '#262626',
    
    // Secondary brand color (Crisp White)
    secondary: '#FFFFFF',
    secondaryHover: '#F5F5F7',
    
    // Global canvas background (Off-white / clean light tone)
    background: '#FAFAFA',
    backgroundAlt: '#F5F5F7',
    
    // Surfaces, Cards, and Containers
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F7F8',
    surfaceElevated: '#FFFFFF',
    
    // Typography
    text: '#0A0A0A',
    textMuted: '#737373',
    textSubtle: '#A3A3A3',
    textInverted: '#FFFFFF',
    
    // Minimalist luxury borders
    border: '#E5E5E5',
    borderLight: '#F0F0F0',
    borderDark: '#0A0A0A',
    
    // Functional accents
    accent: '#0A0A0A',
    accentSubtle: '#F0F0F2',
    badgeBg: '#0A0A0A',
    badgeText: '#FFFFFF',
    
    // State indicators
    success: '#16A34A',
    error: '#DC2626',
  },
  typography: {
    fontEditorial: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    fontSans: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    letterSpacingEditorial: '0.12em',
    letterSpacingLuxury: '0.22em',
  },
  layout: {
    containerMaxWidth: '1440px',
    borderRadius: '0px', // Sharp high-fashion architectural edges
    headerHeight: '80px',
  },
};

/**
 * Helper to generate CSS custom properties string for SSR / injection
 */
export function generateThemeCssVariables(theme = OKARA_DEFAULT_THEME) {
  return `
    :root {
      --color-primary: ${theme.colors.primary};
      --color-primary-hover: ${theme.colors.primaryHover};
      --color-secondary: ${theme.colors.secondary};
      --color-secondary-hover: ${theme.colors.secondaryHover};
      --color-background: ${theme.colors.background};
      --color-background-alt: ${theme.colors.backgroundAlt};
      --color-surface: ${theme.colors.surface};
      --color-surface-subtle: ${theme.colors.surfaceSubtle};
      --color-surface-elevated: ${theme.colors.surfaceElevated};
      --color-text: ${theme.colors.text};
      --color-muted: ${theme.colors.textMuted};
      --color-subtle: ${theme.colors.textSubtle};
      --color-text-inverted: ${theme.colors.textInverted};
      --color-border: ${theme.colors.border};
      --color-border-light: ${theme.colors.borderLight};
      --color-border-dark: ${theme.colors.borderDark};
      --color-accent: ${theme.colors.accent};
      --color-accent-subtle: ${theme.colors.accentSubtle};
      --color-badge-bg: ${theme.colors.badgeBg};
      --color-badge-text: ${theme.colors.badgeText};
      --font-editorial: ${theme.typography.fontEditorial};
      --font-sans: ${theme.typography.fontSans};
      --tracking-editorial: ${theme.typography.letterSpacingEditorial};
      --tracking-luxury: ${theme.typography.letterSpacingLuxury};
      --container-max-width: ${theme.layout.containerMaxWidth};
      --radius-brand: ${theme.layout.borderRadius};
    }
  `;
}
