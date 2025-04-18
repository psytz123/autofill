import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { SubscriptionPlan } from "@shared/schema";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isActive?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

export default function PlanCard({ plan, isActive = false, onSelect }: PlanCardProps) {
  const formattedPrice = (plan.price / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  return (
    <Card className={`flex flex-col h-full ${isActive ? 'border-primary' : ''}`}>
      <CardHeader className="flex flex-col gap-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
        <div className="text-3xl font-bold">
          {formattedPrice}<span className="text-sm font-normal text-muted-foreground">/month</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {(typeof plan.features === 'string' 
            ? JSON.parse(plan.features) 
            : plan.features).map((feature: string, index: number) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isActive ? "outline" : "default"}
          onClick={() => onSelect(plan)}
        >
          {isActive ? 'Current Plan' : 'Subscribe'}
        </Button>
      </CardFooter>
    </Card>
  );
}