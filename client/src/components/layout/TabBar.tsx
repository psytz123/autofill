import { Home, PlusCircle, FileText, User, Droplet } from "lucide-react";
import { useLocation, Link } from "wouter";

function TabBar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 h-20">
      <div className="flex h-full">
        <Link href="/">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer ${isActive('/') ? 'autofill-navy' : 'text-neutral-500'}`}>
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </div>
        </Link>
        
        <Link href="/order">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer ${isActive('/order') ? 'autofill-orange' : 'text-neutral-500'}`}>
            <Droplet className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Order Fuel</span>
          </div>
        </Link>
        
        <Link href="/orders">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer ${isActive('/orders') ? 'autofill-navy' : 'text-neutral-500'}`}>
            <FileText className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Orders</span>
          </div>
        </Link>
        
        <Link href="/account">
          <div className={`flex-1 flex flex-col items-center justify-center cursor-pointer ${isActive('/account') ? 'autofill-navy' : 'text-neutral-500'}`}>
            <User className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Account</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}

export default TabBar;
