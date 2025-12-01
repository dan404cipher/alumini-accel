import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { RewardsDashboard } from "@/components/rewards/RewardsDashboard";

const RewardsPage = () => {
  const [activeTab, setActiveTab] = useState("rewards");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-24 pb-16">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <RewardsDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RewardsPage;

