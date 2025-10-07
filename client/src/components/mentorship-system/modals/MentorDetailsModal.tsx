// MentorDetailsModal component for displaying complete mentor information
// Author: AI Assistant
// Purpose: Comprehensive modal showing all mentor details

import React from "react";
import {
  X,
  Star,
  Clock,
  Users,
  Calendar,
  MapPin,
  MessageCircle,
  Award,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import type { Mentor } from "../types";

interface MentorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor | null;
  onRequestMentorship?: (mentor: Mentor) => void;
}

export const MentorDetailsModal: React.FC<MentorDetailsModalProps> = ({
  isOpen,
  onClose,
  mentor,
  onRequestMentorship,
}) => {
  if (!isOpen || !mentor) return null;

  const formatTimeSlots = (slots: string[]) => {
    if (slots.length === 0) return "Not specified";
    return slots.join(", ");
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return "Ongoing";
    if (startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(
        endDate
      ).toLocaleDateString()}`;
    }
    if (startDate) {
      return `From ${new Date(startDate).toLocaleDateString()}`;
    }
    if (endDate) {
      return `Until ${new Date(endDate).toLocaleDateString()}`;
    }
    return "Ongoing";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {mentor.profile ? (
                <img
                  src={mentor.profile}
                  alt={mentor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{mentor.name}</h2>
              <p className="text-blue-100">
                {mentor.title} at {mentor.company}
              </p>
              {mentor.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-300 fill-current" />
                  <span className="text-sm">{mentor.rating}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Experience</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {mentor.yearsExp}
              </p>
              <p className="text-sm text-gray-600">years of experience</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Availability</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {mentor.slots}
              </p>
              <p className="text-sm text-gray-600">slots available</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Communication</h3>
              </div>
              <p className="text-lg font-semibold text-purple-600">
                {mentor.style}
              </p>
            </div>
          </div>

          {/* Expertise */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Expertise & Skills
            </h3>
            <div className="flex flex-wrap gap-3">
              {mentor.expertise.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full font-medium shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Availability Schedule */}
          {mentor.availableSlots && mentor.availableSlots.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Availability Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mentor.availableSlots.map((slot, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {slot.day}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Time Slots:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {slot.timeSlots.map((time, timeIndex) => (
                            <span
                              key={timeIndex}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>

                      {(slot.startDate || slot.endDate) && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            {formatDateRange(slot.startDate, slot.endDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonial */}
          {mentor.testimonial && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Success Story & Testimonial
              </h3>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-l-4 border-purple-500">
                <blockquote className="text-gray-700 leading-relaxed italic">
                  "{mentor.testimonial}"
                </blockquote>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Availability Hours
              </h3>
              <p className="text-gray-700 bg-blue-50 rounded-lg p-3">
                {mentor.hours}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Timezone
              </h3>
              <p className="text-gray-700 bg-green-50 rounded-lg p-3">
                {mentor.timezone}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
            {onRequestMentorship && (
              <button
                onClick={() => onRequestMentorship(mentor)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md hover:shadow-lg"
              >
                Request Mentorship
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDetailsModal;
