import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { RewardsAdminDashboard } from "@/components/rewards/RewardsAdminDashboard";
import { StaffVerificationDashboard } from "@/components/rewards/StaffVerificationDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Award, CheckCircle2 } from "lucide-react";

const AdminRewardsPage = () => {
  const [activeTab, setActiveTab] = useState("rewards");
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
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">
              Rewards Studio
            </h1>
            <p className="text-gray-600 mt-2">
              Design reward templates, configure tasks, and launch new alumni
              incentives in minutes.
            </p>
          </div>

          <Tabs defaultValue="rewards" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="rewards" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Manage Rewards
              </TabsTrigger>
              <TabsTrigger value="verifications" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Task Verifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rewards">
              <RewardsAdminDashboard />
            </TabsContent>

            <TabsContent value="verifications">
              <StaffVerificationDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminRewardsPage;

