// RequestCard component for displaying mentorship requests
// Author: AI Assistant
// Purpose: Reusable component for request cards in the mentorship system

import React from "react";
import { Clock, CheckCircle, XCircle, UserCheck } from "lucide-react";
import type { MentorshipRequest } from "../types";
import { getStatusIcon, getStatusColor, formatTimeAgo } from "../utils";

interface RequestCardProps {
  request: MentorshipRequest;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  const handleApprove = () => {
    onApprove?.(request.id);
  };

  const handleReject = () => {
    onReject?.(request.id);
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {request.applicantName}
          </h3>
          <p className="text-gray-600">
            {request.applicantEducation} - {request.applicantYear}
          </p>
          <p className="text-sm text-gray-500">
            Mentorship with {request.mentorName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              request.status
            )}`}
          >
            {getStatusIcon(request.status)} {request.status}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(request.submittedAt)}
          </span>
        </div>
      </div>

      {/* Request Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Career Goals
          </h4>
          <p className="text-sm text-gray-600">{request.careerGoals}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Current Challenges
          </h4>
          <p className="text-sm text-gray-600">{request.challenges}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Background</h4>
          <p className="text-sm text-gray-600">{request.background}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Expectations
          </h4>
          <p className="text-sm text-gray-600">{request.expectations}</p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="font-medium text-gray-700">Time Commitment: </span>
          <span className="text-gray-600">{request.timeCommitment}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Communication: </span>
          <span className="text-gray-600">{request.communicationMethod}</span>
        </div>
        <div className="flex items-center gap-1">
          <UserCheck className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Mentorship Request</span>
        </div>
      </div>

      {/* Specific Questions */}
      {request.specificQuestions && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Specific Questions
          </h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            {request.specificQuestions}
          </p>
        </div>
      )}

      {/* Skills & Goals */}
      {(request.skills || request.goals) && (
        <div className="flex gap-4 mb-4">
          {request.skills && (
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Skills to Develop
              </h4>
              <div className="flex flex-wrap gap-1">
                {request.skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {request.goals && (
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Goals</h4>
              <div className="flex flex-wrap gap-1">
                {request.goals.map((goal: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons (only show for pending requests) */}
      {request.status === "Pending" && (
        <div className="flex justify-end gap-2">
          <button
            onClick={handleReject}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
          >
            <XCircle className="w-4 h-4 inline mr-1" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Approve
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestCard;
