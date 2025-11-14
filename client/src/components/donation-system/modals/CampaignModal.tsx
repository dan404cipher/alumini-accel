import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CampaignForm, CampaignModalProps } from "../types";
import { categoryAPI } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignModalState {
  formData: CampaignForm;
  errors: {
    title: string;
    description: string;
    amount: string;
    endDate: string;
    category: string;
    imageFile: string;
  };
}

const defaultFormData: CampaignForm = {
  title: "",
  description: "",
  category: "",
  amount: "",
  endDate: "",
  imageUrl: "",
  imageFile: null,
  imagePreviewUrl: "",
};

const defaultErrors = {
  title: "",
  description: "",
  amount: "",
  endDate: "",
  category: "",
  imageFile: "",
};

// Loaded dynamically; fallback to empty
const staticFallbackCategories: string[] = [];

const CampaignModal: React.FC<CampaignModalProps> = ({
  open,
  onClose,
  editData,
  editIndex,
}) => {
  const [state, setState] = useState<CampaignModalState>({
    formData: defaultFormData,
    errors: defaultErrors,
  });
  const [categoryOptions, setCategoryOptions] = useState<string[]>(
    staticFallbackCategories
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoryAPI.getAll({
          entityType: "donation_category",
        });
        const names = Array.isArray(res.data)
          ? (res.data as any[])
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        if (mounted) setCategoryOptions(names);
      } catch (_e) {
        // keep fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize form data for editing
  useEffect(() => {
    if (open && editData) {
      setState({
        formData: {
          ...editData,
          // If editing and there's an existing imageUrl but no imagePreviewUrl, use imageUrl as preview
          imagePreviewUrl: editData.imagePreviewUrl || editData.imageUrl || "",
        },
        errors: defaultErrors,
      });
    } else if (open) {
      setState({
        formData: defaultFormData,
        errors: defaultErrors,
      });
    }
  }, [open, editData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [name]: value },
      errors: { ...prev.errors, [name]: "" },
    }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, imageFile: null, imagePreviewUrl: "" },
        errors: { ...prev.errors, imageFile: "" }, // Clear image error
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = (evt.target?.result as string) || "";
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, imageFile: file, imagePreviewUrl: url },
        errors: { ...prev.errors, imageFile: "" }, // Clear image error
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const { formData } = state;
    const newErrors: Partial<typeof state.errors> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Campaign title is required";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Campaign title must be at least 5 characters";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Campaign title must be less than 100 characters";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "Campaign description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description =
        "Campaign description must be at least 20 characters";
    } else if (formData.description.trim().length > 1000) {
      newErrors.description =
        "Campaign description must be less than 1000 characters";
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = "Target amount is required";
    } else if (isNaN(Number(formData.amount))) {
      newErrors.amount = "Please enter a valid number";
    } else if (Number(formData.amount) <= 0) {
      newErrors.amount = "Target amount must be greater than 0";
    } else if (Number(formData.amount) < 1000) {
      newErrors.amount = "Target amount must be at least ₹1,000";
    } else if (Number(formData.amount) > 100000000) {
      newErrors.amount = "Target amount cannot exceed ₹10,00,00,000";
    }

    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else {
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      if (endDate <= today) {
        newErrors.endDate = "End date must be in the future";
      } else if (
        endDate > new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
      ) {
        newErrors.endDate = "End date cannot be more than 1 year from now";
      }
    }

    // Image validation (optional but if provided, validate)
    if (formData.imageFile) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (formData.imageFile.size > maxSize) {
        newErrors.imageFile = "Image size must be less than 5MB";
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(formData.imageFile.type)) {
        newErrors.imageFile =
          "Please upload a valid image (JPEG, PNG, GIF, WebP)";
      }
    }

    setState((prev) => ({
      ...prev,
      errors: {
        title: newErrors.title || "",
        description: newErrors.description || "",
        amount: newErrors.amount || "",
        endDate: newErrors.endDate || "",
        category: newErrors.category || "",
        imageFile: newErrors.imageFile || "",
      },
    }));

    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Emit save event - parent component will handle the actual save
    const customEvent = new CustomEvent("campaignSave", {
      detail: {
        formData: state.formData,
        editIndex,
        campaignId: editData?.campaignId,
      },
    });

    window.dispatchEvent(customEvent);

    setState({
      formData: defaultFormData,
      errors: defaultErrors,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editData ? "Edit Campaign" : "Create New Campaign"}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Campaign Title *
            </label>
            <input
              type="text"
              name="title"
              value={state.formData.title}
              onChange={handleChange}
              placeholder="Enter campaign title"
              className={`mt-1 w-full border ${
                state.errors.title ? "border-red-500" : "border-gray-300"
              } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
            />
            {state.errors.title && (
              <p className="text-red-500 text-xs mt-1">{state.errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              name="description"
              value={state.formData.description}
              onChange={handleChange}
              placeholder="Describe your campaign goals and impact"
              rows={3}
              className={`mt-1 w-full border ${
                state.errors.description ? "border-red-500" : "border-gray-300"
              } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
            />
            {state.errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {state.errors.description}
              </p>
            )}
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <Select
                value={state.formData.category}
                onValueChange={(value) =>
                  setState((prev) => ({
                    ...prev,
                    formData: { ...prev.formData, category: value },
                    errors: { ...prev.errors, category: "" },
                  }))
                }
              >
                <SelectTrigger className={`mt-1 ${
                  state.errors.category ? "border-red-500" : ""
                }`}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.length === 0 ? (
                    <SelectItem value="__noopts__" disabled>
                      No saved categories
                    </SelectItem>
                  ) : (
                    categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {state.errors.category && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.category}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={state.formData.amount}
                onChange={handleChange}
                placeholder="Enter target amount"
                className={`mt-1 w-full border ${
                  state.errors.amount ? "border-red-500" : "border-gray-300"
                } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
              />
              {state.errors.amount && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Campaign End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={state.formData.endDate}
              onChange={handleChange}
              className={`mt-1 w-full border ${
                state.errors.endDate ? "border-red-500" : "border-gray-300"
              } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
            />
            {state.errors.endDate && (
              <p className="text-red-500 text-xs mt-1">
                {state.errors.endDate}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Campaign Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm ${
                state.errors.imageFile ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a JPG or PNG image. A preview will appear below.
            </p>
            {state.errors.imageFile && (
              <p className="text-red-500 text-xs mt-1">
                {state.errors.imageFile}
              </p>
            )}
            {state.formData.imagePreviewUrl && (
              <div className="mt-2">
                <img
                  src={state.formData.imagePreviewUrl}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm"
            >
              {editData ? "Save Changes" : "+ Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal;
