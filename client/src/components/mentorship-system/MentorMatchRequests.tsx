import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, User, Mail, Calendar, Award } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export const MentorMatchRequests: React.FC = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchMatchRequests();
  }, []);

  const fetchMatchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get("/matching/my-requests");
      if (response.data.success) {
        setMatches(response.data.data.matches || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch match requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (matchId: string) => {
    if (processing) return;
    setProcessing(matchId);
    try {
      const response = await api.put(`/matching/${matchId}/accept`);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Match accepted successfully",
        });
        fetchMatchRequests();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to accept match",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (match: any) => {
    setSelectedMatch(match);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedMatch) return;

    setProcessing(selectedMatch._id);
    try {
      const response = await api.put(`/matching/${selectedMatch._id}/reject`, {
        reason: rejectionReason || "No reason provided",
      });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Match rejected. System will try next preference automatically.",
        });
        setShowRejectModal(false);
        fetchMatchRequests();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject match",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getDaysRemaining = (autoRejectAt: string | Date) => {
    if (!autoRejectAt) return 0;
    try {
      const deadline = new Date(autoRejectAt);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Match Requests</h1>
        <p className="text-gray-600">
          Review and respond to mentee match requests. You have 3 days to respond.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No pending match requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const mentee = match.menteeId || {};
            const menteeReg = match.menteeRegistrationId || {};
            const program = match.programId || {};
            const daysRemaining = getDaysRemaining(match.autoRejectAt);

            return (
              <div
                key={match._id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Match Request from {menteeReg.firstName || mentee.firstName}{" "}
                      {menteeReg.lastName || mentee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Program: <span className="font-medium">{program.name || "N/A"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mb-2">
                      <Clock className="w-3 h-3 mr-1" />
                      {daysRemaining > 0
                        ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`
                        : "Expired"}
                    </div>
                    {match.matchType === "preferred" && (
                      <div className="text-xs text-blue-600 font-medium">
                        {match.preferredChoiceOrder === 1
                          ? "1st Choice"
                          : match.preferredChoiceOrder === 2
                          ? "2nd Choice"
                          : "3rd Choice"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="mb-4 p-4 bg-gray-50 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Match Score: {match.matchScore}%</span>
                    <span className="text-sm text-gray-600">
                      Matched {formatDistanceToNow(new Date(match.matchedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {match.scoreBreakdown && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                      <div>
                        <span className="text-gray-600">Industry:</span>
                        <span className="ml-2 font-medium">
                          {match.scoreBreakdown.industryScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Programme:</span>
                        <span className="ml-2 font-medium">
                          {match.scoreBreakdown.programmeScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Skills:</span>
                        <span className="ml-2 font-medium">
                          {match.scoreBreakdown.skillsScore}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Preference:</span>
                        <span className="ml-2 font-medium">
                          {match.scoreBreakdown.preferenceScore}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mentee Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Mentee Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>
                          {menteeReg.title || ""} {menteeReg.firstName || mentee.firstName}{" "}
                          {menteeReg.lastName || mentee.lastName}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{menteeReg.personalEmail || mentee.email}</span>
                      </div>
                      {menteeReg.classOf && (
                        <div className="flex items-center text-gray-600">
                          <Award className="w-4 h-4 mr-2" />
                          <span>Class of {menteeReg.classOf}</span>
                        </div>
                      )}
                      {menteeReg.areasOfMentoring &&
                        menteeReg.areasOfMentoring.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Areas of Interest:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {menteeReg.areasOfMentoring.slice(0, 5).map((area: string, idx: number) => (
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
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Why You Were Matched</h4>
                    <p className="text-sm text-gray-600">
                      {match.matchType === "preferred"
                        ? `You were selected as the mentee's ${match.preferredChoiceOrder === 1 ? "first" : match.preferredChoiceOrder === 2 ? "second" : "third"} choice mentor based on their preferences.`
                        : "You were matched based on industry, programme, and skills alignment."}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleAccept(match._id)}
                    disabled={processing === match._id || daysRemaining <= 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Match
                  </button>
                  <button
                    onClick={() => handleReject(match)}
                    disabled={processing === match._id || daysRemaining <= 0}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Match
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Reject Match Request</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this match? The system will automatically try the
              mentee's next preference.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Provide a reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processing === selectedMatch._id}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {processing === selectedMatch._id ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

