import { usePoints } from "@/hooks/use-points";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GiftIcon, CoinsIcon, TrendingUpIcon, StarIcon } from "lucide-react";
import { PointsTransactionType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

// Helper function to get transaction type display information
const getTransactionTypeInfo = (type: PointsTransactionType) => {
  switch (type) {
    case "EARN_PURCHASE":
      return { 
        label: "Purchase", 
        icon: <CoinsIcon className="h-4 w-4" />, 
        color: "bg-green-500" 
      };
    case "EARN_MILESTONE":
      return { 
        label: "Milestone", 
        icon: <TrendingUpIcon className="h-4 w-4" />, 
        color: "bg-blue-500" 
      };
    case "EARN_REFERRAL":
      return { 
        label: "Referral", 
        icon: <StarIcon className="h-4 w-4" />, 
        color: "bg-purple-500" 
      };
    case "EARN_SIGNUP":
      return { 
        label: "Sign Up", 
        icon: <StarIcon className="h-4 w-4" />, 
        color: "bg-teal-500" 
      };
    case "REDEEM_DISCOUNT":
    case "REDEEM_FREE_DELIVERY":
    case "REDEEM_FUEL_DISCOUNT":
      return { 
        label: "Redemption", 
        icon: <GiftIcon className="h-4 w-4" />, 
        color: "bg-amber-500" 
      };
    default:
      return { 
        label: "Transaction", 
        icon: <CoinIcon className="h-4 w-4" />, 
        color: "bg-gray-500" 
      };
  }
};

export function PointsDisplay() {
  const { 
    points, 
    isLoadingPoints,
    transactions, 
    isLoadingTransactions 
  } = usePoints();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Your Points</span>
          {isLoadingPoints ? (
            <Skeleton className="w-20 h-8" />
          ) : (
            <Badge variant="default" className="text-lg px-3 py-1">
              {points} pts
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Earn points with every purchase: 10 points per gallon for Basic,
          11 points per gallon for Premium, and 12 points per gallon for Unlimited subscribers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="font-medium text-sm mb-2">Transaction History</h3>
        {isLoadingTransactions ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No transactions yet.
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction) => {
              const typeInfo = getTransactionTypeInfo(transaction.type);
              return (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${typeInfo.color} text-white`}>
                      {typeInfo.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={transaction.amount > 0 ? "default" : "outline"}
                    className={transaction.amount > 0 ? "bg-green-500" : ""}
                  >
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                  </Badge>
                </div>
              );
            })}
            {transactions.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Showing 5 most recent transactions
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}