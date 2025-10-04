import React, { useState } from "react";
import { Plus, Filter, X } from "lucide-react";
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
import DonationTable from "./components/DonationTable";
import CampaignModal from "./modals/CampaignModal";
import DonationModal from "./modals/DonationModal";
import { formatINR } from "./utils";

const DonationManagementSystem: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    campaigns,
    userDonations,
    donationCampaignsArr,
    categoryFilter,
    menuOpenForCampaign,
    activeTab,
    createModalOpen,
    donationModalOpen,
    donationModalCampaign,
    donationModalCampaignIndex,
    editModalOpen,
    selectedCampaignForEdit,
    filteredActive,
    totalDonated,
    completedDonations,
    setCategoryFilter,
    setMenuOpenForCampaign,
    setActiveTab,
    setCreateModalOpen,
    setDonationModalOpen,
    setEditModalOpen,
    handleOpenDonationModal,
    handleEditCampaign,
    handleDeleteCampaign,
  } = useDonationManagement();

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
                  <button
                    onClick={() => setActiveTab("impact")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === "impact"
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Impact Dashboard
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

              {/* Create Campaign Button */}
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
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
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₹{formatINR(totalDonated)}
                  </p>
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

          {/* Main Content based on active tab */}
          {activeTab === "campaigns" && (
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
                      onEdit={() => handleEditCampaign(campaign, index)}
                      onDelete={() => handleDeleteCampaign(index)}
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

          {activeTab === "history" && (
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Donation History
                </h2>
                <DonationTable donations={userDonations} />
              </div>
            </div>
          )}

          {activeTab === "impact" && (
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Impact Dashboard
                </h2>
                <div className="text-center py-12">
                  <div className="text-gray-600">
                    Impact visualization coming soon
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CampaignModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <CampaignModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editData={selectedCampaignForEdit}
        editIndex={selectedCampaignForEdit?.editIndex ?? null}
      />

      <DonationModal
        open={donationModalOpen}
        onClose={() => setDonationModalOpen(false)}
        campaign={donationModalCampaign}
        campaignIndex={donationModalCampaignIndex}
      />
    </div>
  );
};

export default DonationManagementSystem;
