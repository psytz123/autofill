import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <Card className="border border-neutral-200 rounded-lg overflow-hidden">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded bg-neutral-100 flex items-center justify-center mr-3">
            <CreditCard className="h-6 w-6 text-neutral-500" />
          </div>
          <div>
            <p className="font-medium">
              {paymentMethod.type === 'visa' && <span className="text-blue-500 mr-1">Visa</span>}
              {paymentMethod.type === 'mastercard' && <span className="text-red-500 mr-1">MC</span>}
              {paymentMethod.type === 'amex' && <span className="text-blue-400 mr-1">Amex</span>}
              ending in {paymentMethod.last4}
            </p>
            <p className="text-sm text-neutral-500">Expires {paymentMethod.expiry}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          {isDefault && (
            <div className="mr-2">
              <span className="h-4 w-4 rounded-full bg-primary inline-block"></span>
            </div>
          )}
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this payment method from your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete();
                    setShowDeleteDialog(false);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
