import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { campaignAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  Target,
  Users,
  Heart,
  Share2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import EnhancedDonationModal from "@/components/donation-system/modals/EnhancedDonationModal";
import ShareModal from "@/components/donation-system/modals/ShareModal";
import { Campaign } from "@/components/donation-system/types";

// Type for API campaign response
interface ApiCampaign {
  _id: string;
  title: string;
  description: string;
  category: string;
  targetAmount?: number;
  amount?: number | string;
  raised?: number;
  currentAmount?: number;
  donors?: number;
  statistics?: {
    totalDonors?: number;
  };
  status?: string;
  startDate?: string;
  endDate: string;
  imageUrl?: string;
  images?: string[];
  daysRemaining?: number;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  location?: string;
}

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("donations");

  const {
    data: campaignData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => campaignAPI.getCampaignById(id!),
    enabled: !!id,
  });

  const campaign = campaignData?.data as ApiCampaign | undefined;

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgressPercentage = (raised: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((raised / target) * 100));
  };

  // Convert API campaign to Campaign type for modals
  const convertToCampaignType = (apiCampaign: ApiCampaign): Campaign => {
    return {
      _id: apiCampaign._id,
      title: apiCampaign.title,
      description: apiCampaign.description,
      category: apiCampaign.category,
      amount: String(apiCampaign.targetAmount || apiCampaign.amount || 0),
      endDate: apiCampaign.endDate,
      imageUrl: apiCampaign.imageUrl || apiCampaign.images?.[0] || "",
      raised: apiCampaign.raised || apiCampaign.currentAmount || 0,
      donors: apiCampaign.donors || apiCampaign.statistics?.totalDonors || 0,
    };
  };

  const handleDonate = () => {
    if (campaign) {
      setDonationModalOpen(true);
    }
  };

  const handleShare = () => {
    if (campaign) {
      setShareModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <Skeleton className="h-12 w-48 mb-6" />
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (isError || !campaign) {
    return (
      <>
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/donations")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Donations
            </Button>
            <Alert variant="destructive">
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Campaign not found or you don't have permission to view it."}
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const targetAmount = campaign.targetAmount || Number(campaign.amount) || 0;
  const raisedAmount = campaign.raised || campaign.currentAmount || 0;
  const donorsCount = campaign.donors || campaign.statistics?.totalDonors || 0;

  const progressPercentage = calculateProgressPercentage(
    raisedAmount,
    targetAmount
  );
  const isActive =
    campaign.status === "active" &&
    campaign.startDate &&
    new Date(campaign.startDate) <= new Date() &&
    new Date(campaign.endDate) > new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(campaign.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/donations")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Donations
          </Button>

          {/* Campaign Image */}
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-6 shadow-lg">
            <img
              src={
                campaign.imageUrl ||
                campaign.images?.[0] ||
                "/default-campaign.jpg"
              }
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {isActive ? "Active" : "Ended"}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {campaign.category}
              </span>
            </div>
          </div>

          {/* Title and Description */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {campaign.title}
            </h1>
            <p className="text-gray-700 text-lg leading-relaxed">
              {campaign.description}
            </p>
          </div>

          {/* Progress Section */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Campaign Progress
                </h3>
                <span className="text-2xl font-bold text-indigo-600">
                  {progressPercentage}%
                </span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Raised: {formatINR(raisedAmount)}</span>
                  <span>Target: {formatINR(targetAmount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {donorsCount}
                  </div>
                  <div className="text-sm text-gray-600">Donors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {isActive ? daysLeft : campaign.daysRemaining || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isActive ? "Days Left" : "Days Overdue"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatINR(
                      Math.round(raisedAmount / Math.max(donorsCount, 1))
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Donation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Timeline */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">
                      {campaign.startDate
                        ? new Date(campaign.startDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">
                      {new Date(campaign.endDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`font-medium ${
                        isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isActive ? "Active" : "Ended"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Info */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Campaign Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{campaign.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Amount:</span>
                    <span className="font-medium">
                      {formatINR(targetAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raised Amount:</span>
                    <span className="font-medium">
                      {formatINR(raisedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Donors:</span>
                    <span className="font-medium">{donorsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          {campaign.contactInfo && (
            <Card className="mb-6">
              <CardContent className="p-4 bg-blue-50">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {campaign.contactInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">
                        {campaign.contactInfo.email}
                      </span>
                    </div>
                  )}
                  {campaign.contactInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">
                        {campaign.contactInfo.phone}
                      </span>
                    </div>
                  )}
                  {campaign.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{campaign.location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {isActive && (
              <Button
                onClick={handleDonate}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3"
                size="lg"
              >
                <Heart className="w-5 h-5 mr-2" />
                Donate Now
              </Button>
            )}
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 font-semibold px-6 py-3"
              size="lg"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      {campaign && (
        <EnhancedDonationModal
          open={donationModalOpen}
          onClose={() => setDonationModalOpen(false)}
          campaign={convertToCampaignType(campaign)}
          campaignIndex={0}
        />
      )}

      {/* Share Modal */}
      {campaign && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          campaign={{
            title: campaign.title,
            description: campaign.description,
            imageUrl: campaign.imageUrl || campaign.images?.[0],
            _id: campaign._id,
          }}
          shareUrl={`${window.location.origin}/donations/campaigns/${campaign._id}`}
        />
      )}

      <Footer />
    </>
  );
};

export default CampaignDetail;
