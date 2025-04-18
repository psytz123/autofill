import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { prefetchRouteData } from '@/lib/prefetch';
import { cn } from '@/lib/utils';

interface PreloadLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

/**
 * Enhanced Link component that prefetches data when hovered
 * and adds active styling when the current route matches the link
 */
export function PreloadLink({
  href,
  children,
  className = '',
  activeClassName = '',
  prefetch = false,
  onClick,
  ...props
}: PreloadLinkProps) {
  const [location] = useLocation();
  const [hasPrefetched, setHasPrefetched] = useState(false);
  const isActive = location === href;
  
  // Prefetch data for the route
  const handlePrefetch = useCallback(() => {
    if (prefetch && !hasPrefetched) {
      prefetchRouteData(href);
      setHasPrefetched(true);
    }
  }, [href, prefetch, hasPrefetched]);
  
  // Handle click with analytics tracking capability
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  // Prefetch when component mounts if prefetch is set to true
  useEffect(() => {
    if (prefetch && !hasPrefetched) {
      // Small delay to prioritize visible content first
      const timer = setTimeout(() => {
        handlePrefetch();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [prefetch, hasPrefetched, handlePrefetch]);
  
  return (
    <Link href={href}>
      <div
        className={cn(
          className,
          isActive && activeClassName
        )}
        onMouseEnter={handlePrefetch}
        onTouchStart={handlePrefetch}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    </Link>
  );
}