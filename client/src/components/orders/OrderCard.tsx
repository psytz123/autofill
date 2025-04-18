import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { getFuelTypeDisplayName } from "@/lib/fuelUtils";
import { formatPrice } from "@/lib/fuelUtils";
import { ReactNode } from "react";

interface OrderCardProps {
  order: Order;
  showViewDetails?: boolean;
  onViewDetails?: (orderId: number) => void;
  actions?: ReactNode;
  className?: string;
}

// Status badge configuration
const STATUS_CONFIG = {
  COMPLETED: { className: "bg-success text-white", label: "Completed" },
  IN_PROGRESS: { className: "bg-secondary text-white", label: "In Progress" },
  CANCELLED: { className: "bg-destructive text-white", label: "Cancelled" }
};

export default function OrderCard({ 
  order, 
  showViewDetails = false, 
  onViewDetails, 
  actions,
  className = "" 
}: OrderCardProps) {
  // Get the appropriate badge for the order status
  const getStatusBadge = (status: OrderStatus) => {
    const config = STATUS_CONFIG[status] || { className: "", label: "Unknown" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };
  
  // Format a date string for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  // Handle view details click
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  };
  
  const vehicleInfo = order.vehicle ? 
    `${order.vehicle.make} ${order.vehicle.model} (${order.vehicle.year})` : 
    'No vehicle information';
  
  return (
    <Card className={`mb-4 ${className}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-neutral-800">Order #{order.id}</h3>
            <p className="text-xs text-neutral-500">
              {formatDistanceToNow(new Date(order.createdAt || Date.now()), { addSuffix: true })}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>
        
        <div className="flex items-center text-sm mb-3">
          <span className="font-medium text-neutral-700 mr-2">
            {vehicleInfo}
          </span>
          <span className="text-neutral-500">• {getFuelTypeDisplayName(order.fuelType)}</span>
        </div>
        
        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-500">{order.amount} gallons</span>
          <span className="font-medium">${order.totalPrice}</span>
        </div>
        
        {/* Custom actions or default view details button */}
        {actions ? (
          <div className="mt-3">{actions}</div>
        ) : showViewDetails && (
          onViewDetails ? (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleViewDetails}
            >
              View Details
            </Button>
          ) : (
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
          )
        )}
      </CardContent>
    </Card>
  );
}
