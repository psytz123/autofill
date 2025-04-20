import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PointsTransaction, PointsReward } from "@shared/schema";

export function usePoints() {
  const { toast } = useToast();

  // Get user's current points balance
  const { 
    data: points, 
    isLoading: isLoadingPoints 
  } = useQuery({
    queryKey: ["/api/points/balance"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points/balance");
      const data = await res.json();
      return data.points;
    }
  });

  // Get user's points transactions
  const { 
    data: transactions = [],
    isLoading: isLoadingTransactions
  } = useQuery<PointsTransaction[]>({
    queryKey: ["/api/points/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points/transactions");
      return res.json();
    }
  });

  // Get available rewards
  const {
    data: rewards = [],
    isLoading: isLoadingRewards
  } = useQuery<PointsReward[]>({
    queryKey: ["/api/points/rewards"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points/rewards");
      return res.json();
    }
  });

  // Redeem a reward
  const {
    mutate: redeemReward,
    isPending: isRedeeming
  } = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("POST", `/api/points/redeem/${rewardId}`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the points balance and transactions after redeeming
      queryClient.invalidateQueries({
        queryKey: ["/api/points/balance"]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/points/transactions"]
      });
      
      toast({
        title: "Reward redeemed",
        description: "Your points have been used to redeem this reward",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to redeem reward",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    points,
    isLoadingPoints,
    transactions,
    isLoadingTransactions,
    rewards,
    isLoadingRewards,
    redeemReward,
    isRedeeming
  };
}