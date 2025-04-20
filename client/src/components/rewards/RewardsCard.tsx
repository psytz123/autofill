import { usePoints } from "@/hooks/use-points";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  GiftIcon, 
  TagIcon, 
  TruckIcon, 
  GasPumpIcon, 
  LoaderIcon 
} from "lucide-react";
import { PointsTransactionType } from "@shared/schema";

// Helper function to get reward icon
const getRewardIcon = (type: PointsTransactionType) => {
  switch (type) {
    case "REDEEM_DISCOUNT":
      return <TagIcon className="h-4 w-4" />;
    case "REDEEM_FREE_DELIVERY":
      return <TruckIcon className="h-4 w-4" />;
    case "REDEEM_FUEL_DISCOUNT":
      return <GasPumpIcon className="h-4 w-4" />;
    default:
      return <GiftIcon className="h-4 w-4" />;
  }
};

export function RewardsCard() {
  const {
    points,
    isLoadingPoints,
    rewards,
    isLoadingRewards,
    redeemReward,
    isRedeeming
  } = usePoints();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GiftIcon className="h-5 w-5" />
          Available Rewards
        </CardTitle>
        <CardDescription>
          Redeem your points for these rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingRewards ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No rewards available at this time.
          </p>
        ) : (
          <div className="space-y-4">
            {rewards.map((reward) => {
              const icon = getRewardIcon(reward.type);
              const canRedeem = !isLoadingPoints && points >= reward.pointsCost;
              
              return (
                <div 
                  key={reward.id} 
                  className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      <Badge variant="outline" className="mt-2">
                        {reward.pointsCost} points
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant={canRedeem ? "default" : "outline"}
                    size="sm"
                    disabled={!canRedeem || isRedeeming}
                    onClick={() => redeemReward(reward.id)}
                    className="whitespace-nowrap"
                  >
                    {isRedeeming && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
                    {canRedeem ? "Redeem Reward" : `Need ${reward.pointsCost - (points || 0)} more points`}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}