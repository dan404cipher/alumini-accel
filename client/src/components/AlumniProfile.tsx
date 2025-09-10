import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Building,
  Calendar,
  Linkedin,
  Mail,
  Phone,
  Users,
  Star,
  ArrowLeft,
  ExternalLink,
  Award,
  Briefcase,
  GraduationCap,
} from "lucide-react";
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

const AlumniProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAlumniProfile(id);
    }
  }, [id]);

  const fetchAlumniProfile = async (alumniId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching alumni profile:", alumniId);

      // For now, we'll use the public alumni directory and filter by ID
      // In a real app, you'd have a specific endpoint for individual profiles
      const response = await alumniAPI.getPublicAlumniDirectory();
      console.log("Alumni directory API response:", response);

      if (response && response.data && response.data.alumni) {
        const foundAlumni = response.data.alumni.find(
          (a: Alumni) => a.id === alumniId
        );
        if (foundAlumni) {
          setAlumni(foundAlumni);
          console.log("Found alumni profile:", foundAlumni);
        } else {
          setError("Alumni profile not found");
        }
      } else {
        setError("Failed to load alumni data");
      }
    } catch (error) {
      console.error("Error fetching alumni profile:", error);
      setError("Failed to load alumni profile");
      toast({
        title: "Error",
        description: "Failed to load alumni profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading alumni profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !alumni) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Profile Not Found</p>
            <p className="text-sm text-muted-foreground">
              {error || "This alumni profile could not be found"}
            </p>
          </div>
          <Button onClick={() => navigate("/alumni")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Alumni Directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate("/alumni")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Alumni Directory
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <img
                  src={alumni.profileImage || "/placeholder-avatar.jpg"}
                  alt={alumni.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                {alumni.isHiring && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {alumni.name}
                    </h1>
                    <p className="text-lg text-gray-600">
                      {alumni.currentRole || "Alumni"}
                    </p>
                    {alumni.company && (
                      <p className="text-primary font-medium">
                        {alumni.company}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    {alumni.isHiring && (
                      <Badge variant="success" className="text-sm">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Hiring
                      </Badge>
                    )}
                    {alumni.availableForMentorship && (
                      <Badge variant="secondary" className="text-sm">
                        <Users className="w-3 h-3 mr-1" />
                        Mentor
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <span>
                      Class of {alumni.graduationYear} • {alumni.department}
                    </span>
                  </div>
                  {alumni.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{alumni.location}</span>
                    </div>
                  )}
                  {alumni.experience > 0 && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{alumni.experience} years experience</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{alumni.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {alumni.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">About</h2>
                  <p className="text-gray-700 leading-relaxed">{alumni.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {alumni.skills.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {alumni.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {alumni.achievements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Achievements</h2>
                  <ul className="space-y-2">
                    {alumni.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start">
                        <Award className="w-4 h-4 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                        <span className="text-gray-700">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Mentorship */}
            {alumni.availableForMentorship &&
              alumni.mentorshipDomains.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Mentorship</h2>
                    <p className="text-gray-700 mb-4">
                      Available for mentorship in:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alumni.mentorshipDomains.map((domain, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm"
                        >
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Connect</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>

                  {alumni.linkedinProfile && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        window.open(alumni.linkedinProfile, "_blank")
                      }
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}

                  {alumni.githubProfile && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        window.open(alumni.githubProfile, "_blank")
                      }
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      GitHub
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}

                  {alumni.website && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(alumni.website, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Graduation Year:</span>
                    <span className="font-medium">{alumni.graduationYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{alumni.department}</span>
                  </div>
                  {alumni.specialization && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialization:</span>
                      <span className="font-medium">
                        {alumni.specialization}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">
                      {alumni.experience} years
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlumniProfile;
