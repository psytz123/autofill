import { Home, FileText, User, Droplet, CreditCard } from "lucide-react";
import { useLocation, Link } from "wouter";

function TabBar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white border-t border-neutral-200 shadow-lg fixed bottom-0 left-0 right-0 h-20 z-50">
      <div className="flex h-full max-w-screen-lg mx-auto">
        <Link href="/">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/') ? 'autofill-navy' : 'text-neutral-500 hover:text-neutral-800'}`}>
            <div className={`relative ${isActive('/') ? 'after:content-[""] after:absolute after:w-1.5 after:h-1.5 after:bg-autofill-navy after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2' : ''}`}>
              <Home className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1.5 font-medium">Home</span>
          </div>
        </Link>
        
        <Link href="/order">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/order') ? 'autofill-orange' : 'text-neutral-500 hover:text-neutral-800'}`}>
            <div className={`relative ${isActive('/order') ? 'after:content-[""] after:absolute after:w-1.5 after:h-1.5 after:bg-autofill-orange after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2' : ''}`}>
              <Droplet className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1.5 font-medium">Order Fuel</span>
          </div>
        </Link>
        
        <Link href="/orders">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/orders') ? 'autofill-navy' : 'text-neutral-500 hover:text-neutral-800'}`}>
            <div className={`relative ${isActive('/orders') ? 'after:content-[""] after:absolute after:w-1.5 after:h-1.5 after:bg-autofill-navy after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2' : ''}`}>
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1.5 font-medium">Orders</span>
          </div>
        </Link>
        
        <Link href="/subscription">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/subscription') ? 'autofill-orange' : 'text-neutral-500 hover:text-neutral-800'}`}>
            <div className={`relative ${isActive('/subscription') ? 'after:content-[""] after:absolute after:w-1.5 after:h-1.5 after:bg-autofill-orange after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2' : ''}`}>
              <CreditCard className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1.5 font-medium">Plans</span>
          </div>
        </Link>
        
        <Link href="/account">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors ${isActive('/account') ? 'autofill-navy' : 'text-neutral-500 hover:text-neutral-800'}`}>
            <div className={`relative ${isActive('/account') ? 'after:content-[""] after:absolute after:w-1.5 after:h-1.5 after:bg-autofill-navy after:rounded-full after:-bottom-1 after:left-1/2 after:-translate-x-1/2' : ''}`}>
              <User className="h-6 w-6" />
            </div>
            <span className="text-xs mt-1.5 font-medium">Account</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}

export default TabBar;
