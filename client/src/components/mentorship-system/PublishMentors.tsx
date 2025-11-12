import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ViewPublishedMentorsLink } from "./ViewPublishedMentorsLink";

interface PublishMentorsProps {
  programId: string;
  onPublishChange?: () => void;
}

interface Mentor {
  _id: string;
  preferredName: string;
  firstName: string;
  lastName: string;
  areasOfMentoring: string[];
  personalEmail: string;
  classOf: number;
}

export const PublishMentors: React.FC<PublishMentorsProps> = ({
  programId,
  onPublishChange,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [approvedMentors, setApprovedMentors] = useState<Mentor[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProgram();
    fetchApprovedMentors();
  }, [programId]);

  const fetchProgram = async () => {
    try {
      const response = await api.get(`/mentoring-programs/${programId}`);
      if (response.data.success) {
        setProgram(response.data.data.program);
        
        // If already published, load selected mentors
        if (response.data.data.program.mentorsPublished && response.data.data.program.publishedMentorIds) {
          setSelectedMentors(
            new Set(
              response.data.data.program.publishedMentorIds.map((id: any) =>
                id.toString()
              )
            )
          );
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch program",
        variant: "destructive",
      });
    }
  };

  const fetchApprovedMentors = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/mentor-registrations/program/${programId}`, {
        params: { status: "approved" },
      });
      if (response.data.success) {
        setApprovedMentors(response.data.data.registrations || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMentorSelection = (mentorId: string) => {
    const newSelected = new Set(selectedMentors);
    if (newSelected.has(mentorId)) {
      newSelected.delete(mentorId);
    } else {
      newSelected.add(mentorId);
    }
    setSelectedMentors(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(approvedMentors.map((m) => m._id));
    setSelectedMentors(allIds);
  };

  const deselectAll = () => {
    setSelectedMentors(new Set());
  };

  const handlePublish = () => {
    if (selectedMentors.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one mentor to publish",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmPublish = async () => {
    setPublishing(true);
    try {
      const response = await api.put(`/mentoring-programs/${programId}/publish-mentors`, {
        mentorIds: Array.from(selectedMentors),
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setShowConfirmModal(false);
        fetchProgram();
        if (onPublishChange) {
          onPublishChange();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to publish mentors",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (
      !confirm(
        "Are you sure you want to unpublish all mentors? They will no longer be visible on the public website."
      )
    )
      return;

    setPublishing(true);
    try {
      const response = await api.put(
        `/mentoring-programs/${programId}/unpublish-mentors`
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Mentors unpublished successfully",
        });
        setSelectedMentors(new Set());
        fetchProgram();
        if (onPublishChange) {
          onPublishChange();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to unpublish mentors",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const filteredMentors = approvedMentors.filter((mentor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      mentor.preferredName?.toLowerCase().includes(searchLower) ||
      mentor.firstName.toLowerCase().includes(searchLower) ||
      mentor.lastName.toLowerCase().includes(searchLower) ||
      mentor.areasOfMentoring.some((area) =>
        area.toLowerCase().includes(searchLower)
      )
    );
  });

  const selectedMentorsList = filteredMentors.filter((m) =>
    selectedMentors.has(m._id)
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Publish Mentors
          </h2>
          <p className="text-gray-600">
            Select mentors to publish on the public website
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {program?.mentorsPublished && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Published</div>
              <div className="font-semibold text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {program.publishedMentorsCount} mentors
              </div>
              {program.mentorsPublishedAt && (
                <div className="text-xs text-gray-500 flex items-center mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(program.mentorsPublishedAt).toLocaleDateString()}
                </div>
              )}
              <button
                onClick={() => navigate(`/published-mentors/${programId}`)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Public Page
              </button>
            </div>
          )}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Publication Status */}
      {program?.mentorsPublished && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="font-semibold text-green-800 mb-1">
                Mentors Published
              </div>
              <div className="text-sm text-green-700 mb-2">
                {program.publishedMentorsCount} mentor(s) are currently visible
                on the public website
              </div>
              {program.mentorsPublishedAt && (
                <div className="text-xs text-green-600 mb-2">
                  Published on:{" "}
                  {new Date(program.mentorsPublishedAt).toLocaleString()}
                </div>
              )}
              <ViewPublishedMentorsLink
                programId={programId}
                programName={program.name}
                mentorsPublished={program.mentorsPublished}
                publishedMentorsCount={program.publishedMentorsCount}
                variant="link"
              />
            </div>
            <button
              onClick={handleUnpublish}
              disabled={publishing}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center ml-4"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Unpublish
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search mentors by name or expertise..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Selection Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {selectedMentors.size} of {approvedMentors.length} selected
        </div>
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Mentors List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : approvedMentors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No approved mentors found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor._id}
                className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedMentors.has(mentor._id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleMentorSelection(mentor._id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {mentor.preferredName ||
                        `${mentor.firstName} ${mentor.lastName}`}
                    </h3>
                  </div>
                  {selectedMentors.has(mentor._id) ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                  )}
                </div>
                {mentor.areasOfMentoring && mentor.areasOfMentoring.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mentor.areasOfMentoring.slice(0, 3).map((area, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {area}
                      </span>
                    ))}
                    {mentor.areasOfMentoring.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{mentor.areasOfMentoring.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Publish Button */}
          {selectedMentors.size > 0 && !program?.mentorsPublished && (
            <div className="flex justify-end">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                {publishing ? "Publishing..." : `Publish ${selectedMentors.size} Mentor(s)`}
              </button>
            </div>
          )}

          {/* Update Published Button */}
          {selectedMentors.size > 0 && program?.mentorsPublished && (
            <div className="flex justify-end">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                {publishing
                  ? "Updating..."
                  : `Update Published Mentors (${selectedMentors.size} selected)`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {showPreview && selectedMentorsList.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Preview Published Mentors</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedMentorsList.map((mentor) => (
                  <div
                    key={mentor._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {mentor.preferredName ||
                        `${mentor.firstName} ${mentor.lastName}`}
                    </h3>
                    {mentor.areasOfMentoring && mentor.areasOfMentoring.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Areas of Expertise:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mentor.areasOfMentoring.map((area, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Publish Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Confirm Publish</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to publish {selectedMentors.size} mentor(s)?
              They will be visible on the public website.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={publishing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Confirm Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

