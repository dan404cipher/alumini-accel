import React, { useState, useEffect } from "react";
import { Plus, Filter, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDonationManagement } from "./hooks/useDonationManagement";
import DonationCard from "./components/DonationCard";
import EnhancedDonationTable from "./components/EnhancedDonationTable";
import CampaignModal from "./modals/CampaignModal";
import EnhancedDonationModal from "./modals/EnhancedDonationModal";
import ShareModal from "./modals/ShareModal";
import CampaignDetailsModal from "./modals/CampaignDetailsModal";
import { formatINR } from "./utils";
import { useAuth } from "@/contexts/AuthContext";

const DonationManagementSystem: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const {
    campaigns,
    userDonations,
    donationCampaignsArr,
    categoryFilter,
    menuOpenForCampaign,
    activeTab,
    loading,
    error,
    createModalOpen,
    donationModalOpen,
    donationModalCampaign,
    donationModalCampaignIndex,
    editModalOpen,
    selectedCampaignForEdit,
    shareModalOpen,
    selectedCampaignForShare,
    campaignDetailsModalOpen,
    selectedCampaignForDetails,
    filteredActive,
    totalDonated,
    completedDonations,
    setCategoryFilter,
    setMenuOpenForCampaign,
    setActiveTab,
    setCreateModalOpen,
    setDonationModalOpen,
    setEditModalOpen,
    setShareModalOpen,
    setCampaignDetailsModalOpen,
    handleOpenDonationModal,
    handleEditCampaign,
    handleDeleteCampaign,
    handleShareCampaign,
    handleViewCampaignDetails,
    resetDonationData,
    addTestDonation,
  } = useDonationManagement();

  // Handle viewCampaign URL parameter
  useEffect(() => {
    const viewCampaign = searchParams.get("viewCampaign");
    if (viewCampaign && campaigns.length > 0) {
      const campaign = campaigns.find(
        (c) =>
          c._id === viewCampaign || c.title === decodeURIComponent(viewCampaign)
      );
      if (campaign) {
        handleViewCampaignDetails(campaign);
        // Remove the parameter from URL after opening modal
        setSearchParams({});
      }
    }
  }, [searchParams, campaigns, handleViewCampaignDetails, setSearchParams]);

  return (
    <div className="flex gap-6 h-screen w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"}
        w-80 flex-shrink-0 bg-background
      `}
      >
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Donations
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Find campaigns to support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Navigation */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Navigation</label>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab("campaigns")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === "campaigns"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Campaigns
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === "history"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Donation History
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter Categories</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Scholarships & Student Support">
                    Scholarships
                  </option>
                  <option value="Research & Academics">Research</option>
                  <option value="Sports, Arts & Culture">
                    Sports & Culture
                  </option>
                  <option value="Community & Social Impact">Community</option>
                </select>
              </div>

              {/* Create Campaign Button - Only for Admin Roles */}
              {user?.role &&
                ["college_admin", "hod", "staff", "super_admin"].includes(
                  user.role
                ) && (
                  <Button
                    onClick={() => setCreateModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4 px-2 sm:py-6 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="break-words">Donation Management</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl">
                  Manage donations and fundraising campaigns
                </p>
              </div>
              <div className="flex-shrink-0 lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters & Menu
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-green-50 rounded-lg">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Total Donations
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      ₹{formatINR(totalDonated)}
                    </p>
                    <div className="flex gap-2">
                      {totalDonated > 1000000 && (
                        <button
                          onClick={resetDonationData}
                          className="text-xs text-red-600 hover:text-red-700 underline"
                          title="Reset corrupted data"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {completedDonations} successful donations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Active Campaigns
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {campaigns.length}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {filteredActive.length} visible
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 sm:p-4 bg-purple-50 rounded-lg">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Donation History
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {userDonations.length}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {completedDonations} completed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Loading campaigns and donations...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="text-red-600 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Data
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <p className="text-sm text-gray-500">
                  Using fallback data. Please check your connection and try
                  refreshing the page.
                </p>
              </div>
            </div>
          )}

          {/* Main Content based on active tab */}
          {!loading && !error && activeTab === "campaigns" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Active Campaigns
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {filteredActive.length} of {campaigns.length}{" "}
                  campaigns
                </div>
              </div>

              {filteredActive.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredActive.map((campaign, index) => (
                    <DonationCard
                      key={`card-${campaign.title}-${index}`}
                      category={campaign.category}
                      status={
                        new Date(campaign.endDate) < new Date()
                          ? "Ended"
                          : "Active"
                      }
                      imageUrl={campaign.imageUrl}
                      title={campaign.title}
                      description={campaign.description}
                      raisedAmount={campaign.raised}
                      targetAmount={Number(campaign.amount)}
                      donorsCount={campaign.donors}
                      by="Alumni Admin"
                      endDateLabel={`Ends ${new Date(
                        campaign.endDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}`}
                      onDonate={() => handleOpenDonationModal(campaign, index)}
                      onShare={() => handleShareCampaign(campaign)}
                      onEdit={
                        user?.role &&
                        [
                          "college_admin",
                          "hod",
                          "staff",
                          "super_admin",
                        ].includes(user.role)
                          ? () => handleEditCampaign(campaign, index)
                          : undefined
                      }
                      onDelete={
                        user?.role &&
                        [
                          "college_admin",
                          "hod",
                          "staff",
                          "super_admin",
                        ].includes(user.role)
                          ? () => handleDeleteCampaign(index)
                          : undefined
                      }
                      onViewDetails={() => handleViewCampaignDetails(campaign)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-600">No campaigns found</div>
                </div>
              )}
            </div>
          )}

          {!loading && !error && activeTab === "history" && (
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Donation History
                </h2>
                <EnhancedDonationTable
                  items={userDonations}
                  campaigns={donationCampaignsArr}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Campaign Creation Modal - Only for Admin Roles */}
      {user?.role &&
        ["college_admin", "hod", "staff", "super_admin"].includes(
          user.role
        ) && (
          <CampaignModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
          />
        )}

      {/* Campaign Edit Modal - Only for Admin Roles */}
      {user?.role &&
        ["college_admin", "hod", "staff", "super_admin"].includes(
          user.role
        ) && (
          <CampaignModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            editData={selectedCampaignForEdit}
            editIndex={selectedCampaignForEdit?.editIndex ?? null}
          />
        )}

      <EnhancedDonationModal
        open={donationModalOpen}
        onClose={() => setDonationModalOpen(false)}
        campaign={donationModalCampaign}
        campaignIndex={donationModalCampaignIndex}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        campaign={selectedCampaignForShare}
      />

      <CampaignDetailsModal
        open={campaignDetailsModalOpen}
        onClose={() => setCampaignDetailsModalOpen(false)}
        campaign={selectedCampaignForDetails}
        onDonate={() => {
          setCampaignDetailsModalOpen(false);
          handleOpenDonationModal(selectedCampaignForDetails, 0);
        }}
        onShare={() => {
          setCampaignDetailsModalOpen(false);
          handleShareCampaign(selectedCampaignForDetails);
        }}
      />
    </div>
  );
};

export default DonationManagementSystem;
