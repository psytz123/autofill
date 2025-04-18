import React, { useState, useRef, ReactNode, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useDrag } from "@use-gesture/react";

export interface Tab {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

export interface SwipeableTabsProps {
  tabs: Tab[];
  defaultTabIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

export function SwipeableTabs({
  tabs,
  defaultTabIndex = 0,
  onTabChange,
  className = "",
  tabsClassName = "",
  contentClassName = ""
}: SwipeableTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTabIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = offset.x < -100 || (offset.x < 0 && velocity.x < -500);
    
    if (swipe && activeTab < tabs.length - 1) {
      // Swipe left, go to next tab
      handleTabChange(activeTab + 1);
    } else if (offset.x > 100 || (offset.x > 0 && velocity.x > 500)) {
      // Swipe right, go to previous tab
      if (activeTab > 0) {
        handleTabChange(activeTab - 1);
      }
    }
  };
  
  const swipeAnimation = {
    initial: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };
  
  // To track swipe direction
  const [[page, direction], setPage] = useState([activeTab, 0]);
  
  // Update page and direction when activeTab changes
  useEffect(() => {
    const newDirection = activeTab > page ? 1 : -1;
    setPage([activeTab, newDirection]);
  }, [activeTab]);
  
  // Setup drag handler with @use-gesture
  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], velocity: [vx], cancel }) => {
      // Limit drag to horizontal only when at the top of the content
      const dragThreshold = 50;
      const velocityThreshold = 0.5;
      
      if (!down) {
        if ((mx < -dragThreshold || (vx > velocityThreshold && xDir < 0)) && activeTab < tabs.length - 1) {
          handleTabChange(activeTab + 1);
        } else if ((mx > dragThreshold || (vx > velocityThreshold && xDir > 0)) && activeTab > 0) {
          handleTabChange(activeTab - 1);
        }
      }
      
      // If exceeding maximum drag distance, cancel the gesture
      if (Math.abs(mx) > window.innerWidth * 0.4) {
        cancel();
      }
    },
    { filterTaps: true, axis: "x" }
  );

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* Tab Headers */}
      <div className={`flex ${tabsClassName}`}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(index)}
            className={`flex-1 py-2 px-4 text-center transition-colors duration-200 ${
              index === activeTab 
                ? "text-primary border-b-2 border-primary font-medium" 
                : "text-neutral-500 hover:text-neutral-800 border-b border-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content with Swipe Animation */}
      <div 
        className={`mt-4 w-full overflow-hidden ${contentClassName}`} 
        {...bind()}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={swipeAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            {tabs[activeTab]?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}