import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [userTypeFilter, setUserTypeFilter] = useState<
    "all" | "student" | "alumni"
  >("all");
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
        userType: userTypeFilter,
        limit: 50,
      });
      if (
        response &&
        response.data &&
        (response.data as { users: User[] }).users
      ) {
        setUsers((response.data as { users: User[] }).users);
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
  }, [userTypeFilter, toast]);

  // Fetch users data from API
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Directory</h1>
          <p className="text-muted-foreground">
            Connect with our global network of {users.length} users
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Select
                value={userTypeFilter}
                onValueChange={(value: "all" | "student" | "alumni") =>
                  setUserTypeFilter(value)
                }
              >
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cs">Computer Science</SelectItem>
                  <SelectItem value="ee">Electrical Engineering</SelectItem>
                  <SelectItem value="me">Mechanical Engineering</SelectItem>
                  <SelectItem value="ba">Business Administration</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Users Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold">No users found</p>
              <p className="text-muted-foreground">
                Check back later for new user profiles.
              </p>
            </div>
          ) : (
            users
              .filter((directoryUser) => directoryUser.id !== user?._id) // Filter out current user
              .map((directoryUser) => (
                <Card
                  key={directoryUser.id}
                  className="group hover:shadow-strong transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0"
                  onClick={() => handleProfileClick(directoryUser.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <img
                          src={
                            directoryUser.profileImage
                              ? directoryUser.profileImage.startsWith("http")
                                ? directoryUser.profileImage
                                : `${
                                    import.meta.env.VITE_API_URL ||
                                    "http://localhost:3000"
                                  }${directoryUser.profileImage}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  directoryUser.name
                                )}&background=random`
                          }
                          alt={directoryUser.name}
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              directoryUser.name
                            )}&background=random`;
                          }}
                        />
                        {directoryUser.availableForMentorship && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-success-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg truncate">
                            {directoryUser.name}
                          </h3>
                          <div className="flex gap-1">
                            <Badge
                              variant={
                                directoryUser.role === "alumni"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {directoryUser.role === "alumni"
                                ? "Alumni"
                                : "Student"}
                            </Badge>
                            {directoryUser.isHiring && (
                              <Badge variant="success" className="text-xs">
                                Hiring
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {directoryUser.currentRole ||
                            directoryUser.program ||
                            directoryUser.role}
                        </p>
                        {directoryUser.company && (
                          <p className="text-sm font-medium text-primary">
                            {directoryUser.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {directoryUser.graduationYear && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          Class of {directoryUser.graduationYear} •{" "}
                          {directoryUser.department}
                        </div>
                      )}
                      {directoryUser.currentYear && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {directoryUser.currentYear} •{" "}
                          {directoryUser.department}
                        </div>
                      )}
                      {(directoryUser.location ||
                        directoryUser.currentLocation) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2" />
                          {directoryUser.currentLocation ||
                            directoryUser.location}
                        </div>
                      )}
                      {directoryUser.experience &&
                        directoryUser.experience > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2" />
                            {directoryUser.experience} years experience
                          </div>
                        )}
                      {directoryUser.currentCGPA && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          CGPA: {directoryUser.currentCGPA}
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {directoryUser.isHiring && (
                        <Badge variant="success" className="text-xs">
                          Hiring
                        </Badge>
                      )}
                      {directoryUser.availableForMentorship && (
                        <Badge variant="secondary" className="text-xs">
                          Mentor
                        </Badge>
                      )}
                      {(directoryUser.skills || [])
                        .slice(0, 2)
                        .map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      {(directoryUser.careerInterests || [])
                        .slice(0, 1)
                        .map((interest, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {interest}
                          </Badge>
                        ))}
                    </div>

                    {/* Actions */}
                    <div
                      className="mt-4 flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ConnectionButton
                        userId={directoryUser.id}
                        userName={directoryUser.name}
                        variant="outline"
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
                      {directoryUser.githubProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(directoryUser.githubProfile, "_blank");
                          }}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Users
        </Button>
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
