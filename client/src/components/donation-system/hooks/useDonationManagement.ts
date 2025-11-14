import { useState, useEffect } from "react";
import { getAuthTokenOrNull } from "@/utils/auth";
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
    donorInfo: {
      firstName: "Rajesh",
      lastName: "Kumar",
      email: "rajesh.kumar@email.com",
      phone: "+91 98765 43210",
      address: "123 MG Road, Bangalore",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      anonymous: false,
    },
  },
  {
    id: generateDonationId(),
    campaignTitle: "Student Scholarship Fund",
    receiptId: generateReceiptId(),
    amount: 5000,
    dateISO: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Completed" as DonationStatus,
    method: "UPI",
    taxDeductible: true,
    donorInfo: {
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@email.com",
      phone: "+91 87654 32109",
      address: "456 Park Street, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      anonymous: false,
    },
  },
  {
    id: generateDonationId(),
    campaignTitle: "Library Modernization",
    receiptId: generateReceiptId(),
    amount: 15000,
    dateISO: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Completed" as DonationStatus,
    method: "Credit Card",
    taxDeductible: true,
    donorInfo: {
      firstName: "Amit",
      lastName: "Patel",
      email: "amit.patel@email.com",
      phone: "+91 76543 21098",
      address: "789 Connaught Place, Delhi",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      anonymous: false,
    },
  },
  {
    id: generateDonationId(),
    campaignTitle: "Sports Equipment",
    receiptId: generateReceiptId(),
    amount: 7500,
    dateISO: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "Processing" as DonationStatus,
    method: "Bank Transfer",
    taxDeductible: false,
    donorInfo: {
      firstName: "Anonymous",
      lastName: "Donor",
      email: "anonymous@email.com",
      phone: "+91 00000 00000",
      address: "Confidential",
      city: "Confidential",
      state: "Confidential",
      pincode: "000000",
      anonymous: true,
    },
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
): DonationHistoryItem => {
  const amount = (apiDonation.amount as number) || 0;

  // Ensure amount is a reasonable number (not NaN or extremely large)
  // Check for reasonable donation amounts (between 0 and 1 crore)
  const safeAmount =
    isNaN(amount) || amount < 0 || amount > 10000000 ? 0 : amount;

  return {
    id: (apiDonation._id as string) || "",
    campaignTitle:
      ((apiDonation.campaignId as Record<string, unknown>)?.title as string) ||
      "Unknown Campaign",
    receiptId: (apiDonation.transactionId as string) || "",
    amount: safeAmount,
    dateISO: (apiDonation.createdAt as string) || "",
    status:
      apiDonation.paymentStatus === "completed"
        ? "Completed"
        : apiDonation.paymentStatus === "pending"
        ? "Processing"
        : "Failed",
    method: ((apiDonation.paymentMethod as string) ||
      "Bank Transfer") as PaymentMethod,
    taxDeductible: (apiDonation.taxDeductible as boolean) || true,
    donorInfo: {
      firstName: (apiDonation.donorName as string)?.split(" ")[0] || "Unknown",
      lastName:
        (apiDonation.donorName as string)?.split(" ").slice(1).join(" ") || "",
      email: (apiDonation.donorEmail as string) || "",
      phone: (apiDonation.donorPhone as string) || "",
      address: (apiDonation.donorAddress as string) || "",
      anonymous: (apiDonation.anonymous as boolean) || false,
    },
  };
};

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

  // Pagination state
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsLimit] = useState(12); // 12 campaigns per page
  const [campaignsPagination, setCampaignsPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const [donationsPage, setDonationsPage] = useState(1);
  const [donationsLimit] = useState(10); // 10 donations per page
  const [donationsPagination, setDonationsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

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
  const [campaignDetailsModalOpen, setCampaignDetailsModalOpen] =
    useState(false);
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] =
    useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("campaigns");

  // Load campaigns and donations from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from localStorage or sessionStorage (same logic as AuthContext)
        const token = getAuthTokenOrNull();

        if (!token) {
          throw new Error("No authentication token found");
        }

        // Load campaigns with pagination
        const campaignsResponse = await donationApi.getAllCampaigns({
          category: categoryFilter || undefined,
          page: campaignsPage,
          limit: campaignsLimit,
        });

        if (
          !campaignsResponse.data ||
          !campaignsResponse.data.campaigns ||
          !Array.isArray(campaignsResponse.data.campaigns)
        ) {
          throw new Error("Invalid campaigns response format");
        }

        const campaignsData = campaignsResponse.data.campaigns.map(
          transformCampaignFromApi
        );
        setCampaigns(campaignsData);
        setDonationCampaignsArr(campaignsData);
        setCampaignsPagination(campaignsResponse.data.pagination);

        // Load user donations with pagination
        const donationsResponse = await donationApi.getMyDonations({
          page: donationsPage,
          limit: donationsLimit,
        });

        if (
          !donationsResponse.data ||
          !donationsResponse.data.donations ||
          !Array.isArray(donationsResponse.data.donations)
        ) {
          throw new Error("Invalid donations response format");
        }

        const donationsData = donationsResponse.data.donations.map(
          transformDonationFromApi
        );
        setUserDonations(donationsData);
        setDonationsPagination(donationsResponse.data.pagination);
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
  }, [campaignsPage, campaignsLimit, donationsPage, donationsLimit, categoryFilter]);

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
            const campaignsResponse = await donationApi.getAllCampaigns({
              page: campaignsPage,
              limit: campaignsLimit,
            });
            const campaignsData = campaignsResponse.data.campaigns.map(
              transformCampaignFromApi
            );
            setCampaigns(campaignsData);
            setDonationCampaignsArr(campaignsData);
            setCampaignsPagination(campaignsResponse.data.pagination);
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

    // Add listener for enhanced donation modal completion
    const handleDonationCompleted = async (event: CustomEvent) => {
      try {
        const { donation, receipt, campaign } = event.detail;

        // Try to refresh from API first
        try {
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
        } catch (apiError) {
          // If API fails, add the donation to existing mock data
          const newDonation: DonationHistoryItem = {
            id: donation?.id || generateDonationId(),
            campaignTitle: campaign?.title || "New Campaign",
            receiptId: receipt?.receiptId || generateReceiptId(),
            amount: donation?.amount || 0,
            dateISO: new Date().toISOString(),
            status: "Completed" as DonationStatus,
            method: donation?.paymentMethod || "Bank Transfer",
            taxDeductible: donation?.taxDeductible || true,
            donorInfo: {
              firstName: donation?.donorInfo?.firstName || "Unknown",
              lastName: donation?.donorInfo?.lastName || "Donor",
              email: donation?.donorInfo?.email || "donor@email.com",
              phone: donation?.donorInfo?.phone || "+91 00000 00000",
              address: donation?.donorInfo?.address || "Address not provided",
              city: donation?.donorInfo?.city || "City not provided",
              state: donation?.donorInfo?.state || "State not provided",
              pincode: donation?.donorInfo?.pincode || "000000",
              anonymous: donation?.donorInfo?.anonymous || false,
            },
          };

          // Add new donation to existing list
          setUserDonations((prevDonations) => [...prevDonations, newDonation]);
        }
      } catch (error) {
        console.error("Error refreshing donation data:", error);
      }
    };

    window.addEventListener(
      "donationCompleted",
      handleDonationCompleted as EventListener
    );

    return () => {
      window.removeEventListener(
        "donationConfirm",
        handleDonationConfirm as EventListener
      );
      window.removeEventListener(
        "donationCompleted",
        handleDonationCompleted as EventListener
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
  const totalDonated = userDonations.reduce((sum, d) => {
    // Ensure each donation amount is reasonable
    const safeAmount =
      isNaN(d.amount) || d.amount < 0 || d.amount > 10000000 ? 0 : d.amount;
    return sum + safeAmount;
  }, 0);

  // Ensure total is reasonable (not more than 1 crore)
  const safeTotalDonated = totalDonated > 10000000 ? 0 : totalDonated;

  const completedDonations = userDonations.filter(
    (d) => d.status === "Completed"
  ).length;

  const handleShareCampaign = (campaign: Campaign) => {
    setSelectedCampaignForShare(campaign);
    setShareModalOpen(true);
  };

  const handleViewCampaignDetails = (campaign: Campaign) => {
    setSelectedCampaignForDetails(campaign);
    setCampaignDetailsModalOpen(true);
  };

  // Reset donation data to fix corrupted amounts
  const resetDonationData = () => {
    setUserDonations([]);
    toast({
      title: "Data Reset",
      description: "Donation data has been reset. Please refresh the page.",
      duration: 3000,
    });
  };

  // Add a test donation to demonstrate dynamic updates
  const addTestDonation = () => {
    const testNames = [
      {
        firstName: "Arjun",
        lastName: "Singh",
        email: "arjun.singh@email.com",
        phone: "+91 91234 56789",
      },
      {
        firstName: "Kavya",
        lastName: "Reddy",
        email: "kavya.reddy@email.com",
        phone: "+91 92345 67890",
      },
      {
        firstName: "Vikram",
        lastName: "Joshi",
        email: "vikram.joshi@email.com",
        phone: "+91 93456 78901",
      },
      {
        firstName: "Ananya",
        lastName: "Gupta",
        email: "ananya.gupta@email.com",
        phone: "+91 94567 89012",
      },
    ];

    const randomDonor = testNames[Math.floor(Math.random() * testNames.length)];

    const testDonation: DonationHistoryItem = {
      id: generateDonationId(),
      campaignTitle: "Test Campaign",
      receiptId: generateReceiptId(),
      amount: Math.floor(Math.random() * 50000) + 1000, // Random amount between 1000-51000
      dateISO: new Date().toISOString(),
      status: "Completed" as DonationStatus,
      method: "UPI",
      taxDeductible: true,
      donorInfo: {
        firstName: randomDonor.firstName,
        lastName: randomDonor.lastName,
        email: randomDonor.email,
        phone: randomDonor.phone,
        address: `${
          Math.floor(Math.random() * 999) + 1
        } Test Street, Test City`,
        city: "Test City",
        state: "Test State",
        pincode: "123456",
        anonymous: false,
      },
    };

    setUserDonations((prevDonations) => [...prevDonations, testDonation]);

    toast({
      title: "Test Donation Added",
      description: `Added donation of ₹${testDonation.amount.toLocaleString(
        "en-IN"
      )} from ${randomDonor.firstName} ${randomDonor.lastName}`,
      duration: 3000,
    });
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
    // Pagination state
    campaignsPage,
    setCampaignsPage,
    campaignsPagination,
    donationsPage,
    setDonationsPage,
    donationsPagination,
    // Modal states
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
    // Computed values
    filteredActive,
    totalDonated: safeTotalDonated,
    completedDonations,
    // Setters
    setCategoryFilter,
    setMenuOpenForCampaign,
    setActiveTab,
    setCreateModalOpen,
    setDonationModalOpen,
    setEditModalOpen,
    setShareModalOpen,
    setCampaignDetailsModalOpen,
    // Handlers
    handleOpenDonationModal,
    handleEditCampaign,
    handleDeleteCampaign,
    handleShareCampaign,
    handleViewCampaignDetails,
    resetDonationData,
    addTestDonation,
  };
};
