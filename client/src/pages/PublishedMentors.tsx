import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Users,
  ArrowLeft,
  Building,
  Briefcase,
} from "lucide-react";
import api from "@/lib/api";
import { PublishedMentorCard } from "@/components/mentorship-system/PublishedMentorCard";

export const PublishedMentors: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterExpertise, setFilterExpertise] = useState("");

  useEffect(() => {
    if (programId) {
      fetchPublishedMentors();
    }
  }, [programId]);

  const fetchPublishedMentors = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/mentoring-programs/${programId}/published-mentors`
      );
      if (response.data.success) {
        setProgram(response.data.data.program);
        setMentors(response.data.data.mentors || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch published mentors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      !searchTerm ||
      mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.areasOfMentoring?.some((area: string) =>
        area.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesIndustry =
      !filterIndustry ||
      (mentor.industry &&
        mentor.industry.toLowerCase().includes(filterIndustry.toLowerCase()));

    const matchesExpertise =
      !filterExpertise ||
      mentor.areasOfMentoring?.some((area: string) =>
        area.toLowerCase().includes(filterExpertise.toLowerCase())
      );

    return matchesSearch && matchesIndustry && matchesExpertise;
  });

  // Get unique industries and expertise areas for filters
  const industries = Array.from(
    new Set(mentors.map((m) => m.industry).filter(Boolean))
  ).sort();
  const expertiseAreas = Array.from(
    new Set(
      mentors.flatMap((m) => m.areasOfMentoring || []).filter(Boolean)
    )
  ).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading mentors...</p>
        </div>
      </div>
    );
  }

  if (!program || !program.mentorsPublished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-lg shadow p-8 max-w-md">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Mentors Published
          </h2>
          <p className="text-gray-600">
            The mentors list for this program has not been published yet.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {program.name}
          </h1>
          {program.category && (
            <p className="text-gray-600">{program.category}</p>
          )}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            {mentors.length} mentor{mentors.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, company, expertise..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expertise Area
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <select
                  value={filterExpertise}
                  onChange={(e) => setFilterExpertise(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">All Expertise Areas</option>
                  {expertiseAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredMentors.length} of {mentors.length} mentor
          {mentors.length !== 1 ? "s" : ""}
        </div>

        {/* Mentors Grid */}
        {filteredMentors.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No mentors found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor) => (
              <PublishedMentorCard key={mentor._id} mentor={mentor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

