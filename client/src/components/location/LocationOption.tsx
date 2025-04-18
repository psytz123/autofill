import { Card } from "@/components/ui/card";
import { MapPin, Home, Briefcase, Check } from "lucide-react";
import { LocationType } from "@shared/schema";

interface LocationOptionProps {
  location: {
    id: string;
    name: string;
    address: string;
    type: "home" | "work" | "other";
  };
  onSelect: () => void;
  isSelected?: boolean;
}

export default function LocationOption({ location, onSelect, isSelected = false }: LocationOptionProps) {
  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case LocationType.HOME:
        return <Home className="h-5 w-5 text-primary" />;
      case LocationType.WORK:
        return <Briefcase className="h-5 w-5 text-primary" />;
      case LocationType.OTHER:
        return <MapPin className="h-5 w-5 text-primary" />;
      default:
        return <MapPin className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card 
      className={`mb-2 cursor-pointer hover:bg-neutral-50 transition ${isSelected ? 'border-primary' : ''}`}
      onClick={onSelect}
    >
      <div className="p-3 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {getLocationIcon(location.type as LocationType)}
        </div>
        <div className="flex-1">
          <p className="font-medium text-neutral-800">{location.name}</p>
          <p className="text-sm text-neutral-500 truncate">{location.address}</p>
        </div>
        {isSelected && <Check className="h-5 w-5 text-primary" />}
      </div>
    </Card>
  );
}