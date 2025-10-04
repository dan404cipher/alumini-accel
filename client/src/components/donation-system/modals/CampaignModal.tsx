import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CampaignForm, CampaignModalProps } from "../types";

interface CampaignModalState {
  formData: CampaignForm;
  errors: {
    title: string;
    description: string;
    amount: string;
    endDate: string;
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
};

const categoryOptions = [
  "Infrastructure",
  "Scholarships & Student Support",
  "Research & Academics",
  "Sports, Arts & Culture",
  "Community & Social Impact",
];

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

  // Initialize form data for editing
  useEffect(() => {
    if (open && editData) {
      setState({
        formData: editData,
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
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = (evt.target?.result as string) || "";
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, imageFile: file, imagePreviewUrl: url },
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const { formData } = state;
    const newErrors: Partial<typeof state.errors> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Campaign title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Campaign description is required";
    }
    if (
      !formData.amount ||
      isNaN(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    ) {
      newErrors.amount = "Please enter a valid target amount";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    setState((prev) => ({
      ...prev,
      errors: {
        title: newErrors.title || "",
        description: newErrors.description || "",
        amount: newErrors.amount || "",
        endDate: newErrors.endDate || "",
      },
    }));

    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Emit save event - parent component will handle the actual save
    const customEvent = new CustomEvent("campaignSave", {
      detail: { formData: state.formData, editIndex },
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
              <select
                name="category"
                value={state.formData.category}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              >
                <option value="">Select an option</option>
                {categoryOptions.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
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
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a JPG or PNG image. A preview will appear below.
            </p>
            {state.formData.imagePreviewUrl && (
              <div className="mt-2">
                <img
                  src={state.formData.imagePreviewUrl}
                  alt="Preview"
                  className
                  the="w-full h-40 object-cover rounded-lg border"
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
