import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Users } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

interface Mentee {
  _id: string;
  mentee?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  registration?: {
    firstName: string;
    lastName: string;
    personalEmail: string;
    mobileNumber?: string;
    classOf?: number;
    areasOfMentoring?: string[];
  };
  matchedAt: string;
}

export const YourMentees: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [navActiveTab, setNavActiveTab] = useState("mentoring-programs");
  
  const programId = searchParams.get("programId");
  const programName = searchParams.get("programName") || "Mentorship Program";
  
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (programId) {
      fetchMentees();
    } else {
      toast({
        title: "Error",
        description: "Program ID is missing",
        variant: "destructive",
      });
      navigate("/mentoring-programs");
    }
  }, [programId]);

  const fetchMentees = async () => {
    if (!programId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/matching/${programId}/my-mentees`);
      if (response.data?.success && response.data?.data?.mentees) {
        setMentees(response.data.data.mentees);
      } else {
        setMentees([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch mentees",
        variant: "destructive",
      });
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to mentoring programs with Registered tab active
    // Use returnUrl if provided, otherwise default to Registered view
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl) {
      // Decode and navigate to the return URL
      try {
        const decodedUrl = decodeURIComponent(returnUrl);
        navigate(decodedUrl);
      } catch (error) {
        // If decoding fails, fall back to default
        navigate("/mentoring-programs?view=registered");
      }
    } else {
      // Default: go back to mentoring programs page with Registered view
      navigate("/mentoring-programs?view=registered");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeTab={navActiveTab} onTabChange={setNavActiveTab} />
      <main className="flex-1 w-full pt-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Mentees</h1>
            <p className="text-lg text-gray-600">{programName}</p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading mentees...</p>
            </div>
          ) : mentees.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg text-gray-600 mb-2">No mentees assigned</p>
              <p className="text-sm text-gray-500">
                No mentees have been assigned to you for this program yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mentees.map((mentee) => {
                const menteeName = mentee.mentee
                  ? `${mentee.mentee.firstName} ${mentee.mentee.lastName}`
                  : mentee.registration
                  ? `${mentee.registration.firstName} ${mentee.registration.lastName}`
                  : "Unknown";
                const menteeEmail = mentee.mentee?.email || mentee.registration?.personalEmail || "N/A";
                const menteeClassOf = mentee.registration?.classOf;
                const menteeMobile = mentee.registration?.mobileNumber;
                const menteeAreas = mentee.registration?.areasOfMentoring || [];

                return (
                  <div
                    key={mentee._id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {menteeName}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {menteeEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{menteeEmail}</span>
                            </div>
                          )}
                          {menteeMobile && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{menteeMobile}</span>
                            </div>
                          )}
                          {menteeClassOf && (
                            <span className="text-gray-600">Class of {menteeClassOf}</span>
                          )}
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Matched
                      </span>
                    </div>

                    {menteeAreas.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Areas of Interest:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {menteeAreas.map((area, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        Matched on: {format(new Date(mentee.matchedAt), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

