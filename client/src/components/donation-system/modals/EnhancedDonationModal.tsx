import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  X,
  AlertCircle,
  ExternalLink,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Eye,
  EyeOff,
  Download,
  Share2,
} from "lucide-react";
import {
  DonationModalProps,
  PaymentMethod,
  DonorInfo,
  PaymentDetails,
  DonationFormData,
  DonationReceipt,
} from "../types";
import { useToast } from "@/hooks/use-toast";
import { donationApi, CreateDonationData } from "../../../services/donationApi";
import RazorpayService from "../../../services/razorpayService";
import ReceiptDownload from "../components/ReceiptDownload";
import { useAuth } from "@/contexts/AuthContext";

interface FormStep {
  id: string;
  title: string;
  description: string;
}

const steps: FormStep[] = [
  { id: "amount", title: "Amount", description: "Choose donation amount" },
  { id: "donor", title: "Details", description: "Your information" },
  { id: "review", title: "Review", description: "Confirm donation" },
  { id: "receipt", title: "Receipt", description: "Download receipt" },
];

const EnhancedDonationModal: React.FC<DonationModalProps> = ({
  open,
  onClose,
  campaign,
  campaignIndex,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] =
    useState<DonationReceipt | null>(null);
  const [donationId, setDonationId] = useState<string>("");

  // Form data
  const [formData, setFormData] = useState<DonationFormData>({
    amount: 0,
    donorInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      anonymous: false,
    },
    paymentDetails: {
      method: "Razorpay",
      upiId: "",
    },
    taxDeductible: true,
    message: "",
    recurring: false,
    recurringFrequency: "monthly",
  });

  // Pre-populate form with user data when modal opens (only once per open)
  const hasPopulatedRef = useRef(false);
  useEffect(() => {
    if (open && user && !hasPopulatedRef.current) {
      setFormData((prev) => ({
        ...prev,
        donorInfo: {
          ...prev.donorInfo,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          // Address fields (address, city, state, pincode) are not available in User model
          // They will remain empty and user needs to fill them if required for tax receipt
        },
      }));
      hasPopulatedRef.current = true;
    } else if (!open) {
      // Reset the flag when modal closes
      hasPopulatedRef.current = false;
    }
  }, [open, user]);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const quickAmounts = [100, 250, 500, 1000, 2500, 5000];
  const suggestedAmounts = [2000, 5000, 10000, 25000];

  // Validation functions
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Amount
        if (formData.amount < 1) {
          newErrors.amount = "Please select a valid amount";
        }
        break;

      case 1: // Donor info
        if (!formData.donorInfo.firstName.trim()) {
          newErrors.firstName = "First name is required";
        }
        if (!formData.donorInfo.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        }
        if (!formData.donorInfo.email.trim()) {
          newErrors.email = "Email is required";
        } else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.donorInfo.email)
        ) {
          newErrors.email = "Please enter a valid email";
        }
        if (!formData.donorInfo.phone.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (
          !/^[6-9]\d{9}$/.test(formData.donorInfo.phone.replace(/\D/g, ""))
        ) {
          newErrors.phone = "Please enter a valid 10-digit phone number";
        }
        if (formData.taxDeductible && !formData.donorInfo.address?.trim()) {
          newErrors.address =
            "Address is required for tax-deductible donations";
        }
        break;

      case 2: // Review (previously step 3)
        // No additional validation needed for review step
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Handle Razorpay payment differently
      if (formData.paymentDetails.method === "Razorpay") {
        const razorpayService = RazorpayService.getInstance();

        await razorpayService.processDonationPayment(
          formData.amount,
          formData.donorInfo,
          campaign?.title || "Donation Campaign",
          async (paymentData) => {
            // Payment successful - create donation record
            try {
              const donationData: CreateDonationData = {
                campaignId: campaign?._id || campaign?.title || "",
                amount: formData.amount,
                currency: "INR",
                paymentMethod: formData.paymentDetails.method,
                donationType: formData.recurring ? "recurring" : "one-time",
                message: formData.message || `Donation for ${campaign?.title}`,
                anonymous: formData.donorInfo.anonymous,
                donorName: formData.donorInfo.anonymous
                  ? "Anonymous Donor"
                  : `${formData.donorInfo.firstName} ${formData.donorInfo.lastName}`,
                donorEmail: formData.donorInfo.email,
                donorPhone: formData.donorInfo.phone,
                donorAddress: formData.donorInfo.address,
                taxDeductible: formData.taxDeductible,
                // Add Razorpay payment details
                paymentId: paymentData.paymentId,
                orderId: paymentData.orderId,
                signature: paymentData.signature,
              };

              // Create donation record with payment verification
              const response = await donationApi.createDonation(donationData);

              // Generate receipt
              const receipt: DonationReceipt = {
                receiptId: response.data?.receiptId || `RCP-${Date.now()}`,
                donorName: formData.donorInfo.anonymous
                  ? "Anonymous Donor"
                  : `${formData.donorInfo.firstName} ${formData.donorInfo.lastName}`,
                amount: formData.amount,
                campaignTitle: campaign?.title || "",
                date: new Date().toISOString(),
                paymentMethod: formData.paymentDetails.method,
                taxDeductible: formData.taxDeductible,
                transactionId: paymentData.paymentId,
              };

              setGeneratedReceipt(receipt);
              setDonationId(response.data?._id || response.data?.id || "");
              setCurrentStep(3); // Go to receipt step

              toast({
                title: "Payment Successful!",
                description: "Thank you for your generous contribution.",
                duration: 5000,
              });
            } catch (error: any) {
              console.error("Error creating donation record:", error);
              toast({
                title: "Payment Successful",
                description:
                  "Payment completed but there was an issue saving the record. Please contact support.",
                variant: "destructive",
                duration: 5000,
              });
            }
          },
          (error) => {
            console.error("Razorpay payment error:", error);
            toast({
              title: "Payment Failed",
              description:
                error.message ||
                "Payment could not be processed. Please try again.",
              variant: "destructive",
              duration: 5000,
            });
            setLoading(false);
          }
        );
        return;
      }

      // Handle other payment methods (existing logic)
      const donationData: CreateDonationData = {
        campaignId: campaign?._id || campaign?.title || "",
        amount: formData.amount,
        currency: "INR",
        paymentMethod: formData.paymentDetails.method,
        donationType: formData.recurring ? "recurring" : "one-time",
        message: formData.message || `Donation for ${campaign?.title}`,
        anonymous: formData.donorInfo.anonymous,
        donorName: formData.donorInfo.anonymous
          ? "Anonymous Donor"
          : `${formData.donorInfo.firstName} ${formData.donorInfo.lastName}`,
        donorEmail: formData.donorInfo.email,
        donorPhone: formData.donorInfo.phone,
        donorAddress: formData.donorInfo.address,
        taxDeductible: formData.taxDeductible,
      };

      const response = await donationApi.createDonation(donationData);

      const receipt: DonationReceipt = {
        receiptId: response.data?.receiptId || `RCP-${Date.now()}`,
        donorName: formData.donorInfo.anonymous
          ? "Anonymous Donor"
          : `${formData.donorInfo.firstName} ${formData.donorInfo.lastName}`,
        amount: formData.amount,
        campaignTitle: campaign?.title || "",
        date: new Date().toISOString(),
        paymentMethod: formData.paymentDetails.method,
        taxDeductible: formData.taxDeductible,
        transactionId: response.data?.transactionId || `TXN-${Date.now()}`,
      };

      setGeneratedReceipt(receipt);
      setDonationId(response.data?._id || response.data?.id || "");
      setCurrentStep(3);

      toast({
        title: "Donation Successful!",
        description: "Thank you for your generous contribution.",
        duration: 5000,
      });

      // Emit custom event to refresh donation history
      const customEvent = new CustomEvent("donationCompleted", {
        detail: {
          donation: response.data,
          receipt: receipt,
          campaign: campaign,
        },
      });
      window.dispatchEvent(customEvent);
    } catch (error) {
      console.error("Donation failed:", error);
      toast({
        title: "Donation Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFormData({
      amount: 0,
      donorInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        anonymous: false,
      },
      paymentDetails: {
        method: "UPI",
        upiId: "",
      },
      taxDeductible: true,
      message: "",
      recurring: false,
      recurringFrequency: "monthly",
    });
    setErrors({});
    setGeneratedReceipt(null);
    onClose();
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-IN");
  };

  const downloadReceipt = () => {
    if (!generatedReceipt) return;

    const receiptContent = `
DONATION RECEIPT
================

Receipt ID: ${generatedReceipt.receiptId}
Transaction ID: ${generatedReceipt.transactionId}
Date: ${new Date(generatedReceipt.date).toLocaleDateString()}

Donor: ${generatedReceipt.donorName}
Campaign: ${generatedReceipt.campaignTitle}
Amount: ₹${formatAmount(generatedReceipt.amount)}
Payment Method: ${generatedReceipt.paymentMethod}
Tax Deductible: ${generatedReceipt.taxDeductible ? "Yes" : "No"}

Thank you for your generous contribution!
    `;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donation-receipt-${generatedReceipt.receiptId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!open || !campaign) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div>
            <h3 className="text-xl font-semibold">Donate to Campaign</h3>
            <p className="text-indigo-100 text-sm mt-1">{campaign.title}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-2 hidden sm:block">
                  <div
                    className={`text-sm font-medium ${
                      index <= currentStep ? "text-indigo-600" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.description}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      index < currentStep ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 0: Amount Selection */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Choose Amount
                </h4>

                {/* Quick Amounts */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`p-4 rounded-lg border text-center transition-all ${
                        formData.amount === amount
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, amount }))
                      }
                    >
                      <div className="font-semibold">
                        ₹{formatAmount(amount)}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={formData.amount || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          amount: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>

                {/* Suggested Amounts */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Suggested amounts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.amount === amount
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, amount }))
                        }
                      >
                        ₹{formatAmount(amount)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Donor Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.donorInfo.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            donorInfo: {
                              ...prev.donorInfo,
                              firstName: e.target.value,
                            },
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter first name"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formData.donorInfo.lastName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            donorInfo: {
                              ...prev.donorInfo,
                              lastName: e.target.value,
                            },
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter last name"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        value={formData.donorInfo.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            donorInfo: {
                              ...prev.donorInfo,
                              email: e.target.value,
                            },
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={formData.donorInfo.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            donorInfo: {
                              ...prev.donorInfo,
                              phone: e.target.value,
                            },
                          }))
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address for Tax Deductible */}
                {formData.taxDeductible && (
                  <div className="mt-6">
                    <h5 className="text-md font-medium text-gray-900 mb-3">
                      Address (for tax receipt)
                    </h5>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                          <textarea
                            value={formData.donorInfo.address}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                donorInfo: {
                                  ...prev.donorInfo,
                                  address: e.target.value,
                                },
                              }))
                            }
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                              errors.address
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="Enter your address"
                            rows={3}
                          />
                        </div>
                        {errors.address && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.address}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={formData.donorInfo.city}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                donorInfo: {
                                  ...prev.donorInfo,
                                  city: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Enter city"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            value={formData.donorInfo.state}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                donorInfo: {
                                  ...prev.donorInfo,
                                  state: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Enter state"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pincode
                          </label>
                          <input
                            type="text"
                            value={formData.donorInfo.pincode}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                donorInfo: {
                                  ...prev.donorInfo,
                                  pincode: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Enter pincode"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Anonymous Donation */}
                <div className="mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.donorInfo.anonymous}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          donorInfo: {
                            ...prev.donorInfo,
                            anonymous: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Make this donation anonymous
                    </span>
                  </label>
                </div>

                {/* Tax Deductible */}
                <div className="mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.taxDeductible}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          taxDeductible: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Make this donation tax-deductible
                    </span>
                    <button className="text-gray-400 hover:text-gray-500">
                      <AlertCircle size={16} />
                    </button>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Review Your Donation
                </h4>

                {/* Campaign Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex gap-4">
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">
                        {campaign.title}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {campaign.category}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Donation Summary */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Donation Amount</span>
                    <span className="font-semibold">
                      ₹{formatAmount(formData.amount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Donor</span>
                    <span className="font-semibold">
                      {formData.donorInfo.anonymous
                        ? "Anonymous"
                        : `${formData.donorInfo.firstName} ${formData.donorInfo.lastName}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold">
                      {formData.paymentDetails.method}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Tax Deductible</span>
                    <span className="font-semibold">
                      {formData.taxDeductible ? "Yes" : "No"}
                    </span>
                  </div>

                  {formData.recurring && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Recurring</span>
                      <span className="font-semibold capitalize">
                        {formData.recurringFrequency}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-semibold">₹0</span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-indigo-50 rounded-lg px-4">
                    <span className="text-lg font-semibold text-indigo-900">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-indigo-900">
                      ₹{formatAmount(formData.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Receipt */}
          {currentStep === 3 && generatedReceipt && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Donation Successful!
                </h4>
                <p className="text-gray-600">
                  Thank you for your generous contribution.
                </p>
              </div>

              {/* Receipt Preview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h5 className="font-semibold text-gray-900 mb-4">
                  Donation Receipt
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt ID:</span>
                    <span className="font-medium">
                      {generatedReceipt.receiptId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">
                      {generatedReceipt.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(generatedReceipt.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Donor:</span>
                    <span className="font-medium">
                      {generatedReceipt.donorName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Campaign:</span>
                    <span className="font-medium">
                      {generatedReceipt.campaignTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      ₹{formatAmount(generatedReceipt.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {generatedReceipt.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Deductible:</span>
                    <span className="font-medium">
                      {generatedReceipt.taxDeductible ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {donationId ? (
                  <ReceiptDownload
                    donationId={donationId}
                    receiptId={generatedReceipt.receiptId}
                    variant="default"
                    size="md"
                    disabled={false}
                  />
                ) : (
                  <button
                    onClick={downloadReceipt}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </button>
                )}
                <button
                  onClick={() => {
                    // Share functionality could be added here
                    toast({
                      title: "Share Feature",
                      description:
                        "Share functionality will be implemented soon!",
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Next
              </button>
            ) : currentStep === 2 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Complete Donation
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-100 border-t">
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
            Secure payment powered by{" "}
            <a
              href="https://razorpay.com/"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Razorpay <ExternalLink size={12} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDonationModal;
