import React, { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag } from "@use-gesture/react";

// Create our own spring implementation
interface SpringProps {
  config?: {
    tension?: number;
    friction?: number;
  };
}

function useSpring(initialProps: any) {
  const [props, setProps] = useState(initialProps);
  
  const api = {
    start: (newProps: any) => {
      setProps((prevProps: any) => ({ ...prevProps, ...newProps }));
      return Promise.resolve();
    }
  };
  
  return [props, api];
}

// Create an animated div component
const animated = {
  div: motion.div
};

export interface SwipeableContentProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Percentage of the container width required to trigger a swipe action
  leftAction?: ReactNode; // Element to show when swiping left
  rightAction?: ReactNode; // Element to show when swiping right
  className?: string;
  disableSwipe?: boolean;
}

export function SwipeableContent({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 0.3, // Default threshold is 30% of the container width
  leftAction,
  rightAction,
  className = "",
  disableSwipe = false,
}: SwipeableContentProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (containerRef) {
      setContainerWidth(containerRef.offsetWidth);
      
      // Update width on resize
      const handleResize = () => {
        setContainerWidth(containerRef.offsetWidth);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [containerRef]);
  
  // Spring animation for the content
  const [{ x }, api] = useSpring(() => ({ 
    x: 0,
    config: { tension: 300, friction: 30 } 
  }));
  
  // Setup drag handler
  const bind = useDrag(
    ({ down, movement: [mx], cancel, direction: [xDir], velocity: [vx] }) => {
      if (disableSwipe) return;
      
      const swipeThreshold = containerWidth * threshold;
      const isSwipeLeft = mx < 0 && mx < -swipeThreshold;
      const isSwipeRight = mx > 0 && mx > swipeThreshold;
      const isHighVelocity = vx > 1; // High velocity threshold
      
      // If exceeding threshold and not still being held, trigger action
      if (!down && (isSwipeLeft || (mx < 0 && isHighVelocity && xDir < 0))) {
        if (onSwipeLeft) {
          onSwipeLeft();
          // Animate back to center after action
          api.start({ x: 0 });
        } else {
          // If no action, bounce back
          api.start({ x: 0 });
        }
        return;
      }
      
      if (!down && (isSwipeRight || (mx > 0 && isHighVelocity && xDir > 0))) {
        if (onSwipeRight) {
          onSwipeRight();
          // Animate back to center after action
          api.start({ x: 0 });
        } else {
          // If no action, bounce back
          api.start({ x: 0 });
        }
        return;
      }
      
      // Update position while dragging
      api.start({ x: down ? mx : 0, immediate: down });
      
      // If exceeding maximum drag distance, cancel the gesture
      if (Math.abs(mx) > containerWidth * 0.7) {
        cancel();
      }
    },
    { filterTaps: true, axis: "x" }
  );
  
  // Calculate opacity of action indicators based on swipe progress
  const leftOpacity = x.to([0, -containerWidth * threshold], [0, 1]);
  const rightOpacity = x.to([0, containerWidth * threshold], [0, 1]);
  
  return (
    <div 
      ref={setContainerRef}
      className={`relative overflow-hidden touch-pan-y ${className}`}
    >
      {leftAction && (
        <animated.div 
          className="absolute top-0 right-0 h-full flex items-center justify-center px-4"
          style={{ opacity: leftOpacity }}
        >
          {leftAction}
        </animated.div>
      )}
      
      {rightAction && (
        <animated.div 
          className="absolute top-0 left-0 h-full flex items-center justify-center px-4"
          style={{ opacity: rightOpacity }}
        >
          {rightAction}
        </animated.div>
      )}
      
      <animated.div 
        {...bind()}
        style={{ x, touchAction: 'pan-y' }}
        className="w-full"
      >
        {children}
      </animated.div>
    </div>
  );
}

export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  pullDownThreshold?: number;
  loadingIndicator?: ReactNode;
}

export function PullToRefresh({
  onRefresh,
  children,
  className = "",
  pullDownThreshold = 80, // pixels to pull down before triggering refresh
  loadingIndicator,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [{ y }, api] = useSpring(() => ({ 
    y: 0,
    config: { tension: 400, friction: 30 } 
  }));
  
  const bind = useDrag(
    async ({ down, movement: [_, my], cancel, direction: [__, yDir], velocity: [___, vy] }) => {
      // Only allow pull down when at the top of the content
      const isAtTop = window.scrollY <= 0;
      if (!isAtTop) return;
      
      // Only allow pulling down, not up
      if (my < 0) {
        api.start({ y: 0 });
        return;
      }
      
      // Update position while dragging
      api.start({ y: down ? my : 0, immediate: down });
      
      // If pulling exceeds threshold and released, trigger refresh
      if (!down && my > pullDownThreshold) {
        setRefreshing(true);
        api.start({ y: pullDownThreshold / 2 }); // Show partial pull state during refresh
        
        try {
          await onRefresh();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          setRefreshing(false);
          api.start({ y: 0 }); // Animate back after refresh
        }
      } else if (!down) {
        // If released before threshold, snap back
        api.start({ y: 0 });
      }
      
      // If pull exceeds maximum distance, cancel the gesture
      if (my > pullDownThreshold * 2) {
        cancel();
      }
    },
    { filterTaps: true, axis: "y" }
  );
  
  // Calculate progress for the refresh indicator
  const progress = y.to([0, pullDownThreshold], [0, 1], { clamp: true });
  
  const defaultLoadingIndicator = (
    <div className="w-full flex justify-center items-center h-12">
      <div className="relative">
        <animated.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: refreshing ? 1 : 0 }}
        >
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </animated.div>
        
        <animated.div 
          className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
          style={{ 
            opacity: refreshing ? 0 : 1,
            transform: progress.to(p => `rotate(${p * 360}deg)`),
          }}
        />
      </div>
    </div>
  );
  
  return (
    <div className={`${className} overflow-hidden`}>
      <animated.div
        {...bind()}
        style={{ 
          y,
          touchAction: 'pan-y',
        }}
        className="w-full min-h-full"
      >
        <animated.div
          style={{ 
            opacity: progress,
            height: progress.to(p => p * 60),
            overflow: 'hidden',
          }}
        >
          {loadingIndicator || defaultLoadingIndicator}
        </animated.div>
        
        {children}
      </animated.div>
    </div>
  );
}