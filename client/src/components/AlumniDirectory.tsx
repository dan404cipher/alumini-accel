import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/ui/pagination";
import {
  MapPin,
  Building,
  Calendar,
  Linkedin,
  Mail,
  Phone,
  Filter,
  Users,
  Star,
  Search,
  X,
  Menu,
  UserPlus,
  Heart,
  MessageCircle,
  Globe,
  GraduationCap,
  Briefcase,
  Award,
  Eye,
  Download,
  Share2,
  Grid3X3,
  List,
} from "lucide-react";
import { AddAlumniDialog } from "./dialogs/AddAlumniDialog";
import ConnectionButton from "./ConnectionButton";
import { alumniAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// User interface (for both students and alumni)
interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: string;
  registerNumber?: string;
  graduationYear?: number;
  batchYear?: number;
  department?: string;
  specialization?: string;
  program?: string;
  currentRole?: string;
  company?: string;
  location?: string;
  currentLocation?: string;
  currentYear?: string;
  currentCGPA?: number;
  currentGPA?: number;
  experience?: number;
  skills?: string[];
  careerInterests?: string[];
  isHiring: boolean;
  availableForMentorship: boolean;
  mentorshipDomains: string[];
  achievements: string[];
  bio?: string;
  linkedinProfile?: string;
  githubProfile?: string;
  website?: string;
  createdAt: string;
}

