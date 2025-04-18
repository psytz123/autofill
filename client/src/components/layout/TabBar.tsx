import { Home, FileText, User, Droplet, CreditCard } from "lucide-react";
import { useLocation, Link } from "wouter";
import { 
  preloadComponent,
  preloadMainNav,
  preloadAccountRelated,
  preloadOrderRelated,
} from "@/lib/preload";
import { useEffect } from "react";

function TabBar() {
  const [location] = useLocation();

  // Preload all main navigation components when the TabBar loads
  useEffect(() => {
    // Small delay to let the initial render complete
    const timer = setTimeout(() => {
      preloadMainNav();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const isActive = (path: string) => {
    return location === path;
  };
  
  // Preload components on hover for better performance
  const handleHoverHome = () => {
    preloadComponent(() => import('@/pages/home-page'));
  };
  
  const handleHoverOrder = () => {
    preloadComponent(() => import('@/pages/order-page'));
  };
  
  const handleHoverOrders = () => {
    preloadOrderRelated();
  };
  
  const handleHoverSubscription = () => {
    preloadComponent(() => import('@/pages/subscription-page'));
  };
  
  const handleHoverAccount = () => {
    preloadAccountRelated();
  };

  // Define tab button data for consistency
  const tabButtons = [
    { path: '/', label: 'Home', icon: <Home className="h-6 w-6" />, color: 'autofill-navy', onHover: handleHoverHome },
    { path: '/order', label: 'Order', icon: <Droplet className="h-6 w-6" />, color: 'autofill-orange', onHover: handleHoverOrder },
    { path: '/orders', label: 'My Orders', icon: <FileText className="h-6 w-6" />, color: 'autofill-navy', onHover: handleHoverOrders },
    { path: '/subscription', label: 'Plans', icon: <CreditCard className="h-6 w-6" />, color: 'autofill-orange', onHover: handleHoverSubscription },
    { path: '/account', label: 'Account', icon: <User className="h-6 w-6" />, color: 'autofill-navy', onHover: handleHoverAccount }
  ];

  return (
    <nav className="bg-white border-t border-neutral-200 shadow-lg fixed bottom-0 left-0 right-0 h-20 z-50">
      <div className="grid grid-cols-5 h-full max-w-screen-lg mx-auto">
        {tabButtons.map((tab) => (
          <Link href={tab.path} key={tab.path}>
            <div 
              className={`h-full w-full flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive(tab.path) ? tab.color : 'text-neutral-500 hover:text-neutral-800'}`}
              onMouseEnter={tab.onHover}
            >
              <div className={`relative ${isActive(tab.path) ? 
                `after:content-[""] after:absolute after:w-1.5 after:h-1.5 after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2 ${tab.color === 'autofill-navy' ? 'after:bg-autofill-navy' : 'after:bg-autofill-orange'}` 
                : ''}`}>
                {tab.icon}
              </div>
              <span className="text-xs mt-1.5 font-medium text-center w-full px-1 truncate">{tab.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default TabBar;
