import React, { ReactNode, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { Loader2 } from "lucide-react";

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
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const bind = useDrag(
    async ({ down, movement: [_, my], cancel, direction: [__, yDir], velocity: [___, vy] }) => {
      // Only allow pull down when at the top of the content
      const isAtTop = window.scrollY <= 0;
      if (!isAtTop) return;
      
      // Only allow pulling down, not up
      if (my < 0) {
        setPullDistance(0);
        return;
      }
      
      // Update position while dragging
      if (down) {
        setPullDistance(my);
      } else {
        // If pulling exceeds threshold and released, trigger refresh
        if (my > pullDownThreshold) {
          setRefreshing(true);
          setPullDistance(pullDownThreshold / 2); // Show partial pull state during refresh
          
          try {
            await onRefresh();
          } catch (error) {
            console.error("Refresh failed:", error);
          } finally {
            setRefreshing(false);
            setPullDistance(0); // Animate back after refresh
          }
        } else {
          // If released before threshold, snap back
          setPullDistance(0);
        }
      }
      
      // If pull exceeds maximum distance, cancel the gesture
      if (my > pullDownThreshold * 2) {
        cancel();
      }
    },
    { filterTaps: true, axis: "y" }
  );
  
  // Calculate progress for the refresh indicator (0-1)
  const progress = Math.min(pullDistance / pullDownThreshold, 1);
  
  const defaultLoadingIndicator = (
    <div className="w-full flex justify-center items-center h-12">
      <div className="relative">
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: refreshing ? 1 : 0 }}
        >
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
        
        <div 
          className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
          style={{ 
            opacity: refreshing ? 0 : 1,
            transform: `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
    </div>
  );
  
  return (
    <div className={`${className} overflow-hidden`} ref={containerRef}>
      <div
        {...bind()}
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
          touchAction: 'pan-y',
        }}
        className="w-full min-h-full"
      >
        <div
          style={{ 
            opacity: progress,
            height: `${progress * 60}px`,
            overflow: 'hidden',
          }}
        >
          {loadingIndicator || defaultLoadingIndicator}
        </div>
        
        {children}
      </div>
    </div>
  );
}