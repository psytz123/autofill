import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { getFuelTypeDisplayName } from "@/lib/fuelUtils";
import { formatPrice } from "@/lib/fuelUtils";
import { ReactNode, memo, useCallback, useMemo, useState } from "react";
import { ChevronDown, MapPin, Clock, MessageSquare, Car } from "lucide-react";

interface OrderCardProps {
  order: Order;
  showViewDetails?: boolean;
  onViewDetails?: (orderId: number) => void;
  actions?: ReactNode;
  className?: string;
}

// Status badge configuration - defined outside component to prevent recreation
const STATUS_CONFIG: Record<OrderStatus, { className: string; label: string }> = {
  [OrderStatus.COMPLETED]: { className: "bg-success text-white", label: "Completed" },
  [OrderStatus.IN_PROGRESS]: { className: "bg-secondary text-white", label: "In Progress" },
  [OrderStatus.CANCELLED]: { className: "bg-destructive text-white", label: "Cancelled" },
  [OrderStatus.CONFIRMED]: { className: "bg-primary text-white", label: "Confirmed" },
};

// Memoized status badge component to prevent unnecessary re-renders
const StatusBadge = memo(({ status }: { status: OrderStatus }) => {
  const config = STATUS_CONFIG[status] || { className: "bg-muted text-muted-foreground", label: "Unknown" };
  return <Badge className={config.className}>{config.label}</Badge>;
});

// Add display name for debugging
StatusBadge.displayName = "StatusBadge";

// Memoized vehicle info component
const VehicleInfo = memo(({ vehicle }: { vehicle: any }) => {
  const info = vehicle
    ? `${vehicle.make} ${vehicle.model} (${vehicle.year})`
    : "No vehicle information";

  return <span className="font-medium text-neutral-700 mr-2">{info}</span>;
});

// Add display name for debugging
VehicleInfo.displayName = "VehicleInfo";

/**
 * OrderCard Component
 * 
 * A card that displays order information with an expandable details section
 */
function OrderCard({
  order,
  showViewDetails = false,
  onViewDetails,
  actions,
  className = "",
}: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Memoize the view details handler
  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  }, [onViewDetails, order.id]);

  // Format a date string for display - memoized to prevent recreation
  const formattedDate = useMemo(() => {
    if (!order.createdAt) return "";
    return formatDistanceToNow(new Date(order.createdAt), { addSuffix: true });
  }, [order.createdAt]);

  // Toggle expanded state
  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => !prev);
  }, []);

  // Format price with dollar sign
  const formattedPrice = useMemo(() => {
    return typeof order.totalPrice === 'number' ? 
      `$${(order.totalPrice / 100).toFixed(2)}` : 
      `$${order.totalPrice}`;
  }, [order.totalPrice]);

  return (
    <Card className={`mb-4 ${className} overflow-hidden`}>
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-neutral-800">
                Order #{order.id}
              </h3>
              <p className="text-xs text-neutral-500">{formattedDate}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="flex items-center text-sm mb-2">
            <VehicleInfo vehicle={order.vehicle} />
            <span className="text-neutral-500">
              • {getFuelTypeDisplayName(order.fuelType)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">{order.amount} gallons</span>
            <span className="font-medium">{formattedPrice}</span>
          </div>
        </div>
        
        {/* Divider with Chevron */}
        <div 
          className="flex items-center justify-center py-2 border-t border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
          onClick={toggleExpanded}
        >
          <ChevronDown 
            className={`h-5 w-5 text-neutral-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} 
          />
        </div>
        
        {/* Expanded Details Section */}
        {expanded && (
          <div className="bg-neutral-50 p-4 border-t border-neutral-100">
            <div className="space-y-3">
              {order.location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-neutral-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Delivery Location</p>
                    <p className="text-xs text-neutral-600 break-words">
                      {order.location.name && <span className="font-medium">{order.location.name} - </span>}
                      {order.location.address}
                    </p>
                  </div>
                </div>
              )}
              
              {order.vehicle && (
                <div className="flex items-start">
                  <Car className="h-4 w-4 text-neutral-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Vehicle</p>
                    <p className="text-xs text-neutral-600">
                      {order.vehicle.make} {order.vehicle.model} ({order.vehicle.year})
                      {order.vehicle.licensePlate && ` • ${order.vehicle.licensePlate}`}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <Clock className="h-4 w-4 text-neutral-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Order Status</p>
                  <p className="text-xs text-neutral-600">
                    {STATUS_CONFIG[order.status]?.label || order.status}
                    {order.updatedAt && ` • Last updated ${formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })}`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            {showViewDetails && (
              <div className="mt-4">
                {onViewDetails ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleViewDetails}
                  >
                    View Order Details
                  </Button>
                ) : (
                  <Link href={`/orders/${order.id}`} className="w-full block">
                    <Button variant="outline" className="w-full">
                      View Order Details
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Custom actions if provided */}
        {actions && <div className="p-4 border-t border-neutral-100">{actions}</div>}
      </CardContent>
    </Card>
  );
}

// Implement a custom arePropsEqual function for memoization
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
