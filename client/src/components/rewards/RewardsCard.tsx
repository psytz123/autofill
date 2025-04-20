import { usePoints } from "@/hooks/use-points";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  GiftIcon, 
  TruckIcon, 
  FuelIcon, 
  PercentIcon, 
  CoinsIcon 
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PointsTransactionType } from "@shared/schema";

const getRewardIcon = (type: PointsTransactionType) => {
  switch (type) {
    case "REDEEM_FREE_DELIVERY":
      return <TruckIcon className="h-5 w-5" />;
    case "REDEEM_FUEL_DISCOUNT":
      return <FuelIcon className="h-5 w-5" />;
    case "REDEEM_DISCOUNT":
      return <PercentIcon className="h-5 w-5" />;
    default:
      return <GiftIcon className="h-5 w-5" />;
  }
};

export function RewardsCard() {
  const { rewards, isLoadingRewards, redeemReward, isRedeeming, points } = usePoints();
  const { toast } = useToast();
  const [selectedReward, setSelectedReward] = useState<number | null>(null);

  const handleRedeem = (rewardId: number, pointsCost: number) => {
    if (!points || points < pointsCost) {
      toast({
        title: "Not enough points",
        description: `You need ${pointsCost} points to redeem this reward`,
        variant: "destructive",
      });
      return;
    }

    setSelectedReward(rewardId);
    redeemReward(rewardId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GiftIcon className="h-5 w-5" />
          Available Rewards
        </CardTitle>
        <CardDescription>
          Redeem your points for discounts and perks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingRewards ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-6">
            <GiftIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No rewards available at the moment</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rewards.filter(r => r.active).map((reward) => (
              <div 
                key={reward.id} 
                className="border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                      {getRewardIcon(reward.type)}
                    </div>
                    <h3 className="font-medium">{reward.name}</h3>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CoinsIcon className="h-3 w-3" />
                    {reward.pointsCost}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {reward.description}
                </p>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleRedeem(reward.id, reward.pointsCost)}
                  disabled={
                    isRedeeming || 
                    selectedReward === reward.id || 
                    !points || 
                    points < reward.pointsCost
                  }
                >
                  {isRedeeming && selectedReward === reward.id ? (
                    <span className="flex items-center gap-1">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Redeeming...
                    </span>
                  ) : (
                    points && points >= reward.pointsCost ? 'Redeem Reward' : 'Not Enough Points'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}