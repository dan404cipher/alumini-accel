// MentorModal component for creating/editing mentors
// Author: AI Assistant
// Purpose: Enhanced modal for mentor registration and management with detailed validation

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Clock, Calendar, MapPin } from "lucide-react";
import type { Mentor, MentorFormData } from "../types";
import { validateMentorFormDetailed, getDefaultMentorData } from "../utils";

interface MentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mentor: Mentor) => void;
  editMentor?: Mentor | null;
  title?: string;
}

interface AvailabilitySlot {
  day: string;
  timeSlots: string[];
  startDate?: string;
  endDate?: string;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const TIMEZONES = [
  "UTC",
  "GMT",
  "EST",
  "PST",
  "CST",
  "MST",
  "IST",
  "JST",
  "AEST",
  "CET",
  "EET",
  "MSK",
];

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
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");

  // Initialize availability slots from formData
  useEffect(() => {
    if (formData.availableSlots && Array.isArray(formData.availableSlots)) {
      setAvailabilitySlots(formData.availableSlots as AvailabilitySlot[]);
    } else {
      setAvailabilitySlots([]);
    }
  }, [formData.availableSlots]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(editMentor || getDefaultMentorData());
      setErrors({});
      setNewSkill("");
      setSelectedDay("");
      setSelectedTimeSlots([]);
      setSelectedStartDate("");
      setSelectedEndDate("");
      setAvailabilitySlots(editMentor?.availableSlots || []);
    }
  }, [isOpen, editMentor]);

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
      if (formData.expertise.length >= 10) {
        setErrors((prev) => ({
          ...prev,
          expertise: "Cannot add more than 10 expertise areas",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        expertise: [...prev.expertise, newSkill.trim()],
      }));
      setNewSkill("");

      // Clear expertise error
      if (errors.expertise) {
        setErrors((prev) => ({
          ...prev,
          expertise: "",
        }));
      }
    }
  };

  const handleRemoveExpertise = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((s) => s !== skill),
    }));
  };

  // Availability management functions
  const handleAddAvailabilitySlot = () => {
    if (!selectedDay || selectedTimeSlots.length === 0) {
      setErrors((prev) => ({
        ...prev,
        availability: "Please select a day and at least one time slot",
      }));
      return;
    }

    const newSlot: AvailabilitySlot = {
      day: selectedDay,
      timeSlots: [...selectedTimeSlots],
      startDate: selectedStartDate || undefined,
      endDate: selectedEndDate || undefined,
    };

    setAvailabilitySlots((prev) => [...prev, newSlot]);
    setFormData((prev) => ({
      ...prev,
      availableSlots: Array.isArray(prev.availableSlots)
        ? [...prev.availableSlots, newSlot]
        : [newSlot],
    }));

    // Clear selections and errors
    setSelectedDay("");
    setSelectedTimeSlots([]);
    setSelectedStartDate("");
    setSelectedEndDate("");
    setErrors((prev) => ({
      ...prev,
      availability: "",
    }));
  };

  const handleRemoveAvailabilitySlot = (index: number) => {
    setAvailabilitySlots((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      availableSlots: Array.isArray(prev.availableSlots)
        ? prev.availableSlots.filter((_, i) => i !== index)
        : [],
    }));
  };

  const handleTimeSlotToggle = (timeSlot: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(timeSlot)
        ? prev.filter((t) => t !== timeSlot)
        : [...prev, timeSlot]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Update formData with availability slots
    const updatedFormData = {
      ...formData,
      availableSlots: availabilitySlots,
    };

    const validation = validateMentorFormDetailed(updatedFormData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(updatedFormData);
    setFormData(getDefaultMentorData());
    setAvailabilitySlots([]);
    setErrors({});
    onClose();
  };

  const getCharacterCount = (text: string, maxLength: number) => {
    return `${text.length}/${maxLength}`;
  };

  const getFieldErrorClass = (field: string) => {
    return errors[field]
      ? "border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:ring-blue-500";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                    "name"
                  )}`}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {getCharacterCount(formData.name, 50)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange("title")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                    "title"
                  )}`}
                  placeholder="e.g., Senior Software Engineer"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-red-600 text-xs mt-1">{errors.title}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {getCharacterCount(formData.title, 100)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange("company")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                    "company"
                  )}`}
                  placeholder="e.g., Google, Microsoft"
                  maxLength={100}
                />
                {errors.company && (
                  <p className="text-red-600 text-xs mt-1">{errors.company}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {getCharacterCount(formData.company, 100)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  value={formData.yearsExp}
                  onChange={handleInputChange("yearsExp")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                    "yearsExp"
                  )}`}
                  min="0"
                  max="50"
                  placeholder="e.g., 5"
                />
                {errors.yearsExp && (
                  <p className="text-red-600 text-xs mt-1">{errors.yearsExp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Mentee Slots *
                </label>
                <input
                  type="number"
                  value={formData.slots}
                  onChange={handleInputChange("slots")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                    "slots"
                  )}`}
                  min="1"
                  max="10"
                  placeholder="e.g., 3"
                />
                {errors.slots && (
                  <p className="text-red-600 text-xs mt-1">{errors.slots}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  How many mentees can you mentor simultaneously?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone *
                </label>
                <select
                  value={formData.timezone}
                  onChange={handleInputChange("timezone")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                    "timezone"
                  )}`}
                >
                  <option value="">Select your timezone</option>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="text-red-600 text-xs mt-1">{errors.timezone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Expertise */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Expertise Areas *
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleExpertiseInput}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add expertise area (e.g., React, Python, Product Management)"
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSkill.trim() && formData.expertise.length < 10) {
                      setFormData((prev) => ({
                        ...prev,
                        expertise: [...prev.expertise, newSkill.trim()],
                      }));
                      setNewSkill("");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {errors.expertise && (
                <p className="text-red-600 text-sm">{errors.expertise}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {formData.expertise.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-gray-500 text-xs">
                {formData.expertise.length}/10 expertise areas added
              </p>
            </div>
          </div>

          {/* Availability Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Availability Schedule
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When does this availability start? Leave empty for immediate
                    availability.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={selectedEndDate}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    min={
                      selectedStartDate ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When does this availability end? Leave empty for ongoing
                    availability.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Day
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Choose a day</option>
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {TIME_SLOTS.map((timeSlot) => (
                      <button
                        key={timeSlot}
                        type="button"
                        onClick={() => handleTimeSlotToggle(timeSlot)}
                        className={`px-2 py-1 text-xs rounded ${
                          selectedTimeSlots.includes(timeSlot)
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-green-50"
                        }`}
                      >
                        {timeSlot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddAvailabilitySlot}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </button>
                </div>
              </div>

              {errors.availability && (
                <p className="text-red-600 text-sm">{errors.availability}</p>
              )}

              {/* Display added availability slots */}
              {availabilitySlots.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Your Availability ({availabilitySlots.length} days)
                  </h4>
                  <div className="space-y-2">
                    {availabilitySlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <div className="flex flex-col">
                            <span className="font-medium capitalize">
                              {slot.day}
                            </span>
                            {(slot.startDate || slot.endDate) && (
                              <span className="text-xs text-gray-500">
                                {slot.startDate && slot.endDate
                                  ? `${new Date(
                                      slot.startDate
                                    ).toLocaleDateString()} - ${new Date(
                                      slot.endDate
                                    ).toLocaleDateString()}`
                                  : slot.startDate
                                  ? `From ${new Date(
                                      slot.startDate
                                    ).toLocaleDateString()}`
                                  : `Until ${new Date(
                                      slot.endDate!
                                    ).toLocaleDateString()}`}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {slot.timeSlots.map((time) => (
                              <span
                                key={time}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                              >
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAvailabilitySlot(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>💡 Tip:</strong> Add your available days and time slots.
                This helps mentees know when they can schedule sessions with
                you.
              </div>
            </div>
          </div>

          {/* Mentoring Style */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Mentoring Style *
            </h3>
            <textarea
              value={formData.style}
              onChange={handleInputChange("style")}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                "style"
              )}`}
              placeholder="Describe your mentoring approach and style..."
              maxLength={500}
            />
            {errors.style && (
              <p className="text-red-600 text-xs mt-1">{errors.style}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {getCharacterCount(formData.style, 500)}
            </p>
          </div>

          {/* Available Hours */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Available Hours *
            </h3>
            <input
              type="text"
              value={formData.hours}
              onChange={handleInputChange("hours")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                "hours"
              )}`}
              placeholder="e.g., Weekdays 6-8 PM, Weekends flexible"
              maxLength={100}
            />
            {errors.hours && (
              <p className="text-red-600 text-xs mt-1">{errors.hours}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {getCharacterCount(formData.hours, 100)}
            </p>
          </div>

          {/* Testimonial */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Success Story / Testimonial *
            </h3>
            <textarea
              value={formData.testimonial}
              onChange={handleInputChange("testimonial")}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorClass(
                "testimonial"
              )}`}
              placeholder="Share a success story or testimonial about your mentoring experience..."
              maxLength={1000}
            />
            {errors.testimonial && (
              <p className="text-red-600 text-xs mt-1">{errors.testimonial}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {getCharacterCount(formData.testimonial, 1000)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {editMentor ? "Update Mentor" : "Register as Mentor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorModal;
