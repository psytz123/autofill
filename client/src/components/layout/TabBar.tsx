import { Home, FileText, User, Droplet, CreditCard } from "lucide-react";
import { useLocation } from "wouter";
import { 
  preloadComponent,
  preloadMainNav,
  preloadAccountRelated,
  preloadOrderRelated,
} from "@/lib/preload";
import { prefetchRouteData } from "@/lib/prefetch";
import { PreloadLink } from "@/components/ui/preload-link";
import { useEffect, memo, useCallback, useMemo } from "react";

// TabButton component with memo for preventing re-renders
const TabButton = memo(({ 
  path, 
  label, 
  icon, 
  color, 
  isActive, 
  onHover 
}: { 
  path: string; 
  label: string; 
  icon: React.ReactNode; 
  color: string; 
  isActive: boolean; 
  onHover: () => void;
}) => {
  // When hover, we both preload component and prefetch data
  const handleHover = useCallback(() => {
    onHover();
    prefetchRouteData(path);
  }, [onHover, path]);
  
  return (
    <PreloadLink 
      href={path}
      prefetch={true}
      className="h-full w-full"
    >
      <div 
        className={`h-full w-full flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive ? color : 'text-neutral-500 hover:text-neutral-800'}`}
        onMouseEnter={handleHover}
      >
        <div className={`relative ${isActive ? 
          `after:content-[""] after:absolute after:w-1.5 after:h-1.5 after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2 ${color === 'autofill-navy' ? 'after:bg-autofill-navy' : 'after:bg-autofill-orange'}` 
          : ''}`}>
          {icon}
        </div>
        <span className="text-xs mt-1.5 font-medium text-center w-full px-1 truncate">{label}</span>
      </div>
    </PreloadLink>
  );
});

// Add display name for debugging
TabButton.displayName = 'TabButton';

function TabBar() {
  const [location] = useLocation();

  // Preload all main navigation components when the TabBar loads - using useCallback to avoid recreating function
  useEffect(() => {
    // Small delay to let the initial render complete
    const timer = setTimeout(() => {
      preloadMainNav();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Memoize the isActive function to prevent recreation on each render
  const isActive = useCallback((path: string) => {
    return location === path;
  }, [location]);
  
  // Memoize hover handlers to prevent recreating functions on each render
  const handleHoverHome = useCallback(() => {
    preloadComponent(() => import('@/pages/home-page'));
  }, []);
  
  const handleHoverOrder = useCallback(() => {
    preloadComponent(() => import('@/pages/order-page'));
  }, []);
  
  const handleHoverOrders = useCallback(() => {
    preloadOrderRelated();
  }, []);
  
  const handleHoverSubscription = useCallback(() => {
    preloadComponent(() => import('@/pages/subscription-page'));
  }, []);
  
  const handleHoverAccount = useCallback(() => {
    preloadAccountRelated();
  }, []);

  // Memoize tab button data so it doesn't get recreated on each render
  const tabButtons = useMemo(() => [
    { path: '/', label: 'Home', icon: <Home className="h-6 w-6" />, color: 'autofill-navy', onHover: handleHoverHome },
    { path: '/order', label: 'Order', icon: <Droplet className="h-6 w-6" />, color: 'autofill-orange', onHover: handleHoverOrder },
    { path: '/orders', label: 'My Orders', icon: <FileText className="h-6 w-6" />, color: 'autofill-navy', onHover: handleHoverOrders },
    { path: '/subscription', label: 'Plans', icon: <CreditCard className="h-6 w-6" />, color: 'autofill-orange', onHover: handleHoverSubscription },
    { path: '/account', label: 'Account', icon: <User className="h-6 w-6" />, color: 'autofill-navy', onHover: handleHoverAccount }
  ], [handleHoverHome, handleHoverOrder, handleHoverOrders, handleHoverSubscription, handleHoverAccount]);

  return (
    <nav className="bg-white border-t border-neutral-200 shadow-lg fixed bottom-0 left-0 right-0 h-20 z-50">
      <div className="grid grid-cols-5 h-full max-w-screen-lg mx-auto">
        {tabButtons.map((tab) => (
          <TabButton 
            key={tab.path}
            path={tab.path}
            label={tab.label}
            icon={tab.icon}
            color={tab.color}
            isActive={isActive(tab.path)}
            onHover={tab.onHover}
          />
        ))}
      </div>
    </nav>
  );
}

// Memoize the entire TabBar component to prevent unnecessary renders when parent components update
export default memo(TabBar);
