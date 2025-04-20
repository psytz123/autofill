import { PageHeader } from "@/components/ui/page-header";
import { PointsDisplay } from "@/components/rewards/PointsDisplay";
import { RewardsCard } from "@/components/rewards/RewardsCard";
import { CoinsIcon } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="container py-6 space-y-6">
      <PageHeader 
        title="Rewards & Points" 
        description="Earn and redeem points for exclusive rewards"
        icon={<CoinsIcon className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PointsDisplay />
        <RewardsCard />
      </div>
    </div>
  );
}