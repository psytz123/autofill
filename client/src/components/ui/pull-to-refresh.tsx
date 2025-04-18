import { useRef, useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PullToRefreshProps {
  onRefresh: () => Promise<any>;
  children: ReactNode;
  className?: string;
  pullDistance?: number;
  loadingIndicator?: ReactNode;
}

/**
 * Pull to refresh component for mobile interfaces
 * Provides a native-like pull to refresh experience
 */
export function PullToRefresh({
  onRefresh,
  children,
  className = '',
  pullDistance = 80,
  loadingIndicator,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get scroll position helper
  const getScrollTop = () => {
    if (!containerRef.current) return 0;
    return containerRef.current.scrollTop;
  };

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    // Only allow pull refresh when at the top of the content
    if (getScrollTop() > 0) return;
    
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    setPulling(true);
  };

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!pulling) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance to the pull (gets harder the further you pull)
    const progress = Math.min(1, deltaY / pullDistance);
    setPullProgress(progress);
    
    // Prevent default when pulling to avoid scroll interference
    if (deltaY > 5 && getScrollTop() <= 0) {
      e.preventDefault();
    }
  };

  // Handle touch end
  const handleTouchEnd = async () => {
    if (!pulling) return;
    
    setPulling(false);
    
    // If pulled enough, trigger refresh
    if (pullProgress >= 0.8 && !refreshing) {
      setRefreshing(true);
      setPullProgress(0);
      
      try {
        await onRefresh();
      } finally {
        // Small delay to show completion
        setTimeout(() => {
          setRefreshing(false);
        }, 500);
      }
    } else {
      // Reset pull progress with animation
      setPullProgress(0);
    }
  };

  // Setup event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pulling, refreshing, pullProgress]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
    >
      {/* Pull Indicator */}
      <motion.div 
        className="absolute left-0 right-0 flex justify-center items-center overflow-hidden z-10 pointer-events-none"
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: pulling ? `${pullProgress * pullDistance}px` : refreshing ? '60px' : '0px',
          opacity: pulling || refreshing ? 1 : 0
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 400, 
          damping: 40
        }}
      >
        {refreshing ? (
          loadingIndicator || (
            <div className="flex flex-col items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground mt-1">Refreshing...</span>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center transform transition-transform">
            <motion.div
              animate={{ 
                rotate: pulling ? pullProgress * 360 : 0,
                scale: pulling ? Math.min(1, 0.5 + pullProgress * 0.5) : 0.5
              }}
              transition={{ type: 'spring' }}
            >
              <Loader2 className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="text-xs text-muted-foreground mt-1">
              {pullProgress > 0.8 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        )}
      </motion.div>
      
      {/* Content Container */}
      <motion.div
        className="relative z-0"
        animate={{ 
          y: pulling ? pullProgress * pullDistance * 0.5 : refreshing ? 60 : 0,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 400, 
          damping: 40
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}