const AlumniDirectory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAddAlumniOpen, setIsAddAlumniOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedGraduationYear, setSelectedGraduationYear] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedSkills, setSelectedSkills] = useState("all");
  const [registerNumberFilter, setRegisterNumberFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);
  const { toast } = useToast();

  // Handle profile click
  const handleProfileClick = (alumniId: string) => {
    navigate(`/alumni/${alumniId}`);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await alumniAPI.getAllUsersDirectory({
        page: currentPage,
        limit: itemsPerPage,
        tenantId: user?.tenantId,
      });

      if (
        response &&
        response.data &&
        (response.data as { users: User[]; pagination?: { totalPages: number } }).users
      ) {
        const data = response.data as { users: User[]; pagination?: { totalPages: number } };
        setUsers(data.users);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users directory:", error);
      setError("Failed to load users directory");
      setUsers([]);
      toast({
        title: "Error",
        description: "Failed to load users directory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.tenantId, currentPage, itemsPerPage]);

  // Fetch users data from API
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment, selectedGraduationYear, selectedLocation, selectedExperience, selectedSkills, registerNumberFilter]);

  // Filter users based on search and filter criteria
  const filterUsers = (users: User[]) => {
    return users.filter((directoryUser) => {
      // Exclude current user
      if (directoryUser.id === user?._id) return false;

      // Search query filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          directoryUser.name.toLowerCase().includes(searchLower) ||
          directoryUser.email.toLowerCase().includes(searchLower) ||
          (directoryUser.company &&
            directoryUser.company.toLowerCase().includes(searchLower)) ||
          (directoryUser.currentRole &&
            directoryUser.currentRole.toLowerCase().includes(searchLower)) ||
          (directoryUser.department &&
            directoryUser.department.toLowerCase().includes(searchLower)) ||
          (directoryUser.skills &&
            directoryUser.skills.some((skill) =>
              skill.toLowerCase().includes(searchLower)
            )) ||
          (directoryUser.registerNumber &&
            directoryUser.registerNumber.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Department filter
      if (selectedDepartment !== "all") {
        const departmentMap: { [key: string]: string } = {
          cs: "Computer Science",
          ee: "Electrical Engineering",
          me: "Mechanical Engineering",
          ba: "Business Administration",
          ce: "Civil Engineering",
          it: "Information Technology",
          mba: "MBA",
        };
        const targetDepartment = departmentMap[selectedDepartment];
        if (
          !directoryUser.department ||
          !directoryUser.department
            .toLowerCase()
            .includes(targetDepartment.toLowerCase())
        )
          return false;
      }

      // Graduation year filter
      if (
        selectedGraduationYear !== "all" &&
        directoryUser.graduationYear !== parseInt(selectedGraduationYear)
      )
        return false;

      // Location filter
      if (selectedLocation !== "all") {
        const locationMap: { [key: string]: string[] } = {
          bangalore: ["bangalore", "bengaluru"],
          mumbai: ["mumbai"],
          delhi: ["delhi", "new delhi"],
          chennai: ["chennai", "madras"],
          hyderabad: ["hyderabad"],
          pune: ["pune"],
          kolkata: ["kolkata", "calcutta"],
          international: [
            "usa",
            "united states",
            "canada",
            "uk",
            "united kingdom",
            "australia",
            "singapore",
            "dubai",
          ],
        };
        const targetLocations = locationMap[selectedLocation] || [];
        const userLocation = (
          directoryUser.currentLocation ||
          directoryUser.location ||
          ""
        ).toLowerCase();
        if (!targetLocations.some((loc) => userLocation.includes(loc)))
          return false;
      }

      // Experience filter
      if (selectedExperience !== "all") {
        const experience = directoryUser.experience || 0;
        switch (selectedExperience) {
          case "student":
            if (directoryUser.role !== "student") return false;
            break;
          case "0-1":
            if (experience < 0 || experience > 1) return false;
            break;
          case "1-3":
            if (experience < 1 || experience > 3) return false;
            break;
          case "3-5":
            if (experience < 3 || experience > 5) return false;
            break;
          case "5-10":
            if (experience < 5 || experience > 10) return false;
            break;
          case "10+":
            if (experience < 10) return false;
            break;
        }
      }

      // Register number filter
      if (
        registerNumberFilter &&
        (!directoryUser.registerNumber ||
          !directoryUser.registerNumber
            .toLowerCase()
            .includes(registerNumberFilter.toLowerCase()))
      )
        return false;

      return true;
    });
  };

  return (
    <div className="flex gap-6 h-screen w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"}
        w-80 flex-shrink-0 bg-background
      `}
      >
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Alumni Directory
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Connect with our global network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Alumni */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Alumni</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, register number, company, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Filters</h3>

                {/* Department */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="cs">Computer Science</SelectItem>
                      <SelectItem value="ee">Electrical Engineering</SelectItem>
                      <SelectItem value="me">Mechanical Engineering</SelectItem>
                      <SelectItem value="ba">
                        Business Administration
                      </SelectItem>
                      <SelectItem value="ce">Civil Engineering</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="mba">MBA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Graduation Year */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Graduation Year</label>
                  <Select
                    value={selectedGraduationYear}
                    onValueChange={setSelectedGraduationYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                      <SelectItem value="2019">2019</SelectItem>
                      <SelectItem value="2018">2018</SelectItem>
                      <SelectItem value="2017">2017</SelectItem>
                      <SelectItem value="2016">2016</SelectItem>
                      <SelectItem value="2015">2015</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                      <SelectItem value="chennai">Chennai</SelectItem>
                      <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      <SelectItem value="pune">Pune</SelectItem>
                      <SelectItem value="kolkata">Kolkata</SelectItem>
                      <SelectItem value="international">
                        International
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Experience Level
                  </label>
                  <Select
                    value={selectedExperience}
                    onValueChange={setSelectedExperience}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="1-3">1-3 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Register Number Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Register Number</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter register number..."
                      value={registerNumberFilter}
                      onChange={(e) => setRegisterNumberFilter(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {registerNumberFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setRegisterNumberFilter("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery ||
                  (selectedDepartment && selectedDepartment !== "all") ||
                  (selectedGraduationYear &&
                    selectedGraduationYear !== "all") ||
                  (selectedLocation && selectedLocation !== "all") ||
                  (selectedExperience && selectedExperience !== "all") ||
                  registerNumberFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDepartment("all");
                      setSelectedGraduationYear("all");
                      setSelectedLocation("all");
                      setSelectedExperience("all");
                      setRegisterNumberFilter("");
                    }}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* View Mode */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">View Mode</h3>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="flex-1"
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="flex-1"
                  >
                    <List className="w-4 h-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 p-4 lg:p-6 overflow-y-auto h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                Alumni Directory
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Connect with our global network • {filterUsers(users).length}{" "}
                users
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/connections")}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              My Connections
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading users directory...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <Users className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">
                Failed to load users directory
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchUsers} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Users Grid/List */}
        {!loading && !error && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {users.length === 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "col-span-full text-center py-12"
                    : "text-center py-12"
                }
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-gray-600 mb-6">
                  Check back later for new user profiles.
                </p>
              </div>
            ) : (
              filterUsers(users).map((directoryUser) => (
                <Card
                  key={directoryUser.id}
                  className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                  onClick={() => handleProfileClick(directoryUser.id)}
                >
                  <CardContent
                    className={`${
                      viewMode === "list"
                        ? "p-4 flex items-center w-full"
                        : "p-6"
                    }`}
                  >
                    {/* Profile Header */}
                    <div
                      className={`flex items-start space-x-4 ${
                        viewMode === "list" ? "mb-0 flex-1" : "mb-4"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={
                            directoryUser.profileImage
                              ? directoryUser.profileImage.startsWith("http")
                                ? directoryUser.profileImage
                                : directoryUser.profileImage
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  directoryUser.name
                                )}&background=random&color=fff`
                          }
                          alt={directoryUser.name}
                          className={`${
                            viewMode === "list" ? "w-12 h-12" : "w-16 h-16"
                          } rounded-full object-cover`}
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              directoryUser.name
                            )}&background=random&color=fff`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-gray-900 ${
                            viewMode === "list"
                              ? "text-base mb-1"
                              : "text-lg mb-1"
                          }`}
                        >
                          {directoryUser.name}
                        </h3>

                        {viewMode === "list" ? (
                          /* List View - Compact Layout */
                          <div className="text-sm text-gray-600 space-y-1">
                            {directoryUser.currentRole && (
                              <div className="flex items-center">
                                <Briefcase className="w-3 h-3 mr-1 text-blue-600" />
                                <span className="font-medium">
                                  {directoryUser.currentRole}
                                </span>
                                {directoryUser.company && (
                                  <span className="ml-2 text-gray-500">
                                    at {directoryUser.company}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center text-gray-500 space-x-4">
                              {directoryUser.department && (
                                <span className="flex items-center">
                                  <GraduationCap className="w-3 h-3 mr-1 text-purple-600" />
                                  {directoryUser.department}
                                </span>
                              )}
                              {directoryUser.graduationYear && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1 text-orange-600" />
                                  Class of {directoryUser.graduationYear}
                                </span>
                              )}
                              {(directoryUser.currentLocation ||
                                directoryUser.location) && (
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1 text-red-600" />
                                  {directoryUser.currentLocation ||
                                    directoryUser.location}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Grid View - Full Layout */
                          <>
                            {/* Current Role and Company */}
                            <div className="text-sm text-gray-600 mb-2">
                              {directoryUser.currentRole && (
                                <div className="flex items-center mb-1">
                                  <Briefcase className="w-4 h-4 mr-1 text-blue-600" />
                                  <span className="font-medium">
                                    {directoryUser.currentRole}
                                  </span>
                                </div>
                              )}
                              {directoryUser.company && (
                                <div className="flex items-center mb-1">
                                  <Building className="w-4 h-4 mr-1 text-green-600" />
                                  <span>{directoryUser.company}</span>
                                </div>
                              )}
                            </div>

                            {/* Education Information */}
                            <div className="text-sm text-gray-500 mb-2">
                              {directoryUser.department && (
                                <div className="flex items-center mb-1">
                                  <GraduationCap className="w-4 h-4 mr-1 text-purple-600" />
                                  <span>{directoryUser.department}</span>
                                  {directoryUser.specialization && (
                                    <span className="ml-1">
                                      • {directoryUser.specialization}
                                    </span>
                                  )}
                                </div>
                              )}
                              {directoryUser.graduationYear && (
                                <div className="flex items-center mb-1">
                                  <Calendar className="w-4 h-4 mr-1 text-orange-600" />
                                  <span>
                                    Class of {directoryUser.graduationYear}
                                  </span>
                                </div>
                              )}
                              {directoryUser.registerNumber && (
                                <div className="flex items-center mb-1">
                                  <Award className="w-4 h-4 mr-1 text-indigo-600" />
                                  <span>
                                    Reg. No: {directoryUser.registerNumber}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Location */}
                            {(directoryUser.location ||
                              directoryUser.currentLocation) && (
                              <div className="flex items-center text-sm text-gray-500 mb-1">
                                <MapPin className="w-4 h-4 mr-1 text-red-600" />
                                {directoryUser.currentLocation ||
                                  directoryUser.location}
                              </div>
                            )}

                            {/* Experience */}
                            {directoryUser.experience &&
                              directoryUser.experience > 0 && (
                                <div className="flex items-center text-sm text-gray-500 mb-1">
                                  <Calendar className="w-4 h-4 mr-1 text-teal-600" />
                                  {directoryUser.experience} years experience
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    </div>

                    {viewMode === "list" ? (
                      /* List View - Right Side Actions */
                      <div className="flex items-center space-x-3 ml-4">
                        {/* Status Badges */}
                        <div className="flex space-x-2">
                          {directoryUser.availableForMentorship && (
                            <Badge variant="secondary" className="text-xs">
                              Mentoring
                            </Badge>
                          )}
                          {directoryUser.isHiring && (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-100 text-green-800"
                            >
                              Hiring
                            </Badge>
                          )}
                        </div>

                        {/* Skills Preview */}
                        {(directoryUser.skills || []).length > 0 && (
                          <div className="flex space-x-1">
                            {(directoryUser.skills || [])
                              .slice(0, 2)
                              .map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            {(directoryUser.skills || []).length > 2 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-gray-500"
                              >
                                +{(directoryUser.skills || []).length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProfileClick(directoryUser.id)}
                          >
                            View
                          </Button>
                          <ConnectionButton
                            userId={directoryUser.id}
                            userName={directoryUser.name}
                            variant="default"
                            size="sm"
                          />
                          {directoryUser.linkedinProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  directoryUser.linkedinProfile,
                                  "_blank"
                                );
                              }}
                            >
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Grid View - Full Layout */
                      <>
                        {/* Skills/Interests */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(directoryUser.skills || [])
                              .slice(0, 4)
                              .map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            {(directoryUser.skills || []).length > 4 && (
                              <Badge
                                variant="outline"
                                className="text-xs text-gray-500"
                              >
                                +{(directoryUser.skills || []).length - 4} more
                              </Badge>
                            )}
                          </div>
                          {(directoryUser.careerInterests || []).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {(directoryUser.careerInterests || [])
                                .slice(0, 3)
                                .map((interest, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    {interest}
                                  </Badge>
                                ))}
                              {(directoryUser.careerInterests || []).length >
                                3 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-gray-500"
                                >
                                  +
                                  {(directoryUser.careerInterests || [])
                                    .length - 3}{" "}
                                  more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Status Badges */}
                        <div className="mb-4">
                          {directoryUser.availableForMentorship && (
                            <Badge variant="secondary" className="text-xs mr-2">
                              Mentoring
                            </Badge>
                          )}
                          {directoryUser.isHiring && (
                            <Badge
                              variant="default"
                              className="text-xs mr-2 bg-green-100 text-green-800"
                            >
                              Hiring
                            </Badge>
                          )}
                          {directoryUser.role === "alumni" &&
                            !directoryUser.availableForMentorship && (
                              <Badge variant="outline" className="text-xs mr-2">
                                Limited Mentoring
                              </Badge>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProfileClick(directoryUser.id)}
                            className="flex-1"
                          >
                            View Profile
                          </Button>
                          <ConnectionButton
                            userId={directoryUser.id}
                            userName={directoryUser.name}
                            variant="default"
                            size="sm"
                            className="flex-1"
                          />
                          {directoryUser.linkedinProfile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  directoryUser.linkedinProfile,
                                  "_blank"
                                );
                              }}
                            >
                              <Linkedin className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="justify-center"
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddAlumniDialog
        open={isAddAlumniOpen}
        onOpenChange={setIsAddAlumniOpen}
      />
    </div>
  );
};

export default AlumniDirectory;
