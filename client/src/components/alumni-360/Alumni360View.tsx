import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { alumni360API } from "@/lib/api";
import { Alumni360Data } from "@/types/alumni360";
import { AlumniHeader } from "./AlumniHeader";
import { EngagementMetrics } from "./EngagementMetrics";
import { NotesSection } from "./NotesSection";
import { IssuesSection } from "./IssuesSection";
import { CommunicationHistory } from "./CommunicationHistory";
import { FlagsSection } from "./FlagsSection";
import { ProgressTracking } from "./ProgressTracking";
import { JobsSection } from "./JobsSection";
import { ReportsSection } from "./ReportsSection";
import { DonationsSection } from "./DonationsSection";
import { EventsSection } from "./EventsSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Alumni360View = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [data, setData] = useState<Alumni360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has access (staff, hod, college_admin, or super_admin)
  const hasAccess =
    user?.role &&
    ["staff", "hod", "college_admin", "super_admin"].includes(user.role);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await alumni360API.getAlumni360Data(id);

      if (response.success && response.data) {
        setData(response.data as Alumni360Data);
      } else {
        setError(response.message || "Failed to load alumni data");
      }
    } catch (err: unknown) {
      console.error("Error fetching alumni 360 data:", err);
      const errorMessage =
        (err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null) ||
        (err instanceof Error ? err.message : null) ||
        "Failed to load alumni 360 view data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load alumni data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (!hasAccess) {
      setError("You do not have permission to view this page");
      setLoading(false);
      return;
    }

    if (id) {
      fetchData();
    }
  }, [id, hasAccess, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddNote = async (
    content: string,
    category?: string,
    isPrivate?: boolean
  ) => {
    if (!id) return;

    try {
      const response = await alumni360API.addNote(id, {
        content,
        category,
        isPrivate,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Note added successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to add note");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add note";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleUpdateNote = async (
    noteId: string,
    content: string,
    category?: string,
    isPrivate?: boolean
  ) => {
    if (!id) return;

    try {
      const response = await alumni360API.updateNote(id, noteId, {
        content,
        category,
        isPrivate,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Note updated successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to update note");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update note";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;

    try {
      const response = await alumni360API.deleteNote(id, noteId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Note deleted successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to delete note");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete note";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleCreateIssue = async (issueData: {
    title: string;
    description: string;
    priority?: string;
  }) => {
    if (!id) return;

    try {
      const response = await alumni360API.createIssue(id, issueData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Issue created successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to create issue");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create issue";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleUpdateIssue = async (
    issueId: string,
    updateData: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      response?: string;
      responseId?: string;
      responseIdToDelete?: string;
    }
  ) => {
    if (!id) return;

    try {
      const response = await alumni360API.updateIssue(id, issueId, updateData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Issue updated successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to update issue");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update issue";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (!id) return;

    try {
      const response = await alumni360API.deleteIssue(id, issueId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Issue deleted successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to delete issue");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete issue";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleAddFlag = async (flagData: {
    flagType: string;
    flagValue: string;
    description?: string;
  }) => {
    if (!id) return;

    try {
      const response = await alumni360API.addFlag(id, flagData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Flag added successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to add flag");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add flag";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleRemoveFlag = async (flagType: string) => {
    if (!id) return;

    try {
      const response = await alumni360API.removeFlag(id, flagType);
      if (response.success) {
        toast({
          title: "Success",
          description: "Flag removed successfully",
        });
        fetchData();
      } else {
        throw new Error(response.message || "Failed to remove flag");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove flag";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleMessage = () => {
    if (data?.alumni?.userId?._id || data?.alumni?.userId) {
      const userId = data.alumni.userId._id || data.alumni.userId;
      navigate(`/messages?user=${userId}`);
    }
  };

  const handleEmail = () => {
    const email = data?.alumni?.userId?.email || data?.alumni?.user?.email;
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleCall = () => {
    const phone = data?.alumni?.userId?.phone || data?.alumni?.user?.phone;
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation activeTab="dashboard" onTabChange={() => {}} />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You do not have permission to view this page.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation activeTab="dashboard" onTabChange={() => {}} />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading alumni 360 view...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation activeTab="dashboard" onTabChange={() => {}} />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">
                {error || "Failed to load data"}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
                <Button onClick={handleRefresh}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <Navigation activeTab="dashboard" onTabChange={() => {}} />
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        {/* Alumni Header */}
        <AlumniHeader
          alumni={data.alumni}
          flags={data.flags}
          onMessage={handleMessage}
          onEmail={handleEmail}
          onCall={handleCall}
        />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 h-auto overflow-x-auto gap-1 sm:gap-2">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="issues"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Issues
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Communication
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Jobs
            </TabsTrigger>
            <TabsTrigger
              value="donations"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Donations
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ReportsSection alumniId={id || ""} />
            <EngagementMetrics metrics={data.engagementMetrics} />
            <FlagsSection
              flags={data.flags}
              onAddFlag={handleAddFlag}
              onRemoveFlag={handleRemoveFlag}
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesSection
              notes={data.notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              currentUserId={user?._id}
              currentUserRole={user?.role}
            />
          </TabsContent>

          <TabsContent value="issues">
            <IssuesSection
              issues={data.issues}
              onCreateIssue={handleCreateIssue}
              onUpdateIssue={handleUpdateIssue}
              onDeleteIssue={handleDeleteIssue}
              currentUserId={user?._id}
              currentUserRole={user?.role}
            />
          </TabsContent>

          <TabsContent value="communication">
            <CommunicationHistory alumniId={id || ""} />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsSection
              jobsPosted={data.jobsPosted}
              jobsApplied={data.jobsApplied}
            />
          </TabsContent>

          <TabsContent value="donations">
            <DonationsSection
              donations={data.donations}
              engagementMetrics={data.engagementMetrics}
            />
          </TabsContent>

          <TabsContent value="events">
            <EventsSection
              events={data.events}
              engagementMetrics={data.engagementMetrics}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTracking
              alumni={data.alumni}
              engagementMetrics={data.engagementMetrics}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Alumni360View;
