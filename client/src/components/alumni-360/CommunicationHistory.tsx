import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageSquare, Mail, Calendar, Search, X } from "lucide-react";
import { CommunicationItem } from "@/types/alumni360";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/api";
import { alumni360API } from "@/lib/api";
import Pagination from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const limit = 20;

  // Debounce search term and reset to page 1 when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  const fetchCommunications = useCallback(
    async (page: number, search?: string) => {
      if (!alumniId) return;

      try {
        setLoading(true);
        const response = await alumni360API.getCommunicationHistory(alumniId, {
          page,
          limit,
          ...(search && search.trim() ? { search: search.trim() } : {}),
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
    },
    [alumniId, limit, toast]
  );

  // Fetch when page or search term changes
  useEffect(() => {
    if (alumniId) {
      fetchCommunications(currentPage, debouncedSearchTerm);
    }
  }, [alumniId, currentPage, debouncedSearchTerm, fetchCommunications]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold">Communication History</h2>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search messages, subjects, or names..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>
              {debouncedSearchTerm
                ? `No communications found matching "${debouncedSearchTerm}"`
                : "No communication history yet."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold">Communication History</h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            {total} total communication{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search messages, subjects, or names..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
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
      {total > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {Math.min((currentPage - 1) * limit + 1, total)} -{" "}
              {Math.min(currentPage * limit, total)} of {total} communication
              {total !== 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <span>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
};
