import React from "react";
import { Grid, List, Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { MentoringProgram } from "@/services/mentoringProgramApi";

interface ProgramListProps {
  programs: MentoringProgram[];
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onProgramClick: (program: MentoringProgram) => void;
  loading?: boolean;
}

export const ProgramList: React.FC<ProgramListProps> = ({
  programs,
  viewMode,
  onViewModeChange,
  onProgramClick,
  loading = false,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No programs found</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <div
            key={program._id}
            onClick={() => onProgramClick(program)}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{program.name}</h3>
                <span className="text-xs text-gray-500">{program.category}</span>
              </div>
              {getStatusBadge(program.status)}
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {program.shortDescription}
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-2" />
                {format(
                  new Date(program.programDuration.startDate),
                  "MMM d, yyyy"
                )}{" "}
                -{" "}
                {format(new Date(program.programDuration.endDate), "MMM d, yyyy")}
              </div>
              {program.publishedMentorsCount > 0 && (
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-2" />
                  {program.publishedMentorsCount} published mentors
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <div
          key={program._id}
          onClick={() => onProgramClick(program)}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900">{program.name}</h3>
                {getStatusBadge(program.status)}
                <span className="text-xs text-gray-500">{program.category}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{program.shortDescription}</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(program.programDuration.startDate), "MMM d, yyyy")} -{" "}
                  {format(new Date(program.programDuration.endDate), "MMM d, yyyy")}
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Mentee Reg: {format(new Date(program.registrationEndDateMentee), "MMM d")}
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Mentor Reg: {format(new Date(program.registrationEndDateMentor), "MMM d")}
                </div>
                {program.publishedMentorsCount > 0 && (
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {program.publishedMentorsCount} mentors published
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

