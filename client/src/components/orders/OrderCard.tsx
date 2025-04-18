import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { getFuelTypeDisplayName } from "@/lib/fuelUtils";
import { formatPrice } from "@/lib/fuelUtils";
import { ReactNode, memo, useCallback, useMemo } from "react";

interface OrderCardProps {
  order: Order;
  showViewDetails?: boolean;
  onViewDetails?: (orderId: number) => void;
  actions?: ReactNode;
  className?: string;
}

// Status badge configuration - defined outside component to prevent recreation
const STATUS_CONFIG = {
  COMPLETED: { className: "bg-success text-white", label: "Completed" },
  IN_PROGRESS: { className: "bg-secondary text-white", label: "In Progress" },
  CANCELLED: { className: "bg-destructive text-white", label: "Cancelled" }
};

// Memoized status badge component to prevent unnecessary re-renders
const StatusBadge = memo(({ status }: { status: OrderStatus }) => {
  const config = STATUS_CONFIG[status] || { className: "", label: "Unknown" };
  return <Badge className={config.className}>{config.label}</Badge>;
});

// Add display name for debugging
StatusBadge.displayName = 'StatusBadge';

// Memoized vehicle info component
const VehicleInfo = memo(({ vehicle }: { vehicle: any }) => {
  const info = vehicle ? 
    `${vehicle.make} ${vehicle.model} (${vehicle.year})` : 
    'No vehicle information';
  
  return (
    <span className="font-medium text-neutral-700 mr-2">
      {info}
    </span>
  );
});

// Add display name for debugging
VehicleInfo.displayName = 'VehicleInfo';

// Create a memoized OrderCard component to prevent re-renders when parent components change
function OrderCard({ 
  order, 
  showViewDetails = false, 
  onViewDetails, 
  actions,
  className = "" 
}: OrderCardProps) {
  // Memoize the view details handler
  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  }, [onViewDetails, order.id]);
  
  // Format a date string for display - memoized to prevent recreation
  const formattedDate = useMemo(() => {
    if (!order.createdAt) return '';
    return formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  }, [order.createdAt]);
  
  return (
    <Card className={`mb-4 ${className}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-neutral-800">Order #{order.id}</h3>
            <p className="text-xs text-neutral-500">
              {formattedDate}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        
        <div className="flex items-center text-sm mb-3">
          <VehicleInfo vehicle={order.vehicle} />
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

// Implement a custom arePropsEqual function to determine when to re-render
function arePropsEqual(prevProps: OrderCardProps, nextProps: OrderCardProps) {
  // Compare critical props to determine if a re-render is needed
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.totalPrice === nextProps.order.totalPrice &&
    prevProps.order.amount === nextProps.order.amount &&
    prevProps.order.fuelType === nextProps.order.fuelType &&
    prevProps.showViewDetails === nextProps.showViewDetails &&
    prevProps.className === nextProps.className
  );
}

// Export the memoized component with custom comparison function
export default memo(OrderCard, arePropsEqual);
