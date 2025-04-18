import { Card, CardContent } from "@/components/ui/card";
import { Home, Briefcase, MapPin } from "lucide-react";

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
  const getIcon = () => {
    switch (location.type) {
      case "home":
        return <Home className="h-4 w-4 text-neutral-500" />;
      case "work":
        return <Briefcase className="h-4 w-4 text-neutral-500" />;
      default:
        return <MapPin className="h-4 w-4 text-neutral-500" />;
    }
  };
  
  return (
    <Card 
      className={`mb-2 cursor-pointer hover:border-primary transition-colors ${isSelected ? 'border-primary' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-3 flex items-center">
        <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center mr-3">
          {getIcon()}
        </div>
        <div>
          <p className="font-medium text-neutral-700">{location.name}</p>
          <p className="text-sm text-neutral-500">{location.address}</p>
        </div>
      </CardContent>
    </Card>
  );
}
