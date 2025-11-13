import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Info, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import { ProgramChat } from "@/components/mentorship-system/ProgramChat";
import { useAuth } from "@/contexts/AuthContext";

interface Program {
  _id: string;
  name: string;
  category: string;
  description?: string;
  shortDescription?: string;
  programDuration: {
    startDate: string;
    endDate: string;
  };
  registrationEndDateMentor?: string;
  registrationEndDateMentee?: string;
  matchingEndDate?: string;
  entryCriteria?: string[];
  skillsRequired?: string[];
  areasOfMentoringMentor?: string[];
  areasOfMentoringMentee?: string[];
}

interface Mentee {
  _id: string;
  matchId: string;
  mentee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  } | null;
  registration: {
    _id: string;
    firstName: string;
    lastName: string;
    personalEmail: string;
    classOf: number;
    areasOfMentoring: string[];
    mobileNumber?: string;
  } | null;
  matchedAt: string;
  status: string;
}

export const RegisteredProgramDetail: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");
  const registrationType = searchParams.get("type") || "mentor"; // mentor or mentee
  const [navActiveTab, setNavActiveTab] = useState("mentoring-programs");
  
  // Check if user is alumni
  const isAlumni = user?.role === "alumni";
  // Check if user is staff, HOD, or college_admin
  const isStaff = user?.role === "staff" || user?.role === "hod" || user?.role === "college_admin";

  const [program, setProgram] = useState<Program | null>(null);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMentees, setLoadingMentees] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");

  useEffect(() => {
    if (programId) {
      fetchProgram();
      if (registrationType === "mentor") {
        fetchMentees();
      }
    } else {
      toast({
        title: "Error",
        description: "Program ID is missing",
        variant: "destructive",
      });
      navigate("/mentoring-programs?view=registered");
    }
  }, [programId, registrationType]);

  // Refetch mentees when switching to mentees tab
  useEffect(() => {
    if (activeTab === "mentees" && registrationType === "mentor" && programId && !isAlumni && !isStaff) {
      fetchMentees();
    }
  }, [activeTab, registrationType, programId, isAlumni, isStaff]);

  // If alumni or staff user is on mentees tab, switch to chats tab
  useEffect(() => {
    if ((isAlumni || isStaff) && activeTab === "mentees") {
      setActiveTab("chats");
    }
  }, [isAlumni, isStaff, activeTab]);

  const fetchProgram = async () => {
    if (!programId) return;
    setLoading(true);
    try {
      const response = await api.get(`/mentoring-programs/${programId}`);
      if (response.data?.success && response.data?.data?.program) {
        setProgram(response.data.data.program);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch program details",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch program",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMentees = async () => {
    if (!programId) return;
    setLoadingMentees(true);
    try {
      const response = await api.get(`/matching/${programId}/my-mentees`);
      console.log("Mentees response:", response.data);
      if (response.data?.success && response.data?.data?.mentees) {
        // Filter to show all matched mentees (not just accepted)
        // The backend currently only returns ACCEPTED, but we'll show all that are returned
        setMentees(response.data.data.mentees);
      } else {
        setMentees([]);
      }
    } catch (error: any) {
      console.error("Error fetching mentees:", error);
      // If user is not a mentor or has no mentees, that's okay
      setMentees([]);
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch mentees",
          variant: "destructive",
        });
      }
    } finally {
      setLoadingMentees(false);
    }
  };

  const handleBack = () => {
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl) {
      try {
        const decodedUrl = decodeURIComponent(returnUrl);
        navigate(decodedUrl);
      } catch (error) {
        navigate("/mentoring-programs?view=registered");
      }
    } else {
      navigate("/mentoring-programs?view=registered");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation activeTab={navActiveTab} onTabChange={setNavActiveTab} />
        <main className="flex-1 w-full pt-16">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="ml-3 text-gray-600">Loading program details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation activeTab={navActiveTab} onTabChange={setNavActiveTab} />
        <main className="flex-1 w-full pt-16">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-600">Program not found</p>
              <button
                onClick={handleBack}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Go back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

          {/* Program Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.name}</h1>
            {program.category && (
              <p className="text-gray-600">{program.category}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${isAlumni || isStaff ? "grid-cols-2" : "grid-cols-3"}`}>
                <TabsTrigger value="chats" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chats
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  About
                </TabsTrigger>
                {!isAlumni && !isStaff && (
                  <TabsTrigger value="mentees" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Members
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Chats Tab */}
              <TabsContent value="chats" className="mt-6">
                {programId ? (
                  <ProgramChat programId={programId} programName={program?.name} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Program ID not found</p>
                  </div>
                )}
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6">
                <div className="space-y-6">
                  {/* Description */}
                  {(program.description || program.shortDescription) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {program.description || program.shortDescription}
                      </p>
                    </div>
                  )}

                  {/* Program Duration */}
                  {program.programDuration && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Program Duration</h3>
                      <p className="text-gray-700">
                        {format(new Date(program.programDuration.startDate), "MMM d, yyyy")} -{" "}
                        {format(new Date(program.programDuration.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}

                  {/* Entry Criteria */}
                  {program.entryCriteria && program.entryCriteria.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Entry Criteria</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-700">
                        {program.entryCriteria.map((criterion, idx) => (
                          <li key={idx}>{criterion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills Required */}
                  {program.skillsRequired && program.skillsRequired.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills Required</h3>
                      <div className="flex flex-wrap gap-2">
                        {program.skillsRequired.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Areas of Mentoring */}
                  {registrationType === "mentor" && program.areasOfMentoringMentor && program.areasOfMentoringMentor.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas of Mentoring</h3>
                      <div className="flex flex-wrap gap-2">
                        {program.areasOfMentoringMentor.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {registrationType === "mentee" && program.areasOfMentoringMentee && program.areasOfMentoringMentee.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas I Want to Learn</h3>
                      <div className="flex flex-wrap gap-2">
                        {program.areasOfMentoringMentee.map((area, idx) => (
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
                </div>
              </TabsContent>

              {/* Mentee Members Tab - Only visible for non-alumni and non-staff users */}
              {!isAlumni && !isStaff && (
                <TabsContent value="mentees" className="mt-6">
                {registrationType === "mentor" ? (
                  <>
                    {loadingMentees ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="ml-3 text-gray-600">Loading mentees...</p>
                      </div>
                    ) : mentees.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">No mentees assigned</p>
                        <p className="text-sm">No mentees have been assigned to you for this program yet.</p>
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
                              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {menteeName}
                                  </h3>
                                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                    {menteeEmail && <span>{menteeEmail}</span>}
                                    {menteeMobile && <span>• {menteeMobile}</span>}
                                    {menteeClassOf && <span>• Class of {menteeClassOf}</span>}
                                  </div>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    mentee.status === "accepted"
                                      ? "bg-green-100 text-green-800"
                                      : mentee.status === "pending_mentor_acceptance" || mentee.status === "pending_mentee_acceptance"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : mentee.status === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {mentee.status === "accepted"
                                    ? "Matched"
                                    : mentee.status === "pending_mentor_acceptance"
                                    ? "Pending"
                                    : mentee.status === "pending_mentee_acceptance"
                                    ? "Pending"
                                    : mentee.status === "rejected"
                                    ? "Rejected"
                                    : mentee.status || "Matched"}
                                </span>
                              </div>

                              {menteeAreas.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">
                                    Areas of Interest:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {menteeAreas.map((area, idx) => (
                                      <span
                                        key={idx}
                                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                                      >
                                        {area}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                  Matched on: {format(new Date(mentee.matchedAt), "MMM dd, yyyy 'at' hh:mm a")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Members</p>
                    <p className="text-sm">This view is only available for mentors.</p>
                  </div>
                )}
              </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

