import { PageHeader } from "@/components/ui/page-header";
import { CoinsIcon } from "lucide-react";
import { PointsDisplay } from "@/components/rewards/PointsDisplay";
import { RewardsCard } from "@/components/rewards/RewardsCard";

export default function RewardsPage() {
  return (
    <div className="container pb-24 pt-6 max-w-3xl mx-auto">
      <PageHeader
        title="Rewards & Points"
        description="Earn points with every fuel purchase and redeem for discounts"
        icon={<CoinsIcon className="h-6 w-6" />}
      />

      <div className="mt-6 space-y-6">
        <PointsDisplay />
        <RewardsCard />
      </div>
    </div>
  );
}