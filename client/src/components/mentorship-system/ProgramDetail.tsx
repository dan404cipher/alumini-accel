import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  UserPlus,
  Mail,
  Link as LinkIcon,
  Eye,
  BarChart3,
  FileText,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { mentoringProgramAPI, MentoringProgram } from "@/services/mentoringProgramApi";
import api from "@/lib/api";
import { ViewPublishedMentorsLink } from "./ViewPublishedMentorsLink";
import { SendMenteeSelectionEmailsModal } from "./SendMenteeSelectionEmailsModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

interface ProgramDetailProps {
  programId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  userRole?: string;
}

export const ProgramDetail: React.FC<ProgramDetailProps> = ({
  programId,
  onEdit,
  onDelete,
  userRole,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [program, setProgram] = useState<MentoringProgram | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSendEmailsModal, setShowSendEmailsModal] = useState(false);
  const [menteeRegistrationLink, setMenteeRegistrationLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [hasMentorRegistration, setHasMentorRegistration] = useState(false);
  const [hasMenteeRegistration, setHasMenteeRegistration] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  // STAFF, HOD, and College Admin can create, edit, delete, publish, unpublish, and send invitations
  const isStaff = userRole === "staff" || userRole === "hod" || userRole === "college_admin";
  const isAlumni = user?.role === "alumni";

  useEffect(() => {
    fetchProgram();
    fetchStatistics();
    if (isAlumni && programId) {
      checkRegistrationStatus();
    }
  }, [programId, isAlumni]);

  const fetchProgram = async () => {
    setLoading(true);
    try {
      const response = await mentoringProgramAPI.getProgramById(programId);
      if (response.success && response.data) {
        setProgram(response.data.program);
        // Extract registration link from response if available
        if ((response.data as any).menteeRegistrationLink) {
          setMenteeRegistrationLink((response.data as any).menteeRegistrationLink);
        }
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

  const handleCopyLink = async () => {
    if (!menteeRegistrationLink) return;
    
    try {
      await navigator.clipboard.writeText(menteeRegistrationLink);
      setLinkCopied(true);
      toast({
        title: "Success",
        description: "Registration link copied to clipboard",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleGenerateLink = async () => {
    setProcessing(true);
    try {
      const response = await api.get(`/mentee-registrations/program/${programId}/link`);
      if (response.data.success && response.data.data) {
        setMenteeRegistrationLink(response.data.data.registrationLink);
        toast({
          title: "Success",
          description: "Registration link generated successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate registration link",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await mentoringProgramAPI.getProgramStatistics(programId);
      if (response.success && response.data) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!user || !programId) return;
    
    setCheckingRegistration(true);
    try {
      // Check mentor registration
      const mentorResponse = await api.get("/mentor-registrations/my");
      if (mentorResponse.data?.success && mentorResponse.data?.data?.registrations) {
        const mentorRegistrations = mentorResponse.data.data.registrations;
        const hasMentorReg = mentorRegistrations.some(
          (reg: any) => reg.programId?._id === programId || reg.programId === programId
        );
        setHasMentorRegistration(hasMentorReg);
      }

      // Check mentee registration using the new endpoint
      try {
        const menteeResponse = await api.get(`/mentee-registrations/program/${programId}/check`);
        if (menteeResponse.data?.success && menteeResponse.data?.data) {
          setHasMenteeRegistration(menteeResponse.data.data.hasRegistration);
        }
      } catch (menteeError: any) {
        // If endpoint fails, log but don't block
        console.log("Cannot check mentee registration status:", menteeError.response?.status);
      }
    } catch (error: any) {
      console.error("Failed to check registration status:", error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handlePublish = async () => {
    if (!program) return;
    setProcessing(true);
    try {
      const response = await mentoringProgramAPI.publishProgram(programId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Program published successfully",
        });
        fetchProgram();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to publish program",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!program) return;
    setProcessing(true);
    try {
      const response = await mentoringProgramAPI.unpublishProgram(programId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Program unpublished successfully",
        });
        fetchProgram();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to unpublish program",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this program? This action cannot be undone.")) {
      return;
    }

    setProcessing(true);
    try {
      const response = await mentoringProgramAPI.deleteProgram(programId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Program deleted successfully",
        });
        if (onDelete) {
          onDelete();
        } else {
          navigate("/mentoring-programs");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete program",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600">Program not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-4 h-4 mr-1" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const isRegistrationOpen = (date: string) => {
    return new Date(date) > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
              {getStatusBadge(program.status)}
            </div>
            <p className="text-gray-600 mb-2">{program.category}</p>
            <p className="text-gray-700">{program.shortDescription}</p>
          </div>
          {isStaff && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {program.status === "draft" && (
                <Button onClick={handlePublish} disabled={processing}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              )}
              {program.status === "published" && (
                <Button variant="outline" onClick={handleUnpublish} disabled={processing}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Unpublish
                </Button>
              )}
              <Button variant="destructive" onClick={handleDelete} disabled={processing}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics - Hidden for alumni role */}
      {statistics && userRole !== "alumni" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Mentors</div>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.totalMentors || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Mentees</div>
            <div className="text-2xl font-bold text-purple-600">
              {statistics.totalMentees || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {(statistics.approvedMentors || 0) + (statistics.approvedMentees || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Matched Pairs</div>
            <div className="text-2xl font-bold text-indigo-600">
              {statistics.matchedPairs || 0}
            </div>
          </div>
        </div>
      )}

      {/* Program Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Program Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Program Schedule</div>
            <div className="text-gray-900">{program.programSchedule}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Program Duration</div>
            <div className="text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {format(new Date(program.programDuration.startDate), "MMM d, yyyy")} -{" "}
              {format(new Date(program.programDuration.endDate), "MMM d, yyyy")}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              Mentee Registration End Date
            </div>
            <div className="text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {format(new Date(program.registrationEndDateMentee), "MMM d, yyyy h:mm a")}
              {isRegistrationOpen(program.registrationEndDateMentee) ? (
                <span className="ml-2 text-xs text-green-600">(Open)</span>
              ) : (
                <span className="ml-2 text-xs text-red-600">(Closed)</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              Mentor Registration End Date
            </div>
            <div className="text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {format(new Date(program.registrationEndDateMentor), "MMM d, yyyy h:mm a")}
              {isRegistrationOpen(program.registrationEndDateMentor) ? (
                <span className="ml-2 text-xs text-green-600">(Open)</span>
              ) : (
                <span className="ml-2 text-xs text-red-600">(Closed)</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Matching End Date</div>
            <div className="text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {format(new Date(program.matchingEndDate), "MMM d, yyyy h:mm a")}
            </div>
          </div>
        </div>

        {program.longDescription && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
            <div className="text-gray-900 whitespace-pre-wrap">
              {program.longDescription}
            </div>
          </div>
        )}

        {program.entryCriteriaRules && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Entry Criteria Rules
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">
                {program.entryCriteriaRules.split('\n').map((line, idx) => {
                  // Format as bullet points if line starts with number or dash
                  if (/^[\d\-•·]\s/.test(line.trim()) || line.trim().startsWith('-')) {
                    return (
                      <div key={idx} className="ml-4 mb-1">
                        {line.trim()}
                      </div>
                    );
                  }
                  // Format as paragraph
                  return (
                    <p key={idx} className="mb-2">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Please ensure you meet these criteria before registering for this program.
            </p>
          </div>
        )}

        {program.skillsRequired && program.skillsRequired.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">Skills Required</div>
            <div className="flex flex-wrap gap-2">
              {program.skillsRequired.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {program.areasOfMentoring?.mentor && program.areasOfMentoring.mentor.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Areas of Mentoring (Mentor)
            </div>
            <div className="flex flex-wrap gap-2">
              {program.areasOfMentoring.mentor.map((area, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {program.areasOfMentoring?.mentee && program.areasOfMentoring.mentee.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Areas of Mentoring (Mentee)
            </div>
            <div className="flex flex-wrap gap-2">
              {program.areasOfMentoring.mentee.map((area, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Registration Buttons - At the bottom of program information */}
        {program.status === "published" && !isStaff && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Register for this Program</h2>
                <ArrowRight className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex flex-wrap gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          onClick={() => navigate(`/mentor-registration?programId=${programId}`)}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="lg"
                          disabled={
                            (isAlumni && hasMenteeRegistration) ||
                            !isRegistrationOpen(program.registrationEndDateMentor)
                          }
                        >
                          <UserPlus className="w-5 h-5 mr-2" />
                          Mentor Registration
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isAlumni && hasMenteeRegistration && (
                      <TooltipContent>
                        <p>You have already registered as a mentee for this program</p>
                      </TooltipContent>
                    )}
                    {!isRegistrationOpen(program.registrationEndDateMentor) && (
                      <TooltipContent>
                        <p>Mentor registration has ended for this program</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          onClick={() => navigate(`/mentee-registration?programId=${programId}`)}
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          size="lg"
                          disabled={
                            (isAlumni && hasMentorRegistration) ||
                            !isRegistrationOpen(program.registrationEndDateMentee)
                          }
                        >
                          <Users className="w-5 h-5 mr-2" />
                          Mentee Registration
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {isAlumni && hasMentorRegistration && (
                      <TooltipContent>
                        <p>You have already registered as a mentor for this program</p>
                      </TooltipContent>
                    )}
                    {!isRegistrationOpen(program.registrationEndDateMentee) && (
                      <TooltipContent>
                        <p>Mentee registration has ended for this program</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mentee Registration Link - Visible to Staff/Admin */}
      {(isStaff || userRole === "super_admin" || userRole === "college_admin" || userRole === "hod") && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Mentee Registration Link</h2>
            </div>
            {menteeRegistrationLink && (
              <Button
                onClick={handleGenerateLink}
                variant="outline"
                size="sm"
                disabled={processing}
                className="flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${processing ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Share this link with mentees to allow them to register for this program. This link can be included in EDM invitations.
          </p>

          {menteeRegistrationLink ? (
            <>
              <div className="bg-white rounded-lg border border-gray-300 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1">Registration Link</p>
                  <p className="text-sm text-gray-900 font-mono break-all select-all bg-gray-50 p-2 rounded border">
                    {menteeRegistrationLink}
                  </p>
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant={linkCopied ? "default" : "outline"}
                  size="sm"
                  className="flex-shrink-0 w-full sm:w-auto"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
              {program && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded border border-blue-100">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>
                    <span className="font-medium">Link expires on:</span>{" "}
                    {format(new Date(program.registrationEndDateMentee), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-300 p-6 text-center">
              <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">
                No registration link has been generated yet. Generate a link to share with mentees.
              </p>
              <Button
                onClick={handleGenerateLink}
                disabled={processing}
                className="mx-auto"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Generate Link
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {isStaff && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/mentoring-approvals?programId=${programId}`)}
              className="justify-start"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Registration Approvals
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/send-invitations?programId=${programId}`)}
              className="justify-start"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Invitations
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setShowSendEmailsModal(true)}
                    disabled={
                      !statistics?.approvedMentees ||
                      statistics.approvedMentees === 0 ||
                      program.status !== "published"
                    }
                    className="justify-start"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Mentor Selection Emails
                    {statistics?.approvedMentees > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {statistics.approvedMentees}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {program.status !== "published"
                      ? "Program must be published to send selection emails"
                      : !statistics?.approvedMentees || statistics.approvedMentees === 0
                      ? "No approved mentees available to send emails"
                      : `Send emails to ${statistics.approvedMentees} approved mentee${statistics.approvedMentees !== 1 ? "s" : ""} with a link to select their preferred mentors`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {program.mentorsPublished && (
              <Button
                variant="outline"
                onClick={() => navigate(`/published-mentors/${programId}`)}
                className="justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Published Mentors
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                // Statistics are already displayed above
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Statistics
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/registered-program-detail?programId=${programId}`)}
              className="justify-start"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>
        </div>
      )}

      {/* Send Mentee Selection Emails Modal */}
      {isStaff && (
        <SendMenteeSelectionEmailsModal
          open={showSendEmailsModal}
          onOpenChange={setShowSendEmailsModal}
          programId={programId}
          programName={program?.name}
          onSuccess={() => {
            // Refresh statistics after sending emails
            fetchStatistics();
          }}
        />
      )}
    </div>
  );
};

