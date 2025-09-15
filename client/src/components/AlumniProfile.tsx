import { useState, useEffect, useCallback } from "react";
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
  BookOpen,
  Github,
  MessageCircle,
} from "lucide-react";
import { alumniAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SimpleImageUpload from "@/components/SimpleImageUpload";
import ConnectionButton from "@/components/ConnectionButton";
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
  phone?: string;
  linkedinProfile?: string;
  githubProfile?: string;
  website?: string;
  createdAt: string;
  // Additional fields for comprehensive profile
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    credentialId?: string;
    credentialFile?: string;
  }>;
  careerTimeline?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
    gpa?: number;
  }>;
  projects?: Array<{
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    technologies?: string[];
    url?: string;
  }>;
  internshipExperience?: Array<{
    company: string;
    position: string;
    description?: string;
    startDate: string;
    endDate?: string;
    skills?: string[];
    certificateFile?: string;
  }>;
  researchWork?: Array<{
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    keywords?: string[];
    status: string;
    publicationUrl?: string;
    publicationFile?: string;
    conferenceUrl?: string;
    conferenceFile?: string;
  }>;
}

const AlumniProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser && user && currentUser._id === user.id;

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        setLoading(true);
        setError(null);

        if (!userId || userId === "undefined") {
          setError("Invalid user ID");
          setLoading(false);
          return;
        }
        const response = await alumniAPI.getUserById(userId);

        if (
          response &&
          response.data &&
          typeof response.data === "object" &&
          response.data !== null &&
          "user" in response.data
        ) {
          const userData = (response.data as { user: User }).user;
          setUser(userData);
        } else {
          setError("User profile not found");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load user profile");
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("profileImage", file);

      // Upload the image
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/users/profile-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const result = await response.json();
      if (result.success) {
        const newImageUrl = result.data.profileImage;

        // Update the user state with new image URL
        setUser((prev) => {
          return prev ? { ...prev, profileImage: newImageUrl } : null;
        });

        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });

        // Refresh the profile data to ensure we have the latest image
        if (id) {
          setTimeout(() => {
            fetchUserProfile(id);
          }, 500);
        }
      } else {
        throw new Error(result.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (id && id !== "undefined") {
      fetchUserProfile(id);
    } else {
      setError("Invalid user ID provided");
      setLoading(false);
    }
  }, [id, fetchUserProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation activeTab="" onTabChange={() => {}} />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading alumni profile...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation activeTab="" onTabChange={() => {}} />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <Users className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-semibold">Profile Not Found</p>
              <p className="text-sm text-muted-foreground">
                {error || "This user profile could not be found"}
              </p>
            </div>
            <Button onClick={() => navigate("/alumni")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Alumni Directory
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab="alumni" onTabChange={() => {}} />
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
                  src={
                    user.profileImage
                      ? user.profileImage.startsWith("http")
                        ? user.profileImage
                        : `${(
                            import.meta.env.VITE_API_URL ||
                            "http://localhost:3000/api/v1"
                          ).replace("/api/v1", "")}${user.profileImage}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=random`
                  }
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=random`;
                  }}
                />
                {user.isHiring && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.name}
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  {user.currentRole || user.role}
                </p>

                {/* Profile Image Upload - Only show for own profile */}
                {isOwnProfile && (
                  <div className="mb-4">
                    <SimpleImageUpload
                      currentImage={user.profileImage}
                      onImageChange={setImageFile}
                      onImageUpload={handleImageUpload}
                      isLoading={uploadingImage}
                      maxSize={5}
                    />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <p className="text-lg text-gray-600">
                      {user.currentRole ||
                        user.program ||
                        (user.role === "alumni" ? "Alumni" : "Student")}
                    </p>
                    {user.company && (
                      <p className="text-primary font-medium">{user.company}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    <Badge
                      variant={user.role === "alumni" ? "default" : "secondary"}
                      className="text-sm"
                    >
                      {user.role === "alumni" ? "Alumni" : "Student"}
                    </Badge>
                    {user.isHiring && (
                      <Badge variant="success" className="text-sm">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Hiring
                      </Badge>
                    )}
                    {user.availableForMentorship && (
                      <Badge variant="secondary" className="text-sm">
                        <Users className="w-3 h-3 mr-1" />
                        Mentor
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Connection Button - Only show for other users' profiles */}
                {!isOwnProfile && (
                  <div className="mb-4">
                    <ConnectionButton
                      userId={user.id}
                      userName={user.name}
                      variant="default"
                      size="default"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    <span>
                      {user.graduationYear
                        ? `Class of ${user.graduationYear}`
                        : user.currentYear || "Student"}{" "}
                      • {user.department}
                    </span>
                  </div>
                  {(user.location || user.currentLocation) && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{user.currentLocation || user.location}</span>
                    </div>
                  )}
                  {user.experience && user.experience > 0 && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{user.experience} years experience</span>
                    </div>
                  )}
                  {user.currentCGPA && (
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      <span>CGPA: {user.currentCGPA}</span>
                    </div>
                  )}
                  {user.specialization && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      <span>{user.specialization}</span>
                    </div>
                  )}
                  {user.program && (
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span>{user.program}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span className="truncate">{user.email}</span>
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
            {user.bio && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">About</h2>
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Career Interests */}
            {user.careerInterests && user.careerInterests.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Career Interests
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {user.careerInterests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-sm"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {user.achievements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Achievements</h2>
                  <ul className="space-y-2">
                    {user.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start">
                        <Award className="w-4 h-4 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                        <span className="text-gray-700">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Academic Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Academic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.batchYear && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Batch Year:</span>
                      <span className="font-medium">{user.batchYear}</span>
                    </div>
                  )}
                  {user.graduationYear && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Graduation Year:</span>
                      <span className="font-medium">{user.graduationYear}</span>
                    </div>
                  )}
                  {user.currentYear && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Year:</span>
                      <span className="font-medium">{user.currentYear}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{user.department}</span>
                    </div>
                  )}
                  {user.specialization && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialization:</span>
                      <span className="font-medium">{user.specialization}</span>
                    </div>
                  )}
                  {user.program && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Program:</span>
                      <span className="font-medium">{user.program}</span>
                    </div>
                  )}
                  {user.currentCGPA && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current CGPA:</span>
                      <span className="font-medium">{user.currentCGPA}</span>
                    </div>
                  )}
                  {user.currentGPA && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current GPA:</span>
                      <span className="font-medium">{user.currentGPA}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            {(user.currentRole ||
              user.company ||
              user.experience ||
              user.isHiring) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Professional Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.currentRole && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Role:</span>
                        <span className="font-medium">{user.currentRole}</span>
                      </div>
                    )}
                    {user.company && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company:</span>
                        <span className="font-medium">{user.company}</span>
                      </div>
                    )}
                    {user.experience && user.experience > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">
                          {user.experience} years
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hiring Status:</span>
                      <span className="font-medium">
                        {user.isHiring ? (
                          <Badge variant="success" className="text-xs">
                            Currently Hiring
                          </Badge>
                        ) : (
                          <span className="text-gray-500">Not Hiring</span>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Information */}
            {(user.location || user.currentLocation) && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Location</h2>
                  <div className="space-y-2">
                    {user.currentLocation && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-gray-700">
                          {user.currentLocation}
                        </span>
                      </div>
                    )}
                    {user.location &&
                      user.location !== user.currentLocation && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-gray-700">{user.location}</span>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-gray-500" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-gray-500" />
                      <span className="text-gray-700">{user.phone}</span>
                    </div>
                  )}
                  {(user.location || user.currentLocation) && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-3 text-gray-500" />
                      <span className="text-gray-700">
                        {user.currentLocation || user.location}
                      </span>
                    </div>
                  )}
                  {user.linkedinProfile && (
                    <div className="flex items-center">
                      <Linkedin className="w-4 h-4 mr-3 text-blue-600" />
                      <a
                        href={user.linkedinProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {user.githubProfile && (
                    <div className="flex items-center">
                      <Github className="w-4 h-4 mr-3 text-gray-600" />
                      <a
                        href={user.githubProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:underline"
                      >
                        GitHub Profile
                      </a>
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center">
                      <ExternalLink className="w-4 h-4 mr-3 text-green-600" />
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        Personal Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mentorship */}
            {user.availableForMentorship &&
              user.mentorshipDomains.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Mentorship</h2>
                    <p className="text-gray-700 mb-4">
                      Available for mentorship in:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {user.mentorshipDomains.map((domain, index) => (
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

            {/* Certifications */}
            {user.certifications && user.certifications.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Certifications</h2>
                  <div className="space-y-4">
                    {user.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-500 pl-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {cert.name}
                            </h3>
                            <p className="text-gray-600">{cert.issuer}</p>
                            {cert.credentialId && (
                              <p className="text-sm text-gray-500 font-mono">
                                ID: {cert.credentialId}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(cert.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        {cert.credentialFile && (
                          <div className="mt-2">
                            <a
                              href={`${
                                import.meta.env.VITE_API_URL?.replace(
                                  "/api/v1",
                                  ""
                                ) || "http://localhost:3000"
                              }${cert.credentialFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Credential File
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Career Timeline / Experience */}
            {user.careerTimeline && user.careerTimeline.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Career Timeline
                  </h2>
                  <div className="space-y-6">
                    {user.careerTimeline.map((job, index) => (
                      <div key={index} className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                job.isCurrent ? "bg-green-500" : "bg-gray-300"
                              }`}
                            ></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {job.position}
                                </h3>
                                <p className="text-gray-600">{job.company}</p>
                                {job.description && (
                                  <p className="text-sm text-gray-700 mt-2">
                                    {job.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <div>
                                  {new Date(job.startDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                    }
                                  )}
                                </div>
                                <div>
                                  {job.isCurrent ? (
                                    <Badge
                                      variant="success"
                                      className="text-xs mt-1"
                                    >
                                      Current
                                    </Badge>
                                  ) : job.endDate ? (
                                    new Date(job.endDate).toLocaleDateString(
                                      "en-US",
                                      {
                                        year: "numeric",
                                        month: "short",
                                      }
                                    )
                                  ) : (
                                    "Present"
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {index < user.careerTimeline.length - 1 && (
                          <div className="absolute left-2 top-6 w-0.5 h-6 bg-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {user.education && user.education.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Education</h2>
                  <div className="space-y-4">
                    {user.education.map((edu, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-purple-500 pl-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {edu.degree}
                            </h3>
                            <p className="text-gray-600">{edu.institution}</p>
                            {edu.gpa && (
                              <p className="text-sm text-gray-500">
                                GPA: {edu.gpa}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {edu.year}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Projects */}
            {user.projects && user.projects.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Projects</h2>
                  <div className="space-y-4">
                    {user.projects.map((project, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-500 pl-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {project.title}
                            </h3>
                            {project.description && (
                              <p className="text-gray-700 mt-1">
                                {project.description}
                              </p>
                            )}
                            {project.technologies &&
                              project.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {project.technologies.map(
                                    (tech, techIndex) => (
                                      <Badge
                                        key={techIndex}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {tech}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                          <div className="text-right text-sm text-gray-500 ml-4">
                            <div>
                              {new Date(project.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                }
                              )}
                            </div>
                            <div>
                              {project.endDate
                                ? new Date(project.endDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                    }
                                  )
                                : "Ongoing"}
                            </div>
                          </div>
                        </div>
                        {project.url && (
                          <div className="mt-2">
                            <a
                              href={project.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Project
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internship Experience */}
            {user.internshipExperience &&
              user.internshipExperience.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Internship Experience
                    </h2>
                    <div className="space-y-4">
                      {user.internshipExperience.map((internship, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-green-500 pl-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {internship.position}
                              </h3>
                              <p className="text-gray-600">
                                {internship.company}
                              </p>
                              {internship.description && (
                                <p className="text-gray-700 mt-1">
                                  {internship.description}
                                </p>
                              )}
                              {internship.skills &&
                                internship.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {internship.skills.map(
                                      (skill, skillIndex) => (
                                        <Badge
                                          key={skillIndex}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {skill}
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                            <div className="text-right text-sm text-gray-500 ml-4">
                              <div>
                                {new Date(
                                  internship.startDate
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                })}
                              </div>
                              <div>
                                {internship.endDate
                                  ? new Date(
                                      internship.endDate
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                    })
                                  : "Ongoing"}
                              </div>
                            </div>
                          </div>
                          {internship.certificateFile && (
                            <div className="mt-2">
                              <a
                                href={`${
                                  import.meta.env.VITE_API_URL?.replace(
                                    "/api/v1",
                                    ""
                                  ) || "http://localhost:3000"
                                }${internship.certificateFile}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Research Work */}
            {user.researchWork && user.researchWork.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Research Work</h2>
                  <div className="space-y-4">
                    {user.researchWork.map((research, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-purple-500 pl-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {research.title}
                            </h3>
                            {research.description && (
                              <p className="text-gray-700 mt-1">
                                {research.description}
                              </p>
                            )}
                            {research.keywords &&
                              research.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {research.keywords.map(
                                    (keyword, keywordIndex) => (
                                      <Badge
                                        key={keywordIndex}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {keyword}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                            <div className="mt-2">
                              <Badge
                                variant={
                                  research.status === "completed"
                                    ? "default"
                                    : research.status === "published"
                                    ? "success"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {research.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500 ml-4">
                            <div>
                              {new Date(research.startDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                }
                              )}
                            </div>
                            <div>
                              {research.endDate
                                ? new Date(research.endDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                    }
                                  )
                                : "Ongoing"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          {research.publicationUrl && (
                            <a
                              href={research.publicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Publication
                            </a>
                          )}
                          {research.publicationFile && (
                            <a
                              href={`${
                                import.meta.env.VITE_API_URL?.replace(
                                  "/api/v1",
                                  ""
                                ) || "http://localhost:3000"
                              }${research.publicationFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Publication File
                            </a>
                          )}
                          {research.conferenceUrl && (
                            <a
                              href={research.conferenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Conference
                            </a>
                          )}
                          {research.conferenceFile && (
                            <a
                              href={`${
                                import.meta.env.VITE_API_URL?.replace(
                                  "/api/v1",
                                  ""
                                ) || "http://localhost:3000"
                              }${research.conferenceFile}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Conference File
                            </a>
                          )}
                        </div>
                      </div>
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
                  {!isOwnProfile && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate(`/messages?user=${user.id}`)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  )}

                  {user.linkedinProfile && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        window.open(user.linkedinProfile, "_blank")
                      }
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}

                  {user.githubProfile && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(user.githubProfile, "_blank")}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      GitHub
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}

                  {user.website && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(user.website, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <Badge
                      variant={user.role === "alumni" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.role === "alumni" ? "Alumni" : "Student"}
                    </Badge>
                  </div>
                  {user.skills && user.skills.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skills:</span>
                      <span className="font-medium">{user.skills.length}</span>
                    </div>
                  )}
                  {user.careerInterests && user.careerInterests.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interests:</span>
                      <span className="font-medium">
                        {user.careerInterests.length}
                      </span>
                    </div>
                  )}
                  {user.achievements && user.achievements.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Achievements:</span>
                      <span className="font-medium">
                        {user.achievements.length}
                      </span>
                    </div>
                  )}
                  {user.mentorshipDomains &&
                    user.mentorshipDomains.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mentor Areas:</span>
                        <span className="font-medium">
                          {user.mentorshipDomains.length}
                        </span>
                      </div>
                    )}
                  {user.certifications && user.certifications.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certifications:</span>
                      <span className="font-medium">
                        {user.certifications.length}
                      </span>
                    </div>
                  )}
                  {user.careerTimeline && user.careerTimeline.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Career Positions:</span>
                      <span className="font-medium">
                        {user.careerTimeline.length}
                      </span>
                    </div>
                  )}
                  {user.education && user.education.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Education:</span>
                      <span className="font-medium">
                        {user.education.length}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Indicators */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Available for Mentorship
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.availableForMentorship
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Currently Hiring
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.isHiring ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Profile Complete
                    </span>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AlumniProfile;
