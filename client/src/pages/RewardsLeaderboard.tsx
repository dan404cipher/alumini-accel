import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Leaderboard as LeaderboardComponent } from "@/components/rewards/Leaderboard";

const RewardsLeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState("leaderboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <LeaderboardComponent />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RewardsLeaderboardPage;

