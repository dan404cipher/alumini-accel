import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, Calendar } from "lucide-react";
import { CommunicationItem } from "@/types/alumni360";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/api";
import { alumni360API } from "@/lib/api";
import Pagination from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

interface CommunicationHistoryProps {
  alumniId: string;
  initialCommunications?: CommunicationItem[];
}

export const CommunicationHistory = ({
  alumniId,
  initialCommunications = [],
}: CommunicationHistoryProps) => {
  const { toast } = useToast();
  const [communications, setCommunications] = useState<CommunicationItem[]>(
    initialCommunications
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchCommunications = async (page: number) => {
    if (!alumniId) return;

    try {
      setLoading(true);
      const response = await alumni360API.getCommunicationHistory(alumniId, {
        page,
        limit,
      });

      if (response.success && response.data) {
        const data = response.data as {
          communicationHistory?: CommunicationItem[];
          pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        };
        setCommunications(data.communicationHistory || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotal(data.pagination.total || 0);
        }
      } else {
        throw new Error(
          (response as { message?: string }).message ||
            "Failed to load communication history"
        );
      }
    } catch (error: unknown) {
      console.error("Error fetching communication history:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load communication history";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alumniId) {
      fetchCommunications(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumniId, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && communications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading communication history...
      </div>
    );
  }

  if (!loading && communications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No communication history yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Communication History</h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            {total} total communication{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && communications.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Loading...
        </div>
      )}

      <div className="space-y-3">
        {communications.map((comm, idx) => (
          <Card key={`${comm.id}-${idx}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {comm.type === "message" ? (
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Mail className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {comm.type === "message" ? "Message" : "Mentorship"}
                    </Badge>
                    {comm.subject && (
                      <span className="font-medium text-sm">
                        {comm.subject}
                      </span>
                    )}
                    {!comm.isRead && (
                      <Badge variant="secondary" className="text-xs">
                        Unread
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-sm flex-wrap">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">
                      {comm.from.firstName} {comm.from.lastName}
                    </span>
                    <span className="text-muted-foreground hidden sm:inline">
                      •
                    </span>
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">
                      {comm.to.firstName} {comm.to.lastName}
                    </span>
                  </div>
                  {(comm.content || comm.subject) && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mb-2">
                      {comm.content || comm.subject}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {format(new Date(comm.date), "MMM dd, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};
