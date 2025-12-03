import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Grid,
  List,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mentoringProgramAPI, MentoringProgram, ProgramFilters } from "@/services/mentoringProgramApi";
import { ProgramList } from "@/components/mentorship-system/ProgramList";
import { ProgramDetail } from "@/components/mentorship-system/ProgramDetail";
import { CreateProgramModal } from "@/components/mentorship-system/CreateProgramModal";
import { MatchingDashboard } from "@/components/mentorship-system/MatchingDashboard";
import { AlumniRegistered } from "@/components/mentorship-system/AlumniRegistered";
import { useAuth, User } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";

export const MentoringPrograms: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth() as { user: User | null };
  const [navActiveTab, setNavActiveTab] = useState("mentoring-programs");
  const [programs, setPrograms] = useState<MentoringProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<MentoringProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<MentoringProgram | null>(null);
  const [showMatchingDashboard, setShowMatchingDashboard] = useState(false);
  const [showRegistered, setShowRegistered] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPrograms, setTotalPrograms] = useState(0);
  const programsPerPage = 12;
  
  // Check URL parameter for view state on mount and when searchParams change
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "registered") {
      setShowRegistered(true);
      setShowMatchingDashboard(false);
    } else if (viewParam === "matching") {
      setShowMatchingDashboard(true);
      setShowRegistered(false);
    } else if (!viewParam) {
      // If no view parameter, ensure both are false (default to Mentor Programs)
      setShowRegistered(false);
      setShowMatchingDashboard(false);
    }
  }, [searchParams]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get("category") || "all"
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("search") || ""
  );

  const programId = searchParams.get("id");
  // STAFF, HOD, and College Admin can create, edit, delete, publish, and unpublish programs
  const isStaff = user?.role === "staff" || user?.role === "hod" || user?.role === "college_admin";
  // Check if user is alumni or student (both should see the same mentorship view)
  const isAlumni = user?.role === "alumni" || user?.role === "student";

  useEffect(() => {
    if (programId) {
      fetchProgramDetail(programId);
    } else {
      setSelectedProgram(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchTerm]);

  // Fetch programs when filters, search, or page changes
  useEffect(() => {
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, searchTerm, currentPage]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const filters: ProgramFilters = {
        page: currentPage,
        limit: programsPerPage,
      };

      if (statusFilter !== "all") {
        filters.status = statusFilter as "draft" | "published" | "archived";
      }
      if (categoryFilter !== "all") {
        filters.category = categoryFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const response = await mentoringProgramAPI.getAllPrograms(filters);
      if (response.success && response.data) {
        setPrograms(response.data.programs || []);
        
        // Update pagination metadata
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalPrograms(response.data.pagination.total || 0);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to fetch programs";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramDetail = async (id: string) => {
    try {
      const response = await mentoringProgramAPI.getProgramById(id);
      if (response.success && response.data) {
        setSelectedProgram(response.data.program);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to fetch program details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleProgramClick = (program: MentoringProgram) => {
    setSearchParams({ id: program._id });
    setSelectedProgram(program);
  };

  const handleBackToList = () => {
    setSearchParams({});
    setSelectedProgram(null);
    // Refresh the programs list when navigating back
    fetchPrograms();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setEditingProgram(null);
    fetchPrograms();
    // If viewing a program detail, refresh it
    if (selectedProgram && programId) {
      fetchProgramDetail(programId);
    }
  };

  const handleEdit = () => {
    if (selectedProgram) {
      setEditingProgram(selectedProgram);
      setShowCreateModal(true);
    }
  };

  const handleDelete = () => {
    handleBackToList();
    fetchPrograms();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL params with current search and filters
    const params: Record<string, string> = {};
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (statusFilter !== "all") params.status = statusFilter;
    if (categoryFilter !== "all") params.category = categoryFilter;
    setSearchParams(params);
    // fetchPrograms will be triggered by useEffect when searchTerm changes
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
    setSearchParams({});
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Update URL params when filters or search change
  useEffect(() => {
      const params: Record<string, string> = {};
    if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
    
    // Only update URL if params have changed to avoid infinite loops
    const currentSearch = searchParams.get("search") || "";
    const currentStatus = searchParams.get("status") || "all";
    const currentCategory = searchParams.get("category") || "all";
    
    if (
      (searchTerm.trim() || "") !== currentSearch ||
      statusFilter !== currentStatus ||
      categoryFilter !== currentCategory
    ) {
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, searchTerm]);

  const categories = Array.from(
    new Set(programs.map((p) => p.category).filter(Boolean))
  );

  // If viewing program detail
  if (selectedProgram && programId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation activeTab={navActiveTab} onTabChange={setNavActiveTab} />
        <main className="flex-1 w-full pt-16">
          <div className="p-6 max-w-7xl mx-auto">
            <Button variant="outline" onClick={handleBackToList} className="mb-4">
              ← Back to Programs
            </Button>
            <ProgramDetail
              programId={programId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={fetchPrograms}
              userRole={user?.role}
            />
          </div>
        </main>
        {/* Create/Edit Modal - Also render in detail view */}
        <CreateProgramModal
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) setEditingProgram(null);
          }}
          program={editingProgram || undefined}
          onSuccess={handleCreateSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeTab={navActiveTab} onTabChange={setNavActiveTab} />
      <main className="flex-1 w-full pt-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button 
              onClick={() => {
                setShowMatchingDashboard(false);
                setShowRegistered(false);
                // Clear view parameter when switching to Mentor Programs
                setSearchParams({});
              }}
              variant={!showMatchingDashboard && !showRegistered ? "default" : "outline"}
              className={!showMatchingDashboard && !showRegistered ? "bg-blue-600 hover:bg-blue-700" : "border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-800"}
            >
              Mentor Programs
            </Button>
            {isAlumni && (
              <Button 
                onClick={() => {
                  setShowMatchingDashboard(false);
                  const newShowRegistered = !showRegistered;
                  setShowRegistered(newShowRegistered);
                  // Update URL to preserve state
                  if (newShowRegistered) {
                    setSearchParams({ view: "registered" });
                  } else {
                    setSearchParams({});
                  }
                }}
                variant={showRegistered ? "default" : "outline"}
                className={showRegistered ? "bg-blue-600 hover:bg-blue-700" : "border-blue-600 text-blue-600 hover:bg-blue-50"}
              >
                Registered
              </Button>
            )}
            {!isAlumni && (
              <>
                <Button 
                  onClick={() => {
                    navigate("/mentoring-approvals");
                    setShowMatchingDashboard(false);
                    setShowRegistered(false);
                  }}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                >
                  Mentoring Approvals
                </Button>
                <Button 
                  onClick={() => {
                    setShowMatchingDashboard(!showMatchingDashboard);
                    setShowRegistered(false);
                  }}
                  variant={showMatchingDashboard ? "default" : "outline"}
                  className={showMatchingDashboard ? "bg-blue-600 hover:bg-blue-700" : "border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-800" }
                >
                  Mentor & Mentee Matching
                </Button>
              </>
            )}
          </div>

          {/* Header */}
          {!showRegistered && (
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Mentorship
                </h1>
                <p className="text-gray-600">
                  Manage and view all mentoring programs
                </p>
              </div>
              {isStaff && !showMatchingDashboard && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Program
                </Button>
              )}
            </div>
          )}

          {/* Show Matching Dashboard, Registered, or Program List */}
          {showMatchingDashboard ? (
            <MatchingDashboard 
              hideBackButton={true}
              onClose={() => setShowMatchingDashboard(false)}
            />
          ) : showRegistered ? (
            <AlumniRegistered onClose={() => setShowRegistered(false)} />
          ) : (
            <>
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className={`grid grid-cols-1 gap-4 ${isAlumni ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch(e);
                        }
                      }}
                      placeholder="Search programs..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter - Only show for staff/admin roles */}
                {!isAlumni && (
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                )}

                {/* Category Filter */}
                <Select 
                  value={categoryFilter} 
                  onValueChange={(value) => {
                    setCategoryFilter(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end items-center">
                {(statusFilter !== "all" ||
                  categoryFilter !== "all" ||
                  searchTerm) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                    className="flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              {totalPrograms > 0 ? (
                <>
                  Showing {((currentPage - 1) * programsPerPage) + 1}-
                  {Math.min(currentPage * programsPerPage, totalPrograms)} of {totalPrograms} program
                  {totalPrograms !== 1 ? "s" : ""}
                </>
              ) : (
                "No programs found"
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Program List */}
          <ProgramList
            programs={programs}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onProgramClick={handleProgramClick}
            loading={loading}
            userRole={user?.role}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Create/Edit Modal */}
          <CreateProgramModal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) setEditingProgram(null);
            }}
            program={editingProgram || undefined}
            onSuccess={handleCreateSuccess}
          />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

