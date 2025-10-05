import { useState, useEffect } from "react";
import {
  Campaign,
  DonationHistoryItem,
  DonationStatus,
  CampaignForm,
  PaymentMethod,
} from "../types";
import { generateReceiptId, generateDonationId, shareCampaign } from "../utils";
import {
  donationApi,
  CreateCampaignData,
  CreateDonationData,
} from "../../../services/donationApi";
import { useToast } from "@/hooks/use-toast";

// Mock data generator (fallback)
const generateMockCampaigns = (): Campaign[] => [
  {
    title: "Smart Classroom Initiative",
    description:
      "We will upgrade college classrooms with IoT-enabled smart boards, high-speed WiFi, and ergonomic furniture.",
    category: "Infrastructure",
    amount: "250000",
    endDate: "2025-12-31T23:59:59.000Z",
    imageUrl: "/src/assets/smart-classroom.jpg",
    raised: 125000,
    donors: 247,
  },
];

const generateMockDonations = (): DonationHistoryItem[] => [
  {
    id: generateDonationId(),
    campaignTitle: "Smart Classroom Initiative",
    receiptId: generateReceiptId(),
    amount: 10000,
    dateISO: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Completed" as DonationStatus,
    method: "Bank Transfer",
    taxDeductible: true,
  },
];

// Transform API campaign data to frontend format
const transformCampaignFromApi = (
  apiCampaign: Record<string, unknown>
): Campaign => ({
  _id: apiCampaign._id as string, // Include the ID for editing
  title: (apiCampaign.title as string) || "",
  description: (apiCampaign.description as string) || "",
  category: (apiCampaign.category as string) || "",
  amount: (apiCampaign.targetAmount as number)?.toString() || "0",
  endDate: (apiCampaign.endDate as string) || "",
  imageUrl: (() => {
    const imageUrl =
      (apiCampaign.imageUrl as string) ||
      (apiCampaign.images as string[])?.[0] ||
      "/default-campaign.jpg";

    // If it's an uploaded image, prepend the backend URL
    if (imageUrl.startsWith("/uploads/")) {
      return `http://localhost:3000${imageUrl}`;
    }

    return imageUrl;
  })(),
  raised:
    (apiCampaign.raised as number) ||
    (apiCampaign.currentAmount as number) ||
    0,
  donors:
    (apiCampaign.donors as number) ||
    ((apiCampaign.statistics as Record<string, unknown>)
      ?.totalDonors as number) ||
    0,
});

// Transform API donation data to frontend format
const transformDonationFromApi = (
  apiDonation: Record<string, unknown>
): DonationHistoryItem => ({
  id: (apiDonation._id as string) || "",
  campaignTitle:
    ((apiDonation.campaignId as Record<string, unknown>)?.title as string) ||
    "Unknown Campaign",
  receiptId: (apiDonation.transactionId as string) || "",
  amount: (apiDonation.amount as number) || 0,
  dateISO: (apiDonation.createdAt as string) || "",
  status:
    apiDonation.paymentStatus === "completed"
      ? "Completed"
      : apiDonation.paymentStatus === "pending"
      ? "Processing"
      : "Failed",
  method: ((apiDonation.paymentMethod as string) ||
    "Bank Transfer") as PaymentMethod,
  taxDeductible: true, // Default to true, can be updated based on campaign settings
});

