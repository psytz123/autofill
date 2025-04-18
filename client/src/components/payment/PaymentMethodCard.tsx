import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, CreditCard } from "lucide-react";
import { 
  FaCcVisa, 
  FaCcMastercard, 
  FaCcAmex, 
  FaCreditCard 
} from "react-icons/fa";

interface PaymentMethodCardProps {
  paymentMethod: any;
  onDelete: () => void;
  isDefault?: boolean;
}

export default function PaymentMethodCard({ 
  paymentMethod, 
  onDelete,
  isDefault = false
}: PaymentMethodCardProps) {
  const getCardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return <FaCcVisa className="h-6 w-6 text-blue-600" />;
      case 'mastercard':
        return <FaCcMastercard className="h-6 w-6 text-red-600" />;
      case 'amex':
      case 'american express':
        return <FaCcAmex className="h-6 w-6 text-blue-800" />;
      default:
        return <FaCreditCard className="h-6 w-6 text-neutral-600" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getCardIcon(paymentMethod.type)}
            <div>
              <p className="font-medium">
                •••• •••• •••• {paymentMethod.last4}
                {isDefault && (
                  <Badge variant="outline" className="ml-2 bg-primary/10">
                    Default
                  </Badge>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Expires {paymentMethod.expiry}
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDelete}
            aria-label="Delete payment method"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}