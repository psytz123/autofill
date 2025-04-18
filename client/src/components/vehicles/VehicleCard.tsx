import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Edit, Check } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Vehicle, FuelType } from "@shared/schema";

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  showActions?: boolean;
  actionButtons?: React.ReactNode;
}

export default function VehicleCard({
  vehicle,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  showActions = false,
  actionButtons
}: VehicleCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const getFuelTypeLabel = (fuelType: string) => {
    const typeMap: Record<string, string> = {
      "REGULAR_UNLEADED": "Regular",
      "PREMIUM_UNLEADED": "Premium",
      "DIESEL": "Diesel"
    };
    return typeMap[fuelType] || fuelType.replace('_', ' ');
  };
  
  const getFuelTypeBackground = (fuelType: string) => {
    const bgMap: Record<string, string> = {
      "REGULAR_UNLEADED": "bg-green-100 text-green-700",
      "PREMIUM_UNLEADED": "bg-amber-100 text-amber-700",
      "DIESEL": "bg-red-100 text-red-700"
    };
    return bgMap[fuelType] || "bg-neutral-100 text-neutral-700";
  };
  
  return (
    <Card 
      className={`mb-3 overflow-hidden cursor-pointer transition-all ${isSelected ? 'border-orange-500' : 'border-gray-200'}`}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        {isSelected && (
          <div className="w-3 bg-orange-500 absolute top-0 bottom-0 left-0"></div>
        )}
        <div className={`flex items-center p-4 ${isSelected ? 'pl-6' : ''}`}>
          <div className="flex-grow">
            <div className="flex justify-between mb-2">
              <h3 className="font-bold text-xl text-neutral-800">{vehicle.make} {vehicle.model}</h3>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit();
                  }}
                  className="p-1 h-auto text-neutral-500"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="text-sm text-neutral-600 mb-1">Tag: {vehicle.licensePlate}</div>
            <div className="flex items-center gap-4 mt-2">
              <div className={`rounded-md py-1 px-3 text-sm font-medium ${getFuelTypeBackground(vehicle.fuelType)}`}>
                {getFuelTypeLabel(vehicle.fuelType)}
              </div>
              <div className="font-medium">$4.06</div>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto ml-auto text-neutral-500"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {onSelect && (
            <div 
              className="ml-4" 
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect();
              }}
            >
              {isSelected ? (
                <div className="w-6 h-6 rounded-sm bg-orange-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              ) : (
                <Checkbox className="h-6 w-6 rounded-sm" />
              )}
            </div>
          )}
        </div>
        
        {showActions && actionButtons && (
          <div className="border-t px-4 py-2 bg-neutral-50">
            {actionButtons}
          </div>
        )}
        
        {onDelete && (
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="hidden"
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
      </CardContent>
    </Card>
  );
}
