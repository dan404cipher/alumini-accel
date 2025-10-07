// MentorCard component for displaying individual mentor information
// Author: AI Assistant
// Purpose: Reusable component for mentor cards in the mentorship system

import React from "react";
import { Star, Clock, MessageCircle, Users } from "lucide-react";
import type { Mentor } from "../types";
import { truncateText, formatAvailability } from "../utils";

interface MentorCardProps {
  mentor: Mentor;
  onShowStyle?: (style: string) => void;
  onShowTestimonial?: (testimonial: string) => void;
  onRequestMentorship?: (mentor: Mentor) => void;
  onViewDetails?: (mentor: Mentor) => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  onShowStyle,
  onShowTestimonial,
  onRequestMentorship,
  onViewDetails,
}) => {
  return (
    <div
      className="bg-white border rounded-lg p-4 sm:p-6 shadow-lg hover:shadow-xl transition duration-300 h-full flex flex-col cursor-pointer hover:border-blue-300"
      onClick={() => onViewDetails?.(mentor)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          {mentor.profile ? (
            <img
              src={mentor.profile}
              alt={mentor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-6 h-6 text-gray-500" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900">{mentor.name}</h3>
          <p className="text-gray-600">{mentor.title}</p>
          <p className="text-gray-500 text-sm">{mentor.company}</p>

          {mentor.rating && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{mentor.rating}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowStyle?.(mentor.style);
            }}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition"
          >
            Style
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowTestimonial?.(mentor.testimonial);
            }}
            className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition"
          >
            Testimonial
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{mentor.yearsExp} years exp</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{formatAvailability(mentor.slots)}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{mentor.communicationStyle || "Flexible"}</span>
        </div>
        {mentor.timezone && <span>{mentor.timezone}</span>}
      </div>

      {/* Expertise */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Expertise:</h4>
        <div className="flex flex-wrap gap-2">
          {mentor.expertise.map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Availability:
        </h4>
        <p className="text-sm text-gray-600">{mentor.hours}</p>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRequestMentorship?.(mentor);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Request Mentorship
        </button>
      </div>
    </div>
  );
};

export default MentorCard;
