import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Grid,
  List,
  Calendar,
  X,
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const programId = searchParams.get("id");
  // STAFF, HOD, and College Admin can create, edit, delete, publish, and unpublish programs
  const isStaff = user?.role === "staff" || user?.role === "hod" || user?.role === "college_admin";
  // Check if user is alumni
  const isAlumni = user?.role === "alumni";

  useEffect(() => {
    if (programId) {
      fetchProgramDetail(programId);
    } else {
      setSelectedProgram(null);
    }
  }, [programId]);

  useEffect(() => {
    fetchPrograms();
  }, [statusFilter, categoryFilter, searchTerm, page]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const filters: ProgramFilters = {
        page,
        limit: 12,
      };

      if (statusFilter !== "all") {
        filters.status = statusFilter as any;
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
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch programs",
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch program details",
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
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setEditingProgram(null);
    fetchPrograms();
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
    setPage(1);
    fetchPrograms();
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearchTerm("");
    setPage(1);
    setSearchParams({});
  };

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
              userRole={user?.role}
            />
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
              className={!showMatchingDashboard && !showRegistered ? "bg-blue-600 hover:bg-blue-700" : "border-blue-600 text-blue-600 hover:bg-blue-50"}
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
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Mentoring Approvals
                </Button>
                <Button 
                  onClick={() => {
                    setShowMatchingDashboard(!showMatchingDashboard);
                    setShowRegistered(false);
                  }}
                  variant={showMatchingDashboard ? "default" : "outline"}
                  className={showMatchingDashboard ? "bg-blue-600 hover:bg-blue-700" : "border-blue-600 text-blue-600 hover:bg-blue-50"}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search programs..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
              <div className="flex justify-between items-center">
                <Button type="submit" variant="default">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
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
              Showing {programs.length} program{programs.length !== 1 ? "s" : ""}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
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

