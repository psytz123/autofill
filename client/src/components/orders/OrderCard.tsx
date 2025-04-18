import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Order, OrderStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface OrderCardProps {
  order: Order;
  showViewDetails?: boolean;
}

export default function OrderCard({ order, showViewDetails = false }: OrderCardProps) {
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-success text-white">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-secondary text-white">In Progress</Badge>;
      case "CANCELLED":
        return <Badge className="bg-destructive text-white">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} - ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  return (
    <Card className="mb-4">
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
            {order.vehicle?.make} {order.vehicle?.model} ({order.vehicle?.year})
          </span>
          <span className="text-neutral-500">• {order.fuelType.replace('_', ' ')}</span>
        </div>
        
        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-500">{order.amount} gallons</span>
          <span className="font-medium">${order.totalPrice}</span>
        </div>
        
        {showViewDetails && (
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
