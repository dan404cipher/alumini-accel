import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Mail, Loader2, CheckCircle2, XCircle, User, AlertCircle } from "lucide-react";

interface SendMenteeSelectionEmailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName?: string;
  onSuccess?: () => void;
}

interface Mentee {
  _id: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  sitEmail?: string;
  classOf?: number;
}

export const SendMenteeSelectionEmailsModal: React.FC<
  SendMenteeSelectionEmailsModalProps
> = ({ open, onOpenChange, programId, programName, onSuccess }) => {
  const { toast } = useToast();
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: number;
    failed: number;
    results?: Array<{ email: string; success: boolean; error?: string }>;
  } | null>(null);

  // Fetch approved mentees when modal opens
  useEffect(() => {
    if (open && programId) {
      fetchApprovedMentees();
    } else {
      // Reset state when modal closes
      setMentees([]);
      setSendResult(null);
    }
  }, [open, programId]);

  const fetchApprovedMentees = async () => {
    setLoading(true);
    try {
      const response = await api.get("/mentoring-approvals/mentees", {
        params: {
          programId,
          status: "approved",
          limit: 1000, // Get all approved mentees
        },
      });

      if (response.data.success) {
        const registrations = response.data.data.registrations || [];
        setMentees(registrations);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to fetch approved mentees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (mentees.length === 0) {
      toast({
        title: "No Recipients",
        description: "No approved mentees found to send emails to",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const response = await api.post(
        `/matching/${programId}/send-mentee-selection-emails`
      );

      if (response.data.success) {
        const result = response.data.data;
        setSendResult({
          success: result.emailsSent || 0,
          failed: result.emailsFailed || 0,
          results: result.results || [],
        });

        toast({
          title: "Success",
          description: `Emails sent successfully: ${result.emailsSent} successful, ${result.emailsFailed} failed`,
        });

        if (onSuccess) {
          onSuccess();
        }

        // Auto close after 3 seconds if all emails sent successfully
        if (result.emailsFailed === 0) {
          setTimeout(() => {
            onOpenChange(false);
          }, 3000);
        }
      } else {
        throw new Error(response.data.message || "Failed to send emails");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to send emails",
        variant: "destructive",
      });
      setSendResult({
        success: 0,
        failed: mentees.length,
      });
    } finally {
      setSending(false);
    }
  };

  const getMenteeEmail = (mentee: Mentee) => {
    return mentee.personalEmail || mentee.sitEmail || "No email";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Mentor Selection Emails to Mentees
          </DialogTitle>
          <DialogDescription>
            {programName
              ? `Send emails to approved mentees for ${programName}`
              : "Send emails to approved mentees with a link to select their preferred mentors"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading mentees...</span>
            </div>
          ) : mentees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-500 mb-2" />
              <p className="text-gray-600 font-medium">No Approved Mentees</p>
              <p className="text-sm text-gray-500 mt-1">
                There are no approved mentees for this program yet.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {mentees.length} mentee{mentees.length !== 1 ? "s" : ""} will receive emails
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Each mentee will receive a personalized email with a link to select their 3
                      preferred mentors.
                    </p>
                  </div>
                </div>
              </div>

              {sendResult && (
                <div
                  className={`rounded-lg p-4 ${
                    sendResult.failed === 0
                      ? "bg-green-50 border border-green-200"
                      : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {sendResult.failed === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          sendResult.failed === 0 ? "text-green-900" : "text-yellow-900"
                        }`}
                      >
                        Email Send Results
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          sendResult.failed === 0 ? "text-green-700" : "text-yellow-700"
                        }`}
                      >
                        <span className="font-semibold text-green-600">
                          {sendResult.success} successful
                        </span>
                        {sendResult.failed > 0 && (
                          <>
                            {" • "}
                            <span className="font-semibold text-red-600">
                              {sendResult.failed} failed
                            </span>
                          </>
                        )}
                      </p>
                      {sendResult.results && sendResult.results.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto">
                          <p className="text-xs font-medium mb-1">
                            Failed Emails ({sendResult.failed}):
                          </p>
                          <ul className="space-y-1">
                            {sendResult.results
                              .filter((r) => !r.success)
                              .map((result, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-red-700 bg-red-50 p-2 rounded"
                                >
                                  {result.email}: {result.error || "Unknown error"}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    Recipients ({mentees.length})
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {mentees.map((mentee) => (
                    <div
                      key={mentee._id}
                      className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {mentee.firstName} {mentee.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {getMenteeEmail(mentee)}
                          </p>
                          {mentee.classOf && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Class of {mentee.classOf}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmails}
            disabled={loading || sending || mentees.length === 0}
            className="min-w-[120px]"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Emails
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

