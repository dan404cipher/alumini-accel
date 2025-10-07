// RequestModal component for mentorship request submission
// Author: AI Assistant
// Purpose: Modal for submitting mentorship requests

import React, { useState } from "react";
import { X } from "lucide-react";
import type { Mentor, RequestFormData, MentorshipRequest } from "../types";
import {
  validateRequestForm,
  generateRequestId,
  getDefaultRequestData,
} from "../utils";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: MentorshipRequest) => void;
  selectedMentor: Mentor | null;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedMentor,
}) => {
  const [formData, setFormData] = useState<RequestFormData>(
    getDefaultRequestData()
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange =
    (field: keyof RequestFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRequestForm(formData) || !selectedMentor) {
      setErrors({ form: "Please fill in all required fields" });
      return;
    }

    const requestData: MentorshipRequest = {
      id: generateRequestId(),
      applicantName: formData.applicantName,
      applicantProfile: formData.applicantProfile,
      applicantEducation: formData.applicantEducation,
      applicantYear: formData.applicantYear,
      mentorName: selectedMentor.name,
      mentorTitle: selectedMentor.title,
      mentorCompany: selectedMentor.company,
      careerGoals: formData.careerGoals,
      challenges: formData.challenges,
      background: formData.background,
      expectations: formData.expectations,
      timeCommitment: formData.timeCommitment,
      communicationMethod: formData.communicationMethod,
      specificQuestions: formData.specificQuestions,
      status: "Pending",
      submittedAt: new Date(),
    };

    onSubmit(requestData);
    setFormData(getDefaultRequestData());
    onClose();
  };

  if (!isOpen || !selectedMentor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              Request Mentorship
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
              Request mentorship from {selectedMentor.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRequestSubmit} className="p-4 sm:p-6">
          {/* Mentor Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              Mentor Information
            </h3>
            <div className="flex items-center gap-3">
              <div>
                <h4 className="font-medium">{selectedMentor.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedMentor.title} at {selectedMentor.company}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedMentor.yearsExp} years experience
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.applicantName}
                  onChange={handleInputChange("applicantName")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Education Level *
                </label>
                <select
                  value={formData.applicantEducation}
                  onChange={handleInputChange("applicantEducation")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select education level</option>
                  <option value="Bachelor's">Bachelor's Degree</option>
                  <option value="Master's">Master's Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="High School">High School</option>
                  <option value="Associate">Associate Degree</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year *
                </label>
                <select
                  value={formData.applicantYear}
                  onChange={handleInputChange("applicantYear")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select year</option>
                  {Array.from(
                    { length: 20 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                  <option value="Ongoing">Currently studying</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mentorship Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Mentorship Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Career Goals *
                </label>
                <textarea
                  value={formData.careerGoals}
                  onChange={handleInputChange("careerGoals")}
                  rows={3}
                  placeholder="What are your main career objectives?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Challenges *
                </label>
                <textarea
                  value={formData.challenges}
                  onChange={handleInputChange("challenges")}
                  rows={3}
                  placeholder="What challenges are you facing in your career?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Background *
                </label>
                <textarea
                  value={formData.background}
                  onChange={handleInputChange("background")}
                  rows={3}
                  placeholder="Tell us about your professional background and experience"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentorship Expectations *
                </label>
                <textarea
                  value={formData.expectations}
                  onChange={handleInputChange("expectations")}
                  rows={3}
                  placeholder="What do you expect from this mentorship?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Practical Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Practical Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Commitment *
                </label>
                <select
                  value={formData.timeCommitment}
                  onChange={handleInputChange("timeCommitment")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select time commitment</option>
                  <option value="1 hour/month">1 hour per month</option>
                  <option value="2-3 hours/month">2-3 hours per month</option>
                  <option value="1 hour/week">1 hour per week</option>
                  <option value="2-3 hours/week">2-3 hours per week</option>
                  <option value="Flexible">Flexible schedule</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Communication *
                </label>
                <select
                  value={formData.communicationMethod}
                  onChange={handleInputChange("communicationMethod")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select communication method</option>
                  <option value="Video Call">Video Call</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Email">Email</option>
                  <option value="Chat/Message">Chat/Message</option>
                  <option value="Meeting in Person">In Person</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Questions
              </label>
              <textarea
                value={formData.specificQuestions}
                onChange={handleInputChange("specificQuestions")}
                rows={3}
                placeholder="Do you have any specific questions or topics you'd like to discuss?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestModal;
