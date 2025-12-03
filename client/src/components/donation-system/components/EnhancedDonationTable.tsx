import React, { useState } from "react";
import {
  Receipt,
  Download,
  ExternalLink,
  Share,
  Eye,
  Search,
  SortAsc,
  SortDesc,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Smartphone,
  Building2,
  FileText,
  Mail,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { DonationHistoryItem, Campaign } from "../types";
import {
  formatINR,
  formatDateShort,
  downloadReceipt,
  exportToCSV,
} from "../utils";
import { useToast } from "@/hooks/use-toast";

interface EnhancedDonationTableProps {
  items: DonationHistoryItem[];
  campaigns: Campaign[];
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
}

interface DonationDetailsModalProps {
  open: boolean;
  onClose: () => void;
  donation: DonationHistoryItem | null;
  campaign: Campaign | null;
}

const DonationDetailsModal: React.FC<DonationDetailsModalProps> = ({
  open,
  onClose,
  donation,
  campaign,
}) => {
  const { toast } = useToast();

  if (!open || !donation) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "Processing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "Failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "UPI":
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case "Credit Card":
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case "Bank Transfer":
        return <Building2 className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleDownloadReceipt = () => {
    if (donation.status === "Completed") {
      downloadReceipt(donation);
      toast({
        title: "Receipt Downloaded",
        description: "Your donation receipt has been downloaded.",
        duration: 3000,
      });
    } else {
      toast({
        title: "Receipt Not Available",
        description: "Receipt will be available once donation is completed.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div>
            <h3 className="text-xl font-semibold">Donation Details</h3>
            <p className="text-indigo-100 text-sm mt-1">
              {donation.campaignTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Campaign Details */}
          {campaign && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-blue-900">
                  Campaign Details
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Image & Basic Info */}
                <div className="lg:col-span-1">
                  <div className="relative">
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                        {campaign.category}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h5 className="font-semibold text-gray-900 text-lg leading-tight">
                      {campaign.title}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {campaign.description}
                    </p>
                  </div>
                </div>

                {/* Campaign Progress & Stats */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Progress
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(
                          (campaign.raised / parseInt(campaign.amount)) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (campaign.raised / parseInt(campaign.amount)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Target Amount
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ₹{formatINR(parseInt(campaign.amount))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        Raised Amount
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{formatINR(campaign.raised)}
                      </div>
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">
                        Start Date:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {new Date(campaign.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">
                        End Date:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Donors:</span>
                      <span className="ml-2 text-gray-900">
                        {campaign.donors || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Status:</span>
                      <span
                        className={`ml-2 font-medium ${
                          new Date(campaign.endDate) > new Date()
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {new Date(campaign.endDate) > new Date()
                          ? "Active"
                          : "Ended"}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Features */}
                  <div className="flex flex-wrap gap-2">
                    {campaign.featured && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-medium">
                        Featured
                      </span>
                    )}
                    {campaign.allowAnonymous && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-medium">
                        Anonymous Donations
                      </span>
                    )}
                    {campaign.taxDeductible && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                        Tax Deductible
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Campaign Description (Full) */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h6 className="text-sm font-semibold text-gray-900 mb-2">
                  Campaign Description
                </h6>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {campaign.description}
                </p>
              </div>

              {/* Campaign Contact Info */}
              {campaign.contactInfo && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h6 className="text-sm font-semibold text-gray-900 mb-2">
                    Contact Information
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {campaign.contactInfo.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {campaign.contactInfo.phone}
                      </span>
                    </div>
                    {campaign.contactInfo.address && (
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {campaign.contactInfo.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Campaign Statistics */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h6 className="text-sm font-semibold text-gray-900 mb-3">
                  Campaign Statistics
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {campaign.donors || 0}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Total Donors
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      ₹
                      {formatINR(
                        Math.round(campaign.raised / (campaign.donors || 1))
                      )}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Avg Donation
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {Math.round(
                        (campaign.raised / parseInt(campaign.amount)) * 100
                      )}
                      %
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Goal Progress
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {Math.ceil(
                        (new Date(campaign.endDate).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Days Left
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Tags */}
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h6 className="text-sm font-semibold text-gray-900 mb-2">
                    Tags
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {campaign.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Donation Details */}
          <div className="space-y-6">
            {/* Amount & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <h5 className="font-semibold text-green-900">
                    Donation Amount
                  </h5>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  ₹{formatINR(donation.amount)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(donation.status)}
                  <h5 className="font-semibold text-gray-900">Status</h5>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {donation.status}
                </p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                {getPaymentIcon(donation.method)}
                <h5 className="font-semibold text-blue-900">Payment Details</h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Method:</span>
                  <span className="ml-2 text-blue-900">{donation.method}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">
                    Tax Deductible:
                  </span>
                  <span className="ml-2 text-blue-900">
                    {donation.taxDeductible ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <h5 className="font-semibold text-gray-900">
                  Transaction Details
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">
                    Donation ID:
                  </span>
                  <span className="ml-2 text-gray-900 font-mono">
                    {donation.id}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Receipt ID:</span>
                  <span className="ml-2 text-gray-900 font-mono">
                    {donation.receiptId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Date:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDateShort(donation.dateISO)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Time:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(donation.dateISO).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Donor Information (if available) */}
            {donation.donorInfo && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <h5 className="font-semibold text-purple-900">
                    Donor Information
                  </h5>
                  {donation.donorInfo.anonymous && (
                    <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-md text-xs font-medium">
                      Anonymous
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-purple-700 font-medium">Name:</span>
                    <span className="ml-2 text-purple-900">
                      {donation.donorInfo.anonymous
                        ? "Anonymous Donor"
                        : `${donation.donorInfo.firstName || ""} ${
                            donation.donorInfo.lastName || ""
                          }`.trim() || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Email:</span>
                    <span className="ml-2 text-purple-900">
                      {donation.donorInfo.anonymous
                        ? "Hidden"
                        : donation.donorInfo.email || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Phone:</span>
                    <span className="ml-2 text-purple-900">
                      {donation.donorInfo.anonymous
                        ? "Hidden"
                        : donation.donorInfo.phone || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">City:</span>
                    <span className="ml-2 text-purple-900">
                      {donation.donorInfo.anonymous
                        ? "Hidden"
                        : donation.donorInfo.city || "Not provided"}
                    </span>
                  </div>
                  {donation.donorInfo.address &&
                    !donation.donorInfo.anonymous && (
                      <div className="md:col-span-2">
                        <span className="text-purple-700 font-medium">
                          Address:
                        </span>
                        <span className="ml-2 text-purple-900">
                          {donation.donorInfo.address}
                          {donation.donorInfo.city &&
                            `, ${donation.donorInfo.city}`}
                          {donation.donorInfo.state &&
                            `, ${donation.donorInfo.state}`}
                          {donation.donorInfo.pincode &&
                            ` - ${donation.donorInfo.pincode}`}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleDownloadReceipt}
              disabled={donation.status !== "Completed"}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
            {campaign && (
              <button
                onClick={() => {
                  toast({
                    title: "View Campaign",
                    description: `Redirecting to ${campaign.title} campaign page...`,
                  });
                  // TODO: Navigate to campaign page
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Campaign
              </button>
            )}
            <button
              onClick={() => {
                toast({
                  title: "Share Feature",
                  description: "Share functionality will be implemented soon!",
                });
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
            >
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedDonationTable: React.FC<EnhancedDonationTableProps> = ({
  items,
  campaigns,
  categoryFilter,
  onCategoryFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDonation, setSelectedDonation] =
    useState<DonationHistoryItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Filter and sort items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      categoryFilter === "" ||
      campaigns[item.campaignIndex]?.category === categoryFilter;
    const matchesSearch =
      item.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "date":
        comparison =
          new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime();
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const categories = [...new Set(campaigns.map((c) => c.category))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Processing":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "UPI":
        return <Smartphone className="w-4 h-4 text-blue-600" />;
      case "Credit Card":
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case "Bank Transfer":
        return <Building2 className="w-4 h-4 text-purple-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleRowClick = (donation: DonationHistoryItem) => {
    setSelectedDonation(donation);
    setDetailsModalOpen(true);
  };

  const handleSort = (field: "date" | "amount" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Donation History
            </h2>
            <p className="text-sm text-gray-600">
              {sortedItems.length} donations found
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search donations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex gap-2">
            {[
              { key: "date", label: "Date" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key as "date" | "amount" | "status")}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  sortBy === key
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
                {sortBy === key &&
                  (sortOrder === "asc" ? (
                    <SortAsc className="w-3 h-3" />
                  ) : (
                    <SortDesc className="w-3 h-3" />
                  ))}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600 tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedItems.map((item) => {
                const campaign = campaigns[item.campaignIndex];
                return (
                  <tr
                    key={`item-${item.id}`}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {item.campaignTitle}
                          </div>
                          <div className="text-xs text-gray-500">
                            {campaign?.category || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{formatINR(item.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.taxDeductible
                          ? "Tax Deductible"
                          : "Non-deductible"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDateShort(item.dateISO)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.dateISO).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusIcon(item.status)}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(item.method)}
                        <span className="text-sm text-gray-900">
                          {item.method}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadReceipt(item);
                          }}
                          disabled={item.status !== "Completed"}
                          className="inline-flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 py-1 px-2 rounded-md text-xs font-medium transition-all"
                        >
                          <Download className="w-3 h-3" />
                          Receipt
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item);
                          }}
                          className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded-md text-xs font-medium transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedItems.length === 0 && (
          <div className="py-12 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No donations found
            </h3>
            <p className="text-gray-500">
              {searchTerm || categoryFilter !== ""
                ? "Try adjusting your search or filter criteria."
                : "You haven't made any donations yet."}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {sortedItems.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{sortedItems.length}</span>{" "}
              donations found
              {searchTerm && <span className="ml-1">for "{searchTerm}"</span>}
              {categoryFilter && (
                <span className="ml-1">in {categoryFilter}</span>
              )}
            </div>
            <button
              onClick={() => exportToCSV(sortedItems, "donations.csv")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Export to CSV
            </button>
          </div>
        </div>
      )}

      {/* Donation Details Modal */}
      <DonationDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        donation={selectedDonation}
        campaign={
          selectedDonation
            ? campaigns[selectedDonation.campaignIndex] || null
            : null
        }
      />
    </div>
  );
};

export default EnhancedDonationTable;
