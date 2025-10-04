import { useState, useEffect } from "react";
import {
  Campaign,
  DonationHistoryItem,
  DonationStatus,
  CampaignForm,
} from "../types";
import { generateReceiptId, generateDonationId } from "../utils";

// Mock data generator
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

export const useDonationManagement = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(generateMockCampaigns);
  const [userDonations, setUserDonations] = useState<DonationHistoryItem[]>(
    generateMockDonations
  );
  const [donationCampaignsArr, setDonationCampaignsArr] = useState<Campaign[]>(
    generateMockCampaigns
  );
  const [categoryFilter, setCategoryFilter] = useState("");
  const [menuOpenForCampaign, setMenuOpenForCampaign] = useState(-1);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [donationModalCampaign, setDonationModalCampaign] = useState(null);
  const [donationModalCampaignIndex, setDonationModalCampaignIndex] =
    useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("campaigns");

  // Load campaigns on mount
  useEffect(() => {
    setCampaigns(generateMockCampaigns());
    setDonationCampaignsArr(generateMockCampaigns());
    setUserDonations(generateMockDonations());
  }, []);

  // Handle campaign save
  useEffect(() => {
    const handleCampaignSave = (event: CustomEvent) => {
      const { formData, editIndex } = event.detail;

      if (editIndex !== null) {
        // Edit existing campaign
        const updatedCampaigns = [...campaigns];
        updatedCampaigns[editIndex] = { ...formData };
        setCampaigns(updatedCampaigns);
      } else {
        // Add new campaign (disabled in demo)
        console.log("Create campaign:", formData);
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
    const handleDonationConfirm = (event: CustomEvent) => {
      const { amount, paymentMethod, taxDeductible } = event.detail;

      if (!donationModalCampaign || donationModalCampaignIndex === null) return;

      const newDonation: DonationHistoryItem = {
        id: generateDonationId(),
        campaignTitle: donationModalCampaign.title,
        receiptId: generateReceiptId(),
        amount,
        dateISO: new Date().toISOString(),
        status: "Processing" as DonationStatus,
        method: paymentMethod,
        taxDeductible,
      };

      setUserDonations((prev) => [newDonation, ...prev]);

      // Update campaign raised amount
      setCampaigns((prev) =>
        prev.map((c, idx) =>
          idx === donationModalCampaignIndex
            ? { ...c, raised: c.raised + amount, donors: c.donors + 1 }
            : c
        )
      );

      // Show success message
      setTimeout(() => {
        alert(
          `Thank donation of ₹${amount.toLocaleString(
            "en-IN"
          )} initiated for "${
            donationModalCampaign.title
          }". You'll receive a receipt shortly.`
        );
      }, 100);
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
    setSelectedCampaignForEdit({ ...editData, editIndex: index });
    setEditModalOpen(true);
    setMenuOpenForCampaign(-1);
  };

  const handleDeleteCampaign = (index: number) => {
    if (
      window.confirm("Are you sure? This will permanently delete the campaign.")
    ) {
      setCampaigns((prev) => prev.filter((_, i) => i !== index));
      setMenuOpenForCampaign(-1);
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

  return {
    // State
    campaigns,
    userDonations,
    donationCampaignsArr,
    categoryFilter,
    menuOpenForCampaign,
    activeTab,
    // Modal states
    createModalOpen,
    donationModalOpen,
    donationModalCampaign,
    donationModalCampaignIndex,
    editModalOpen,
    selectedCampaignForEdit,
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
    // Handlers
    handleOpenDonationModal,
    handleEditCampaign,
    handleDeleteCampaign,
  };
};
