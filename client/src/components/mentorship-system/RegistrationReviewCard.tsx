import React from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
} from "lucide-react";
import { format } from "date-fns";

interface RegistrationReviewCardProps {
  registration: any;
  type: "mentor" | "mentee";
  onApprove: () => void;
  onReject: () => void;
  onReconsider?: () => void;
  onDisapprove?: () => void;
  onFillOnBehalf?: () => void;
  canApprove: boolean;
  canReject: boolean;
}

export const RegistrationReviewCard: React.FC<RegistrationReviewCardProps> = ({
  registration,
  type,
  onApprove,
  onReject,
  onReconsider,
  onDisapprove,
  onFillOnBehalf,
  canApprove,
  canReject,
}) => {
  const getStatusBadge = () => {
    switch (registration.status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Submitted
          </span>
        );
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  const getCVUrl = () => {
    const cvPath = type === "mentor" ? registration.mentorCV : registration.menteeCV;
    if (!cvPath) return null;
    if (cvPath.startsWith("http")) return cvPath;
    return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${cvPath.startsWith("/") ? "" : "/"}${cvPath}`;
  };

  const program = registration.programId || {};
  const approvedBy = registration.approvedBy || {};
  const rejectedBy = registration.rejectedBy || {};
  const userName =
    type === "mentor"
      ? registration.user?.firstName && registration.user?.lastName
        ? `${registration.user.firstName} ${registration.user.lastName}`
        : registration.preferredName || `${registration.firstName} ${registration.lastName}`
      : `${registration.firstName} ${registration.lastName}`;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {type === "mentor" ? "Mentor" : "Mentee"} Registration
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Program: <span className="font-medium">{program.name || "N/A"}</span>
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
            Personal Information
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 mr-2" />
              <span className="font-medium">Name:</span>
              <span className="ml-2">
                {registration.title} {userName}
              </span>
            </div>
            {type === "mentor" && registration.preferredName && (
              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">Preferred Name:</span>
                <span className="ml-2">{registration.preferredName}</span>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="font-medium">Personal Email:</span>
              <span className="ml-2">{registration.personalEmail}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="font-medium">Institutional Email:</span>
              <span className="ml-2">{registration.sitEmail}</span>
            </div>
            {registration.mobileNumber && (
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span className="font-medium">Mobile:</span>
                <span className="ml-2">{registration.mobileNumber}</span>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="font-medium">Date of Birth:</span>
              <span className="ml-2">{formatDate(registration.dateOfBirth)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Award className="w-4 h-4 mr-2" />
              <span className="font-medium">Class Of:</span>
              <span className="ml-2">{registration.classOf}</span>
            </div>
            {registration.sitStudentId && (
              <div className="flex items-center text-gray-600">
                <span className="font-medium">Student ID:</span>
                <span className="ml-2">{registration.sitStudentId}</span>
              </div>
            )}
            {registration.sitMatricNumber && (
              <div className="flex items-center text-gray-600">
                <span className="font-medium">Matric Number:</span>
                <span className="ml-2">{registration.sitMatricNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 border-b pb-1">
            Mentoring Details
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Areas of Mentoring:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {registration.areasOfMentoring && registration.areasOfMentoring.length > 0 ? (
                  registration.areasOfMentoring.map((area: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Not specified</span>
                )}
              </div>
            </div>
            {type === "mentee" && (
              <>
                <div>
                  <span className="font-medium text-gray-700">Event Slot Preference:</span>
                  <span className="ml-2 text-gray-600">
                    {registration.eventSlotPreference || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Meetup Preference:</span>
                  <span className="ml-2 text-gray-600">
                    {registration.eventMeetupPreference || "N/A"}
                  </span>
                </div>
              </>
            )}
            {type === "mentor" && registration.eventSlotPreference && (
              <div>
                <span className="font-medium text-gray-700">Event Slot Preference:</span>
                <div className="mt-1 text-gray-600 text-xs">
                  {registration.eventSlotPreference.startDate &&
                    formatDate(registration.eventSlotPreference.startDate)}{" "}
                  {registration.eventSlotPreference.endDate &&
                    `to ${formatDate(registration.eventSlotPreference.endDate)}`}
                  {registration.eventSlotPreference.startTime &&
                    ` (${registration.eventSlotPreference.startTime} - ${registration.eventSlotPreference.endTime || ""})`}
                </div>
              </div>
            )}
            {type === "mentor" && registration.eventMeetupPreference && (
              <div>
                <span className="font-medium text-gray-700">Meetup Preference:</span>
                <span className="ml-2 text-gray-600">
                  {registration.eventMeetupPreference}
                </span>
              </div>
            )}
            {registration.fbPreference && (
              <div>
                <span className="font-medium text-gray-700">F&B Preference:</span>
                <span className="ml-2 text-gray-600">{registration.fbPreference}</span>
              </div>
            )}
            {registration.dietaryRestrictions && (
              <div>
                <span className="font-medium text-gray-700">Dietary Restrictions:</span>
                <span className="ml-2 text-gray-600">{registration.dietaryRestrictions}</span>
              </div>
            )}
            {type === "mentor" && registration.optionToReceiveFB && (
              <div className="text-green-600 text-xs">✓ Opted to receive F&B</div>
            )}
          </div>
        </div>
      </div>

      {/* CV */}
      {getCVUrl() && (
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">CV Document</span>
            </div>
            <a
              href={getCVUrl() || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </a>
          </div>
        </div>
      )}

      {/* Status Information */}
      <div className="border-t pt-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Submitted:</span>
            <span className="ml-2 text-gray-600">
              {formatDate(registration.submittedAt)}
            </span>
          </div>
          {registration.status === "approved" && registration.approvedAt && (
            <>
              <div>
                <span className="font-medium text-gray-700">Approved:</span>
                <span className="ml-2 text-gray-600">
                  {formatDate(registration.approvedAt)}
                </span>
              </div>
              {approvedBy.firstName && (
                <div>
                  <span className="font-medium text-gray-700">Approved By:</span>
                  <span className="ml-2 text-gray-600">
                    {approvedBy.firstName} {approvedBy.lastName}
                  </span>
                </div>
              )}
            </>
          )}
          {registration.status === "rejected" && registration.rejectedAt && (
            <>
              <div>
                <span className="font-medium text-gray-700">Rejected:</span>
                <span className="ml-2 text-gray-600">
                  {formatDate(registration.rejectedAt)}
                </span>
              </div>
              {rejectedBy.firstName && (
                <div>
                  <span className="font-medium text-gray-700">Rejected By:</span>
                  <span className="ml-2 text-gray-600">
                    {rejectedBy.firstName} {rejectedBy.lastName}
                  </span>
                </div>
              )}
              {registration.rejectionReason && (
                <div className="md:col-span-2 mt-2 p-3 bg-red-50 border border-red-200 rounded">
                  <span className="font-medium text-red-700">Rejection Reason:</span>
                  <p className="text-red-600 mt-1">{registration.rejectionReason}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {registration.status === "submitted" && (
          <>
            {canApprove && (
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Approve
              </button>
            )}
            {canReject && (
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                <XCircle className="w-4 h-4 inline mr-1" />
                Reject
              </button>
            )}
          </>
        )}
        {registration.status === "rejected" && onReconsider && (
          <button
            onClick={onReconsider}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Reconsider
          </button>
        )}
        {registration.status === "approved" && onDisapprove && canReject && (
          <button
            onClick={onDisapprove}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium"
          >
            <XCircle className="w-4 h-4 inline mr-1" />
            Disapprove
          </button>
        )}
        {onFillOnBehalf && (
          <button
            onClick={onFillOnBehalf}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <User className="w-4 h-4 inline mr-1" />
            Fill on Behalf
          </button>
        )}
      </div>
    </div>
  );
};

