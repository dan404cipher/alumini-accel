import React from "react";
import {
  X,
  Calendar,
  Target,
  Users,
  Heart,
  Share2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Campaign } from "../types";
import { formatINR, calculateProgressPercentage } from "../utils";

interface CampaignDetailsModalProps {
  open: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onDonate?: () => void;
  onShare?: () => void;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  open,
  onClose,
  campaign,
  onDonate,
  onShare,
}) => {
  if (!open || !campaign) return null;

  const progressPercentage = calculateProgressPercentage(
    campaign.raised,
    Number(campaign.amount)
  );
  const isActive = new Date(campaign.endDate) > new Date();
  const daysLeft = Math.ceil(
    (new Date(campaign.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Campaign Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Campaign Image */}
          <div className="relative h-64 md:h-80">
            <img
              src={campaign.imageUrl}
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

          <div className="p-6 space-y-6">
            {/* Title and Description */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {campaign.title}
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed">
                {campaign.description}
              </p>
            </div>

            {/* Progress Section */}
            <div className="bg-gray-50 rounded-xl p-6">
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
                  <span>Raised: ₹{formatINR(campaign.raised)}</span>
                  <span>Target: ₹{formatINR(Number(campaign.amount))}</span>
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
                    {campaign.donors}
                  </div>
                  <div className="text-sm text-gray-600">Donors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {isActive ? daysLeft : 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isActive ? "Days Left" : "Days Overdue"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹
                    {formatINR(
                      Math.round(campaign.raised / Math.max(campaign.donors, 1))
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Donation</div>
                </div>
              </div>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timeline */}
              <div className="bg-white border rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">
                      {new Date(campaign.endDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
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
              </div>

              {/* Campaign Info */}
              <div className="bg-white border rounded-xl p-4">
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
                      ₹{formatINR(Number(campaign.amount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raised Amount:</span>
                    <span className="font-medium">
                      ₹{formatINR(campaign.raised)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Donors:</span>
                    <span className="font-medium">{campaign.donors}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">admin@alumni.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">Alumni Office</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Website:</span>
                  <span className="font-medium">www.alumni.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center gap-4">
            {isActive && onDonate && (
              <button
                onClick={onDonate}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <Heart className="w-5 h-5" />
                Donate Now
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl border transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Share Campaign
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
