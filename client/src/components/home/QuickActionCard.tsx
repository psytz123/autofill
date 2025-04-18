import { Card, CardContent } from "@/components/ui/card";
import { DropletIcon, CarIcon } from "lucide-react";
import { Link } from "wouter";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: "fuel" | "vehicle";
  color: "primary" | "secondary";
  href: string;
}

export default function QuickActionCard({ 
  title, 
  description, 
  icon, 
  color,
  href
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className={`h-12 w-12 rounded-full bg-${color}-50 flex items-center justify-center mb-3`}>
            {icon === "fuel" ? (
              <DropletIcon className={`h-6 w-6 text-${color}`} />
            ) : (
              <CarIcon className={`h-6 w-6 text-${color}`} />
            )}
          </div>
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <p className="text-sm text-neutral-500">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
