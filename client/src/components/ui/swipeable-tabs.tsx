import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface SwipeableTabsProps {
  tabs: Tab[];
  defaultTabIndex?: number;
  onTabChange?: (index: number) => void;
  tabsClassName?: string;
  contentClassName?: string;
  tabIndicatorClassName?: string;
}

/**
 * SwipeableTabs component for mobile-friendly tab navigation
 * Supports touch gestures, smooth animations, and accessible navigation
 */
export function SwipeableTabs({
  tabs,
  defaultTabIndex = 0,
  onTabChange,
  tabsClassName = '',
  contentClassName = '',
  tabIndicatorClassName = '',
}: SwipeableTabsProps) {
  const [activeTabIndex, setActiveTabIndex] = useState(defaultTabIndex);
  const [tabWidth, setTabWidth] = useState(0);
  const [tabsContainerWidth, setTabsContainerWidth] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Calculate tab width on mount and window resize
  useEffect(() => {
    const calculateTabDimensions = () => {
      if (tabsRef.current && tabRefs.current[activeTabIndex]) {
        const activeTab = tabRefs.current[activeTabIndex];
        if (activeTab) {
          setTabWidth(activeTab.offsetWidth);
          setTabsContainerWidth(tabsRef.current.offsetWidth);
        }
      }
    };
    
    calculateTabDimensions();
    window.addEventListener('resize', calculateTabDimensions);
    
    return () => {
      window.removeEventListener('resize', calculateTabDimensions);
    };
  }, [activeTabIndex, tabs.length]);
  
  // Handle tab change with callback
  const handleTabChange = (index: number) => {
    if (index !== activeTabIndex && index >= 0 && index < tabs.length) {
      setActiveTabIndex(index);
      if (onTabChange) {
        onTabChange(index);
      }
    }
  };
  
  // Swipe handlers for touch navigation
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = tabsContainerWidth * 0.2; // 20% of container width
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0 && activeTabIndex > 0) {
        // Swipe right, go to previous tab
        handleTabChange(activeTabIndex - 1);
      } else if (info.offset.x < 0 && activeTabIndex < tabs.length - 1) {
        // Swipe left, go to next tab
        handleTabChange(activeTabIndex + 1);
      }
    }
  };
  
  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTabChange(index);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabs.length;
      handleTabChange(nextIndex);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabs.length) % tabs.length;
      handleTabChange(prevIndex);
    }
  };
  
  return (
    <div>
      {/* Tab Header */}
      <div 
        ref={tabsRef}
        className={cn("flex relative", tabsClassName)}
        role="tablist"
        aria-orientation="horizontal"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={el => (tabRefs.current[index] = el)}
            role="tab"
            aria-selected={activeTabIndex === index}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTabIndex === index ? 0 : -1}
            className={cn(
              "flex-1 px-4 py-2 text-center text-sm font-medium transition-colors relative z-10",
              activeTabIndex === index ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabChange(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
        
        {/* Active Tab Indicator */}
        {tabRefs.current[activeTabIndex] && (
          <motion.div
            className={cn(
              "absolute bottom-0 h-0.5 bg-primary rounded-full",
              tabIndicatorClassName
            )}
            initial={false}
            animate={{
              left: tabRefs.current[activeTabIndex]?.offsetLeft,
              width: tabWidth,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </div>
      
      {/* Tab Content */}
      <div className={cn("relative", contentClassName)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTabIndex}
            role="tabpanel"
            id={`panel-${tabs[activeTabIndex].id}`}
            aria-labelledby={`tab-${tabs[activeTabIndex].id}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: activeTabIndex === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTabIndex === 0 ? 20 : -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="focus:outline-none"
          >
            {tabs[activeTabIndex].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}