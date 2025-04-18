import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@shared/schema";
import { orderTrackingService } from "@/lib/orderTrackingService";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface OrderStatusLiveProps {
  order: Order;
}

export default function OrderStatusLive({ order }: OrderStatusLiveProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  useEffect(() => {
    if (user?.id && order.id) {
      // Set up WebSocket connection for status updates
      orderTrackingService.authenticate(user.id);
      
      orderTrackingService.on('statusUpdate', (data) => {
        console.log('Received order status update:', data);
        if (data.orderId === order.id) {
          setStatus(data.status as OrderStatus);
          setStatusUpdating(false);
        }
      });
      
      orderTrackingService.on('connected', () => {
        // Start tracking order when connected
        orderTrackingService.trackOrder(order.id);
      });
      
      orderTrackingService.connect();
      
      return () => {
        orderTrackingService.off('statusUpdate');
        orderTrackingService.off('connected');
      };
    }
  }, [user, order.id]);
  
  // Update status when prop changes
  useEffect(() => {
    if (order.status !== status) {
      setStatusUpdating(true);
      setStatus(order.status);
    }
  }, [order.status]);
  
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return <Badge className="bg-success text-white">Completed</Badge>;
      case OrderStatus.IN_PROGRESS:
        return <Badge className="bg-secondary text-white">In Progress</Badge>;
      case OrderStatus.CANCELLED:
        return <Badge className="bg-destructive text-white">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  return (
    <div className="relative inline-flex items-center">
      {statusUpdating && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
      )}
      {getStatusBadge(status)}
    </div>
  );
}