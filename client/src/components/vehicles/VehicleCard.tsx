import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface VehicleCardProps {
  vehicle: any;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  showActions?: boolean;
}

export default function VehicleCard({
  vehicle,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = false
}: VehicleCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <Card className={`mb-4 ${isSelected ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
          <span className="text-sm text-neutral-500">{vehicle.year}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-neutral-50 rounded p-2">
            <p className="text-xs text-neutral-500">License Plate</p>
            <p className="font-medium">{vehicle.licensePlate}</p>
          </div>
          <div className="bg-neutral-50 rounded p-2">
            <p className="text-xs text-neutral-500">Fuel Type</p>
            <p className="font-medium">{vehicle.fuelType.replace('_', ' ')}</p>
          </div>
        </div>
        
        {showActions && (
          <div className="flex justify-end space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="px-3 py-1 text-sm text-neutral-500"
              >
                Edit
              </Button>
            )}
            
            {onDelete && (
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 py-1 text-sm text-destructive border-destructive"
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the vehicle from your account.
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
            )}
            
            {onSelect && (
              <Button
                size="sm"
                onClick={onSelect}
                className="px-3 py-1 text-sm text-white"
                disabled={isSelected}
              >
                {isSelected ? "Selected" : "Select"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
