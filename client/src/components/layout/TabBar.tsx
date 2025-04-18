import { Home, PlusCircle, FileText, User } from "lucide-react";
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
          <a className={`flex-1 flex flex-col items-center justify-center ${isActive('/') ? 'text-primary' : 'text-neutral-500'}`}>
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </a>
        </Link>
        
        <Link href="/order">
          <a className={`flex-1 flex flex-col items-center justify-center ${isActive('/order') ? 'text-primary' : 'text-neutral-500'}`}>
            <PlusCircle className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Order</span>
          </a>
        </Link>
        
        <Link href="/orders">
          <a className={`flex-1 flex flex-col items-center justify-center ${isActive('/orders') ? 'text-primary' : 'text-neutral-500'}`}>
            <FileText className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Orders</span>
          </a>
        </Link>
        
        <Link href="/account">
          <a className={`flex-1 flex flex-col items-center justify-center ${isActive('/account') ? 'text-primary' : 'text-neutral-500'}`}>
            <User className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Account</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}

export default TabBar;