export const useDonationManagement = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userDonations, setUserDonations] = useState<DonationHistoryItem[]>([]);
  const [donationCampaignsArr, setDonationCampaignsArr] = useState<Campaign[]>(
    []
  );
  const [categoryFilter, setCategoryFilter] = useState("");
  const [menuOpenForCampaign, setMenuOpenForCampaign] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationModalCampaign, setDonationModalCampaign] = useState(null);
  const [donationModalCampaignIndex, setDonationModalCampaignIndex] =
    useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCampaignForShare, setSelectedCampaignForShare] =
    useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("campaigns");

  // Load campaigns and donations from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");

        // Load campaigns
        const campaignsResponse = await donationApi.getAllCampaigns();

        if (!campaignsResponse.data || !Array.isArray(campaignsResponse.data)) {
          throw new Error("Invalid campaigns response format");
        }

        const campaignsData = (
          campaignsResponse.data as unknown as Record<string, unknown>[]
        ).map(transformCampaignFromApi);
        setCampaigns(campaignsData);
        setDonationCampaignsArr(campaignsData);

        // Load user donations
        const donationsResponse = await donationApi.getMyDonations();

        if (!donationsResponse.data || !Array.isArray(donationsResponse.data)) {
          throw new Error("Invalid donations response format");
        }

        const donationsData = (
          donationsResponse.data as unknown as Record<string, unknown>[]
        ).map(transformDonationFromApi);
        setUserDonations(donationsData);
      } catch (err) {
        console.error("Error loading donation data:", err);
        console.error("Error details:", {
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(err instanceof Error ? err.message : "Failed to load data");

        // Fallback to mock data
        setCampaigns(generateMockCampaigns());
        setDonationCampaignsArr(generateMockCampaigns());
        setUserDonations(generateMockDonations());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle campaign save
  useEffect(() => {
    const handleCampaignSave = async (event: CustomEvent) => {
      const { formData, editIndex, campaignId } = event.detail;

      try {
        if (editIndex !== null && editIndex !== undefined) {
          // Edit existing campaign - use campaignId from event or fallback to index lookup
          const finalCampaignId =
            campaignId ||
            (editIndex >= 0 && editIndex < campaigns.length
              ? campaigns[editIndex]._id || campaigns[editIndex].title
              : null);

          if (finalCampaignId) {
            const campaignData: CreateCampaignData = {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              targetAmount: parseInt(formData.amount),
              currency: "INR",
              startDate: new Date().toISOString(),
              endDate: formData.endDate,
              contactInfo: {
                email: "admin@alma-mater.edu", // Default contact info
              },
            };

            await donationApi.updateCampaign(finalCampaignId, campaignData);

            // Upload image if provided
            if (formData.imageFile) {
              try {
                await donationApi.uploadCampaignImage(
                  finalCampaignId,
                  formData.imageFile
                );
              } catch (imageError) {
                console.error("Error uploading campaign image:", imageError);
                // Don't fail the entire operation if image upload fails
              }
            }

            // Refresh campaigns
            const campaignsResponse = await donationApi.getAllCampaigns();
            const campaignsData = (
              campaignsResponse.data as unknown as Record<string, unknown>[]
            ).map(transformCampaignFromApi);
            setCampaigns(campaignsData);
            setDonationCampaignsArr(campaignsData);
          } else {
            console.error("Campaign ID not found for editing");
          }
        } else {
          // Create new campaign
          const campaignData: CreateCampaignData = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            targetAmount: parseInt(formData.amount),
            currency: "INR",
            startDate: new Date().toISOString(),
            endDate: formData.endDate,
            contactInfo: {
              email: "admin@alma-mater.edu", // Default contact info
            },
          };

          const createdCampaign = await donationApi.createCampaign(
            campaignData
          );

          // Upload image if provided
          if (formData.imageFile && createdCampaign.data._id) {
            try {
              await donationApi.uploadCampaignImage(
                createdCampaign.data._id,
                formData.imageFile
              );
            } catch (imageError) {
              console.error("Error uploading campaign image:", imageError);
              // Don't fail the entire operation if image upload fails
            }
          }

          // Refresh campaigns
          const campaignsResponse = await donationApi.getAllCampaigns();
          const campaignsData = (
            campaignsResponse.data as unknown as Record<string, unknown>[]
          ).map(transformCampaignFromApi);
          setCampaigns(campaignsData);
          setDonationCampaignsArr(campaignsData);
        }
      } catch (error) {
        console.error("Error saving campaign:", error);
        // alert("Failed to save campaign. Please try again.");
      }
    };

    // Add event listener
    window.addEventListener(
      "campaignSave",
      handleCampaignSave as EventListener
    );

    return () => {
      window.removeEventListener(
        "campaignSave",
        handleCampaignSave as EventListener
      );
    };
  }, [campaigns]);

  // Handle donation confirm
  useEffect(() => {
    const handleDonationConfirm = async (event: CustomEvent) => {
      const { amount, paymentMethod, taxDeductible } = event.detail;

      if (!donationModalCampaign || donationModalCampaignIndex === null) return;

      try {
        const donationData: CreateDonationData = {
          campaignId: donationModalCampaign._id || donationModalCampaign.title, // Fallback for mock data
          amount: amount,
          currency: "INR",
          paymentMethod: paymentMethod,
          donationType: "one-time",
          message: `Donation for ${donationModalCampaign.title}`,
          anonymous: false,
        };

        await donationApi.createDonation(donationData);

        // Refresh donations
        const donationsResponse = await donationApi.getMyDonations();
        const donationsData = (
          donationsResponse.data as unknown as Record<string, unknown>[]
        ).map(transformDonationFromApi);
        setUserDonations(donationsData);

        // Refresh campaigns to update raised amounts
        const campaignsResponse = await donationApi.getAllCampaigns();
        const campaignsData = (
          campaignsResponse.data as unknown as Record<string, unknown>[]
        ).map(transformCampaignFromApi);
        setCampaigns(campaignsData);
        setDonationCampaignsArr(campaignsData);

        // Show success message
        setTimeout(() => {
          alert(
            `Thank you! Your donation of ₹${amount.toLocaleString(
              "en-IN"
            )} has been initiated for "${
              donationModalCampaign.title
            }". You'll receive a receipt shortly.`
          );
        }, 100);
      } catch (error) {
        console.error("Error creating donation:", error);
        // alert("Failed to process donation. Please try again.");
      }
    };

    window.addEventListener(
      "donationConfirm",
      handleDonationConfirm as EventListener
    );

    return () => {
      window.removeEventListener(
        "donationConfirm",
        handleDonationConfirm as EventListener
      );
    };
  }, [donationModalCampaign, donationModalCampaignIndex]);

  // Event handlers
  const handleOpenDonationModal = (campaign: Campaign, index: number) => {
    setDonationModalCampaign(campaign);
    setDonationModalCampaignIndex(index);
    setDonationModalOpen(true);
    setMenuOpenForCampaign(-1);
  };

  const handleEditCampaign = (campaign: Campaign, index: number) => {
    const editData: CampaignForm = { ...campaign };
    const selectedData = {
      ...editData,
      editIndex: index,
      campaignId: campaign._id || campaign.title, // Ensure campaignId is set
    };
    setSelectedCampaignForEdit(selectedData);
    setEditModalOpen(true);
    setMenuOpenForCampaign(-1);
  };

  const handleDeleteCampaign = async (index: number) => {
    const campaign = campaigns[index];

    try {
      const campaignId = campaign._id || campaign.title; // Fallback for mock data
      await donationApi.deleteCampaign(campaignId);

      // Refresh campaigns
      const campaignsResponse = await donationApi.getAllCampaigns();
      const campaignsData = (
        campaignsResponse.data as unknown as Record<string, unknown>[]
      ).map(transformCampaignFromApi);
      setCampaigns(campaignsData);
      setDonationCampaignsArr(campaignsData);
      setMenuOpenForCampaign(-1);
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const filteredActive = campaigns.filter(
    (it) => it.category === categoryFilter || categoryFilter === ""
  );

  // Computed values
  const totalDonated = userDonations.reduce((sum, d) => sum + d.amount, 0);
  const completedDonations = userDonations.filter(
    (d) => d.status === "Completed"
  ).length;

  const handleShareCampaign = (campaign: Campaign) => {
    setSelectedCampaignForShare(campaign);
    setShareModalOpen(true);
  };

  return {
    // State
    campaigns,
    userDonations,
    donationCampaignsArr,
    categoryFilter,
    menuOpenForCampaign,
    activeTab,
    loading,
    error,
    // Modal states
    createModalOpen,
    donationModalOpen,
    donationModalCampaign,
    donationModalCampaignIndex,
    editModalOpen,
    selectedCampaignForEdit,
    shareModalOpen,
    selectedCampaignForShare,
    // Computed values
    filteredActive,
    totalDonated,
    completedDonations,
    // Setters
    setCategoryFilter,
    setMenuOpenForCampaign,
    setActiveTab,
    setCreateModalOpen,
    setDonationModalOpen,
    setEditModalOpen,
    setShareModalOpen,
    // Handlers
    handleOpenDonationModal,
    handleEditCampaign,
    handleDeleteCampaign,
    handleShareCampaign,
  };
};
