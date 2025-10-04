// MentorModal component for creating/editing mentors
// Author: AI Assistant
// Purpose: Modal for mentor registration and management

import React, { useState } from "react";
import { X, Upload, Plus, Trash2 } from "lucide-react";
import type { Mentor, MentorFormData } from "../types";
import { validateMentorForm, getDefaultMentorData } from "../utils";

interface MentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mentor: Mentor) => void;
  editMentor?: Mentor | null;
  title?: string;
}

export const MentorModal: React.FC<MentorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editMentor,
  title = "Register as Mentor",
}) => {
  const [formData, setFormData] = useState<MentorFormData>(
    editMentor || getDefaultMentorData()
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newSkill, setNewSkill] = useState("");

  const handleInputChange =
    (field: keyof MentorFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value = e.target.value;

      if (field === "yearsExp" || field === "slots") {
        setFormData((prev) => ({
          ...prev,
          [field]: value === "" ? "" : Number(value),
        }));
      } else if (field === "timezone") {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      }

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    };

  const handleExpertiseInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      setFormData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const handleRemoveExpertise = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMentorForm(formData)) {
      setErrors({ form: "Please fill in all required fields" });
      return;
    }

    onSave(formData);
    setFormData(getDefaultMentorData());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange("company")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  value={formData.yearsExp}
                  onChange={handleInputChange("yearsExp")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Expertise */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Expertise
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills & Domains
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.expertise.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(skill)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X size={16} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleExpertiseInput}
                  placeholder="Add skill and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Availability
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Slots *
                </label>
                <input
                  type="number"
                  value={formData.slots}
                  onChange={handleInputChange("slots")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Hours *
                </label>
                <input
                  type="text"
                  value={formData.hours}
                  onChange={handleInputChange("hours")}
                  placeholder="e.g., 9 AM - 6 PM EST"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone *
                </label>
                <select
                  value={formData.timezone}
                  onChange={handleInputChange("timezone")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select timezone</option>
                  <option value="UTC-5">UTC-5 (EST)</option>
                  <option value="UTC-6">UTC-6 (CST)</option>
                  <option value="UTC-7">UTC-7 (MST)</option>
                  <option value="UTC-8">UTC-8 (PST)</option>
                  <option value="UTC+0">UTC+0 (GMT)</option>
                  <option value="UTC+5:30">UTC+5:30 (IST)</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentoring Style *
                </label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={handleInputChange("style")}
                  placeholder="e.g., Collaborative, Structured, Flexible"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Testimonial
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Success Story / Testimonial *
              </label>
              <textarea
                value={formData.testimonial}
                onChange={handleInputChange("testimonial")}
                rows={4}
                placeholder="Share a success story or testimonial..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Error Display */}
          {errors.form && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{errors.form}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {editMentor ? "Update Mentor" : "Register Mentor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorModal;
