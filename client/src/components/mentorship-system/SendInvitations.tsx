import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Mail,
  Copy,
  Download,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SendInvitationsProps {
  programId: string;
  onClose?: () => void;
}

export const SendInvitations: React.FC<SendInvitationsProps> = ({
  programId,
  onClose,
}) => {
  const { toast } = useToast();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [selectedAlumni, setSelectedAlumni] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    graduationYear: "",
    department: "",
    industry: "",
    company: "",
    location: "",
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [sendProgress, setSendProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAlumni();
    fetchTemplates();
  }, [searchTerm, filters]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const params: any = { ...filters };
      if (searchTerm) params.search = searchTerm;
      const response = await api.get("/email-templates/alumni/select", { params });
      if (response.data.success) {
        setAlumni(response.data.data.alumni || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch alumni",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get("/email-templates", {
        params: {
          templateType: "mentor_invitation",
          isActive: true,
        },
      });
      if (response.data.success) {
        setTemplates(response.data.data.templates || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const toggleAlumniSelection = (id: string) => {
    const newSelected = new Set(selectedAlumni);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAlumni(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(alumni.map((a) => a._id));
    setSelectedAlumni(allIds);
  };

  const deselectAll = () => {
    setSelectedAlumni(new Set());
  };

  const handleSendMentorInvitations = async () => {
    if (selectedAlumni.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one alumni",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setSendProgress({ total: selectedAlumni.size, sent: 0, failed: 0 });
    setErrorMessage(null); // Clear previous errors

    try {
      const response = await api.post(
        `/email-templates/programs/${programId}/send-mentor-invitations`,
        {
          alumniIds: Array.from(selectedAlumni),
          templateId: selectedTemplate || undefined,
        }
      );

      // Update progress from response
      if (response.data.data) {
        setSendProgress({
          total: selectedAlumni.size,
          sent: response.data.data.success || 0,
          failed: response.data.data.failed || 0,
        });
      }

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        setSelectedAlumni(new Set());
        setSendProgress(null);
        setErrorMessage(null);
      } else {
        // Partial success or failure
        const errorMsg = response.data.data?.errorMessage || response.data.message || "Some invitations failed to send";
        setErrorMessage(errorMsg);
        toast({
          title: response.data.success ? "Partial Success" : "Error",
          description: errorMsg,
          variant: response.data.success ? "default" : "destructive",
          duration: 10000,
        });
        setSendProgress({
          total: response.data.data?.total || selectedAlumni.size,
          sent: response.data.data?.success || 0,
          failed: response.data.data?.failed || 0,
        });
      }
    } catch (error: any) {
      console.error("Send invitations error:", error);
      
      // Extract detailed error message
      let errorMessage = "Failed to send invitations.";
      
      if (error.response?.data?.data?.errorMessage) {
        errorMessage = error.response.data.data.errorMessage;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for SMTP configuration issues
      if (errorMessage.toLowerCase().includes("smtp") || 
          errorMessage.toLowerCase().includes("configuration") ||
          errorMessage.toLowerCase().includes("missing")) {
        errorMessage += " Please configure SMTP_USER and SMTP_PASS in the backend .env file.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds for longer error messages
      });
      
      // Set error message for display
      setErrorMessage(errorMessage);
      
      // Set progress to show failed state
      setSendProgress({
        total: selectedAlumni.size,
        sent: 0,
        failed: selectedAlumni.size,
      });
    } finally {
      setSending(false);
    }
  };


  const exportInvitationList = async () => {
    try {
      const response = await api.get("/email-templates/alumni/export", {
        params: {
          programId,
          alumniIds: Array.from(selectedAlumni).join(","),
        },
      });

      if (response.data.success) {
        const data = response.data.data.exportData;
        const headers = response.data.data.headers;
        const csv = [
          headers.join(","),
          ...data.map((row: any) =>
            headers.map((h: string) => {
              const key = h.toLowerCase().replace(/\s+/g, "");
              return `"${row[key] || ""}"`;
            }).join(",")
          ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mentor-invitations-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Invitation list exported successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to export list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Send Invitations
          </h1>
          <p className="text-gray-600">Select alumni and send mentoring program invitations</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        )}
      </div>

      {/* Filters */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    placeholder="Search alumni..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={filters.graduationYear}
                  onChange={(e) =>
                    setFilters({ ...filters, graduationYear: e.target.value })
                  }
                  placeholder="Year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                  placeholder="Department"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={filters.industry}
                  onChange={(e) =>
                    setFilters({ ...filters, industry: e.target.value })
                  }
                  placeholder="Industry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={filters.company}
                  onChange={(e) =>
                    setFilters({ ...filters, company: e.target.value })
                  }
                  placeholder="Company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Use Default Template</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selection Actions */}
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedAlumni.size} of {alumni.length} selected
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
              {selectedAlumni.size > 0 && (
                <button
                  onClick={exportInvitationList}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export CSV
                </button>
              )}
            </div>
          </div>

          {/* Alumni List */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : alumni.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No alumni found</p>
              </div>
            ) : (
              <div className="divide-y">
                {alumni.map((alum) => (
                  <div
                    key={alum._id}
                    className="p-4 hover:bg-gray-50 flex items-center space-x-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAlumni.has(alum._id)}
                      onChange={() => toggleAlumniSelection(alum._id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {alum.firstName} {alum.lastName}
                        {alum.preferredName && ` (${alum.preferredName})`}
                      </div>
                      <div className="text-sm text-gray-600">{alum.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {alum.graduationYear && `Class of ${alum.graduationYear}`}
                        {alum.department && ` • ${alum.department}`}
                        {alum.company && ` • ${alum.company}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          {selectedAlumni.size > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSendMentorInvitations}
                disabled={sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitations ({selectedAlumni.size})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Send Progress */}
          {sendProgress && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <div className="text-sm text-blue-700">
                Progress: {sendProgress.sent} sent, {sendProgress.failed} failed of{" "}
                {sendProgress.total} total
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-sm text-red-800 whitespace-pre-wrap">{errorMessage}</p>
                  {errorMessage.toLowerCase().includes("smtp") && (
                    <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                      <p className="text-xs font-medium text-red-900 mb-2">Quick Fix Steps:</p>
                      <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
                        <li>Open the backend <code className="bg-red-200 px-1 rounded">.env</code> file</li>
                        <li>Uncomment and set <code className="bg-red-200 px-1 rounded">SMTP_USER</code> and <code className="bg-red-200 px-1 rounded">SMTP_PASS</code></li>
                        <li>For Gmail: Enable 2-Step Verification, then create App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">myaccount.google.com/apppasswords</a></li>
                        <li>Copy the 16-character password (remove all spaces)</li>
                        <li>Restart the backend server</li>
                      </ol>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-600 hover:text-red-800 flex-shrink-0"
                  title="Dismiss"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
    </div>
  );
};

