/**
 * Utility for preloading lazy-loaded components.
 * This improves perceived performance by preloading components 
 * when we anticipate the user might navigate to them.
 */

// Preload a single component
export function preloadComponent(importFn: () => Promise<any>): void {
  importFn().catch(err => {
    console.warn('Failed to preload component:', err);
  });
}

// Preload multiple components at once
export function preloadComponents(importFns: Array<() => Promise<any>>): void {
  importFns.forEach(preloadComponent);
}

// Common component groupings for preloading
export const preloadMainNav = () => {
  return preloadComponents([
    () => import('@/pages/home-page'),
    () => import('@/pages/order-page'),
    () => import('@/pages/orders-page'),
    () => import('@/pages/vehicles-page'),
    () => import('@/pages/account-page'),
  ]);
};

export const preloadAccountRelated = () => {
  return preloadComponents([
    () => import('@/pages/account-page'),
    () => import('@/pages/payment-methods-page'),
    () => import('@/pages/subscription-page'),
  ]);
};

export const preloadOrderRelated = () => {
  return preloadComponents([
    () => import('@/pages/order-page'),
    () => import('@/pages/orders-page'),
  ]);
};

export const preloadAdminPages = () => {
  return preloadComponents([
    () => import('@/pages/admin/admin-dashboard'),
    () => import('@/pages/admin/admin-orders'),
    () => import('@/pages/admin/admin-drivers'),
    () => import('@/pages/admin/admin-profile'),
  ]);
};