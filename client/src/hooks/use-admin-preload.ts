import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { preloadAdminPages } from '@/lib/preload';

/**
 * Hook to preload admin pages based on user navigation patterns
 * This improves perceived performance by preloading components 
 * when we anticipate the admin user might navigate to them.
 */
export function useAdminPreload() {
  const [location] = useLocation();
  
  useEffect(() => {
    // If the user is already in the admin section, preload all admin pages
    if (location.startsWith('/admin')) {
      // Small delay to ensure we don't impact initial page load
      const timer = setTimeout(() => {
        preloadAdminPages();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  return null;
}