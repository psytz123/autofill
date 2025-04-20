import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { getFuelTypeDisplayName } from "@/lib/fuelUtils";
import { formatPrice } from "@/lib/fuelUtils";
import { ReactNode, memo, useCallback, useMemo, useState } from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";

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
  CANCELLED: { className: "bg-destructive text-white", label: "Cancelled" },
};

// Memoized status badge component to prevent unnecessary re-renders
const StatusBadge = memo(({ status }: { status: OrderStatus }) => {
  const config = STATUS_CONFIG[status] || { className: "", label: "Unknown" };
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

// Create a memoized OrderCard component to prevent re-renders when parent components change
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
  const toggleExpanded = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  // Format delivery address if available
  const deliveryAddress = useMemo(() => {
    return order.location?.address || "No delivery address";
  }, [order.location]);

  // Format delivery date if available
  const formattedDeliveryDate = useMemo(() => {
    if (!order.deliveryDate) return "Delivery date not specified";
    return new Date(order.deliveryDate).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, [order.deliveryDate]);

  return (
    <Card className={`mb-4 ${className}`}>
      <CardContent className="p-4">
        <div 
          className="flex justify-between items-start mb-3 cursor-pointer" 
          onClick={toggleExpanded}
        >
          <div>
            <h3 className="font-semibold text-neutral-800">
              Order #{order.id}
            </h3>
            <p className="text-xs text-neutral-500">{formattedDate}</p>
          </div>
          <div className="flex items-center">
            <StatusBadge status={order.status} />
            <ChevronDown className={`h-5 w-5 text-neutral-500 ml-2 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        <div className="flex items-center text-sm mb-3">
          <VehicleInfo vehicle={order.vehicle} />
          <span className="text-neutral-500">
            • {getFuelTypeDisplayName(order.fuelType)}
          </span>
        </div>

        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-500">{order.amount} gallons</span>
          <span className="font-medium">${order.totalPrice}</span>
        </div>

        {/* Expanded details section */}
        {expanded && (
          <div className="mt-2 pt-3 border-t border-neutral-100">
            <div className="space-y-2">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-neutral-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Delivery Location</p>
                  <p className="text-xs text-neutral-600">{deliveryAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-500 mr-2 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <p className="text-sm font-medium">Delivery Time</p>
                  <p className="text-xs text-neutral-600">
                    {formattedDeliveryDate}
                    {order.deliveryTimeSlot ? ` • ${order.deliveryTimeSlot}` : ''}
                  </p>
                </div>
              </div>
              
              {order.notes && (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-500 mr-2 mt-0.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-xs text-neutral-600">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom actions or default view details button */}
        {actions ? (
          <div className="mt-3">{actions}</div>
        ) : (
          showViewDetails &&
          (onViewDetails ? (
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
          ) : (
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" className="w-full mt-3">
                View Details
              </Button>
            </Link>
          ))
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
