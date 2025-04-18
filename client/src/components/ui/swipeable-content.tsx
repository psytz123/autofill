import React, { ReactNode, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useDrag } from "@use-gesture/react";

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
  const [dragX, setDragX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      
      // Update width on resize
      const handleResize = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  const bind = useDrag(
    ({ down, movement: [mx], cancel, direction: [xDir], velocity: [vx] }) => {
      if (disableSwipe) return;
      
      const swipeThreshold = containerWidth * threshold;
      const isSwipeLeft = mx < 0 && mx < -swipeThreshold;
      const isSwipeRight = mx > 0 && mx > swipeThreshold;
      const isHighVelocity = vx > 1; // High velocity threshold
      
      if (down) {
        setDragX(mx);
      } else {
        // If exceeding threshold or high velocity, trigger action
        if (isSwipeLeft || (mx < 0 && isHighVelocity && xDir < 0)) {
          if (onSwipeLeft) {
            onSwipeLeft();
            setDragX(0);
          } else {
            // If no action, bounce back
            setDragX(0);
          }
        } else if (isSwipeRight || (mx > 0 && isHighVelocity && xDir > 0)) {
          if (onSwipeRight) {
            onSwipeRight();
            setDragX(0);
          } else {
            // If no action, bounce back
            setDragX(0);
          }
        } else {
          // Not enough to trigger, bounce back
          setDragX(0);
        }
      }
      
      // If exceeding maximum drag distance, cancel the gesture
      if (Math.abs(mx) > containerWidth * 0.7) {
        cancel();
        setDragX(0);
      }
    },
    { filterTaps: true, axis: "x" }
  );
  
  // Calculate opacity of action indicators based on swipe progress
  const leftOpacity = Math.min(Math.abs(Math.min(dragX, 0)) / (containerWidth * threshold), 1);
  const rightOpacity = Math.min(Math.max(dragX, 0) / (containerWidth * threshold), 1);
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden touch-pan-y ${className}`}
    >
      {leftAction && (
        <div 
          className="absolute top-0 right-0 h-full flex items-center justify-center px-4"
          style={{ opacity: leftOpacity }}
        >
          {leftAction}
        </div>
      )}
      
      {rightAction && (
        <div 
          className="absolute top-0 left-0 h-full flex items-center justify-center px-4"
          style={{ opacity: rightOpacity }}
        >
          {rightAction}
        </div>
      )}
      
      <motion.div 
        {...bind()}
        style={{ 
          x: dragX,
          transition: dragX === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}