import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Package, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { adminUser, logoutMutation } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/admin/login");
      },
    });
  };
  
  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin/dashboard",
    },
    {
      label: "Orders",
      icon: <Package className="h-5 w-5" />,
      href: "/admin/orders",
    },
    {
      label: "Drivers",
      icon: <Truck className="h-5 w-5" />,
      href: "/admin/drivers",
    },
    {
      label: "Customers",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/customers",
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
    },
  ];
  
  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location === item.href;
    
    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        className={`justify-start w-full ${isActive ? "bg-autofill-navy text-white" : ""}`}
        onClick={() => {
          setLocation(item.href);
          setIsMobileMenuOpen(false);
        }}
      >
        {item.icon}
        <span className="ml-2">{item.label}</span>
      </Button>
    );
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-autofill-navy">AutoFill Admin</h1>
        </div>
        
        <div className="flex flex-col flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">
                {adminUser?.name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
            <div className="ml-3">
              <p className="font-medium">{adminUser?.name || "Admin"}</p>
              <p className="text-sm text-gray-500">{adminUser?.role || "Admin"}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-red-600"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
      
      {/* Mobile Header & Menu */}
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between bg-white border-b p-4 md:py-2">
          <div className="flex items-center md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <div className="p-4 border-b flex items-center justify-between">
                  <h1 className="text-xl font-bold text-autofill-navy">AutoFill Admin</h1>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex flex-col flex-1 p-4 space-y-2">
                  {navItems.map((item) => (
                    <NavItem key={item.href} item={item} />
                  ))}
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {adminUser?.name?.charAt(0).toUpperCase() || "A"}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{adminUser?.name || "Admin"}</p>
                      <p className="text-sm text-gray-500">{adminUser?.role || "Admin"}</p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-600"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <h1 className="text-xl font-bold md:ml-6">{title}</h1>
          
          <div className="md:hidden">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">
                {adminUser?.name?.charAt(0).toUpperCase() || "A"}
              </span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}