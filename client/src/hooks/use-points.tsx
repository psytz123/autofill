import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PointsTransaction, PointsReward } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePoints() {
  const { toast } = useToast();

  // Get user's current points balance
  const pointsQuery = useQuery({
    queryKey: ["/api/points"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points");
      const data = await res.json();
      return data.points || 0;
    },
  });

  // Get user's points transaction history
  const transactionsQuery = useQuery({
    queryKey: ["/api/points/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/points/transactions");
      return res.json() as Promise<PointsTransaction[]>;
    },
  });

  // Get available rewards
  const rewardsQuery = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rewards");
      return res.json() as Promise<PointsReward[]>;
    },
  });

  // Redeem a reward
  const redeemMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest(
        "POST", 
        `/api/rewards/redeem/${rewardId}`,
        {}
      );
      return res.json() as Promise<PointsTransaction>;
    },
    onSuccess: () => {
      // Invalidate queries to update data
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points/transactions"] });
      
      toast({
        title: "Reward Redeemed",
        description: "Your reward has been successfully redeemed",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Redeem Reward",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    points: pointsQuery.data || 0,
    isLoadingPoints: pointsQuery.isLoading,
    
    transactions: transactionsQuery.data || [],
    isLoadingTransactions: transactionsQuery.isLoading,
    
    rewards: rewardsQuery.data || [],
    isLoadingRewards: rewardsQuery.isLoading,
    
    redeemReward: redeemMutation.mutate,
    isRedeeming: redeemMutation.isPending,
  };
}