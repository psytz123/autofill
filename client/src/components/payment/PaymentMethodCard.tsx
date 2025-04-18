import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentMethod } from "@shared/schema";
import { CreditCard, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onDelete: (id: number) => void;
}

export default function PaymentMethodCard({ paymentMethod, onDelete }: PaymentMethodCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  // Get card logo based on type
  const getCardLogo = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return "bg-blue-600 text-white";
      case 'mastercard':
        return "bg-orange-600 text-white";
      case 'amex':
        return "bg-indigo-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };
  
  const cardLogoClass = getCardLogo(paymentMethod.type);
  
  const handleDelete = () => {
    onDelete(paymentMethod.id);
    setIsConfirmingDelete(false);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center">
          <div className={`p-4 ${cardLogoClass}`}>
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="flex-1 p-4">
            <div className="text-sm font-medium capitalize">{paymentMethod.type}</div>
            <div className="text-sm text-muted-foreground">
              •••• •••• •••• {paymentMethod.last4}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Expires: {paymentMethod.expiry}
            </div>
          </div>
          <AlertDialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your payment method.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}