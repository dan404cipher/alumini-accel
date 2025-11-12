import React from "react";
import { Building, Award, Briefcase } from "lucide-react";

interface PublishedMentorCardProps {
  mentor: {
    _id: string;
    name: string;
    title?: string;
    company?: string;
    position?: string;
    industry?: string;
    experience?: number;
    graduationYear?: number;
    program?: string;
    areasOfMentoring: string[];
    classOf?: number;
  };
}

export const PublishedMentorCard: React.FC<PublishedMentorCardProps> = ({
  mentor,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {mentor.title && `${mentor.title} `}
          {mentor.name}
        </h3>
        {mentor.company && (
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <Building className="w-4 h-4 mr-2" />
            {mentor.company}
          </div>
        )}
        {mentor.position && (
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <Briefcase className="w-4 h-4 mr-2" />
            {mentor.position}
          </div>
        )}
      </div>

      {mentor.industry && (
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">Industry: </span>
          <span className="text-sm text-gray-600">{mentor.industry}</span>
        </div>
      )}

      {(mentor.experience || mentor.graduationYear || mentor.classOf) && (
        <div className="mb-3 flex flex-wrap gap-3 text-sm text-gray-600">
          {mentor.experience && (
            <div className="flex items-center">
              <Award className="w-4 h-4 mr-1" />
              {mentor.experience} years experience
            </div>
          )}
          {(mentor.graduationYear || mentor.classOf) && (
            <div>
              Class of {mentor.graduationYear || mentor.classOf}
            </div>
          )}
        </div>
      )}

      {mentor.program && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">Program: </span>
          {mentor.program}
        </div>
      )}

      {mentor.areasOfMentoring && mentor.areasOfMentoring.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Areas of Mentoring:
          </div>
          <div className="flex flex-wrap gap-2">
            {mentor.areasOfMentoring.map((area, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

