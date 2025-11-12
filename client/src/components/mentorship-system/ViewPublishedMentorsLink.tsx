import React from "react";
import { Link } from "react-router-dom";
import { Users, Eye } from "lucide-react";

interface ViewPublishedMentorsLinkProps {
  programId: string;
  programName?: string;
  mentorsPublished?: boolean;
  publishedMentorsCount?: number;
  variant?: "button" | "link" | "badge";
}

export const ViewPublishedMentorsLink: React.FC<ViewPublishedMentorsLinkProps> = ({
  programId,
  programName,
  mentorsPublished,
  publishedMentorsCount,
  variant = "button",
}) => {
  if (!mentorsPublished || !publishedMentorsCount || publishedMentorsCount === 0) {
    return null;
  }

  if (variant === "badge") {
    return (
      <Link
        to={`/published-mentors/${programId}`}
        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200"
      >
        <Eye className="w-3 h-3 mr-1" />
        View {publishedMentorsCount} Published Mentor{publishedMentorsCount !== 1 ? "s" : ""}
      </Link>
    );
  }

  if (variant === "link") {
    return (
      <Link
        to={`/published-mentors/${programId}`}
        className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
      >
        <Users className="w-4 h-4 mr-1" />
        View Published Mentors ({publishedMentorsCount})
      </Link>
    );
  }

  return (
    <Link
      to={`/published-mentors/${programId}`}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      <Eye className="w-4 h-4 mr-2" />
      View Published Mentors ({publishedMentorsCount})
    </Link>
  );
};

