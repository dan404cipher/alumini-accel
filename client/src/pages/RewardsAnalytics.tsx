import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { RewardsAnalytics as RewardsAnalyticsComponent } from "@/components/rewards/RewardsAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const RewardsAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const { user } = useAuth();

  const isAdmin = user
    ? ["super_admin", "college_admin", "hod", "staff"].includes(user.role)
    : false;

  if (!isAdmin) {
    return <Navigate to="/rewards" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <RewardsAnalyticsComponent />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RewardsAnalyticsPage;

