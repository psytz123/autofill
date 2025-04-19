/**
 * Responsive breakpoint definitions
 * Use these values throughout the application to ensure consistent responsive behavior
 */

export const breakpoints = {
  xs: 320,  // Extra small devices (phones)
  sm: 576,  // Small devices (large phones, portrait tablets)
  md: 768,  // Medium devices (tablets)
  lg: 992,  // Large devices (desktops)
  xl: 1200, // Extra large devices (large desktops)
};

/**
 * CSS media query strings for use in styled components or CSS-in-JS
 */
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  
  // Max-width queries (mobile-first approach)
  maxXs: `@media (max-width: ${breakpoints.xs - 1}px)`,
  maxSm: `@media (max-width: ${breakpoints.sm - 1}px)`,
  maxMd: `@media (max-width: ${breakpoints.md - 1}px)`,
  maxLg: `@media (max-width: ${breakpoints.lg - 1}px)`,
  maxXl: `@media (max-width: ${breakpoints.xl - 1}px)`,
};

/**
 * Responsive utilities to determine viewport size
 */
export function getViewportWidth(): number {
  return window.innerWidth;
}

export function isMobile(): boolean {
  return getViewportWidth() < breakpoints.md;
}

export function isTablet(): boolean {
  const width = getViewportWidth();
  return width >= breakpoints.md && width < breakpoints.lg;
}

export function isDesktop(): boolean {
  return getViewportWidth() >= breakpoints.lg;
}