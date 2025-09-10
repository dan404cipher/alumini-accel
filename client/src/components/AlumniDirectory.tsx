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
import { alumniAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Alumni interface
interface Alumni {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  graduationYear: number;
  batchYear: number;
  department: string;
  specialization?: string;
  currentRole?: string;
  company?: string;
  location?: string;
  experience: number;
  skills: string[];
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
  const [isAddAlumniOpen, setIsAddAlumniOpen] = useState(false);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle profile click
  const handleProfileClick = (alumniId: string) => {
    navigate(`/alumni/${alumniId}`);
  };

  const fetchAlumni = useCallback(async () => {
    // Mock data for fallback
    const mockAlumni: Alumni[] = [
      {
        id: "1",
        name: "Sarah Chen",
        email: "sarah.chen@example.com",
        graduationYear: 2019,
        batchYear: 2019,
        department: "Computer Science",
        specialization: "Software Engineering",
        currentRole: "Senior Software Engineer",
        company: "Google",
        location: "San Francisco, CA",
        profileImage:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        experience: 5,
        skills: ["JavaScript", "React", "Node.js", "Python"],
        isHiring: true,
        availableForMentorship: true,
        mentorshipDomains: ["Software Engineering", "Career Development"],
        achievements: ["Google MVP Award", "Open Source Contributor"],
        bio: "Passionate software engineer with 5+ years of experience in web development.",
        linkedinProfile: "https://linkedin.com/in/sarahchen",
        githubProfile: "https://github.com/sarahchen",
        website: "https://sarahchen.dev",
        createdAt: "2019-06-01T00:00:00.000Z",
      },
    ];
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching alumni directory...");

      const response = await alumniAPI.getPublicAlumniDirectory();
      console.log("Alumni directory API response:", response);

      if (
        response &&
        response.data &&
        (response.data as { alumni: Alumni[] }).alumni
      ) {
        setAlumni((response.data as { alumni: Alumni[] }).alumni);
        console.log(
          "Processed alumni data:",
          (response.data as { alumni: Alumni[] }).alumni
        );
      } else {
        console.log("No alumni data found, using mock data");
        setAlumni(mockAlumni);
      }
    } catch (error) {
      console.error("Error fetching alumni directory:", error);
      setError("Failed to load alumni directory");
      // Fallback to mock data on error
      setAlumni(mockAlumni);
      toast({
        title: "Warning",
        description: "Using sample data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch alumni data from API
  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Alumni Directory</h1>
          <p className="text-muted-foreground">
            Connect with our global network of {alumni.length}K+ alumni
          </p>
        </div>
        <Button
          variant="gradient"
          size="lg"
          onClick={() => setIsAddAlumniOpen(true)}
        >
          <Users className="w-5 h-5 mr-2" />
          Join Network
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Graduation Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
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
            Loading alumni directory...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">
              Failed to load alumni directory
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchAlumni} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Alumni Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold">No alumni found</p>
              <p className="text-muted-foreground">
                Check back later for new alumni profiles.
              </p>
            </div>
          ) : (
            alumni.map((alumnus) => (
              <Card
                key={alumnus.id}
                className="group hover:shadow-strong transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0"
                onClick={() => handleProfileClick(alumnus.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={alumnus.profileImage}
                        alt={alumnus.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {alumnus.availableForMentorship && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-success-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg truncate">
                          {alumnus.name}
                        </h3>
                        {alumnus.isHiring && (
                          <Badge variant="success" className="text-xs">
                            Hiring
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alumnus.currentRole || "Alumni"}
                      </p>
                      {alumnus.company && (
                        <p className="text-sm font-medium text-primary">
                          {alumnus.company}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      Class of {alumnus.graduationYear} • {alumnus.department}
                    </div>
                    {alumnus.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {alumnus.location}
                      </div>
                    )}
                    {alumnus.experience > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {alumnus.experience} years experience
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {alumnus.isHiring && (
                      <Badge variant="success" className="text-xs">
                        Hiring
                      </Badge>
                    )}
                    {alumnus.availableForMentorship && (
                      <Badge variant="secondary" className="text-xs">
                        Mentor
                      </Badge>
                    )}
                    {alumnus.skills.slice(0, 2).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div
                    className="mt-4 flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                    {alumnus.linkedinProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(alumnus.linkedinProfile, "_blank");
                        }}
                      >
                        <Linkedin className="w-4 h-4" />
                      </Button>
                    )}
                    {alumnus.githubProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(alumnus.githubProfile, "_blank");
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
          Load More Alumni
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
