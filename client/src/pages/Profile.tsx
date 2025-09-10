import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  GraduationCap,
  Briefcase,
  BookOpen,
  Users,
  Award,
  Globe,
  Settings,
  Edit,
  Plus,
  ExternalLink,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Linkedin,
  Github,
  Twitter,
  Globe as GlobeIcon,
} from "lucide-react";
import { BasicProfileForm } from "@/components/forms/BasicProfileForm";
import { EducationalDetailsForm } from "@/components/forms/EducationalDetailsForm";
import { ProfessionalDetailsForm } from "@/components/forms/ProfessionalDetailsForm";
import { SocialNetworkingForm } from "@/components/forms/SocialNetworkingForm";
import { SkillsInterestsForm } from "@/components/forms/SkillsInterestsForm";
import { JobPreferencesForm } from "@/components/forms/JobPreferencesForm";
import { ProjectsSection } from "@/components/profile/ProjectsSection";
import { InternshipsSection } from "@/components/profile/InternshipsSection";
import { ResearchSection } from "@/components/profile/ResearchSection";
import { CertificationsSection } from "@/components/profile/CertificationsSection";
import { ConnectionsSection } from "@/components/profile/ConnectionsSection";
import { EventsSection } from "@/components/profile/EventsSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface UserProfile {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePicture?: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
    location?: string;
    university?: string;
    linkedinProfile?: string;
    githubProfile?: string;
    twitterHandle?: string;
    website?: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    role: string;
    profileCompletionPercentage: number;
  };
  alumniProfile?: any;
  studentProfile?: any;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to fetch profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    fetchProfile();
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Profile Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              Unable to load your profile information.
            </p>
            <Button onClick={fetchProfile}>Try Again</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isStudent = profile.user.role === "student";
  const isAlumni = profile.user.role === "alumni";
  const profileData = isStudent
    ? profile.studentProfile
    : profile.alumniProfile;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {profile.user.role.charAt(0).toUpperCase() +
                    profile.user.role.slice(1)}
                </Badge>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </div>
          </div>

          {/* Profile Completion Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Profile Completion
              </span>
              <span className="text-sm text-gray-500">
                {profile.user.profileCompletionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${profile.user.profileCompletionPercentage}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    {profile.user.profilePicture ? (
                      <img
                        src={profile.user.profilePicture}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-xl">
                  {profile.user.firstName} {profile.user.lastName}
                </CardTitle>
                <CardDescription className="text-sm">
                  {profile.user.email}
                </CardDescription>
                {profile.user.bio && (
                  <p className="text-sm text-gray-600 mt-2">
                    {profile.user.bio}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  {profile.user.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {profile.user.phone}
                    </div>
                  )}
                  {profile.user.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {profile.user.location}
                    </div>
                  )}
                  {profile.user.university && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {profile.user.university}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex space-x-2">
                  {profile.user.linkedinProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(profile.user.linkedinProfile, "_blank")
                      }
                    >
                      <Linkedin className="w-4 h-4" />
                    </Button>
                  )}
                  {profile.user.githubProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(profile.user.githubProfile, "_blank")
                      }
                    >
                      <Github className="w-4 h-4" />
                    </Button>
                  )}
                  {profile.user.twitterHandle && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://twitter.com/${profile.user.twitterHandle}`,
                          "_blank"
                        )
                      }
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                  )}
                  {profile.user.website && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(profile.user.website, "_blank")
                      }
                    >
                      <GlobeIcon className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Verification Status */}
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 mr-2" />
                    <span
                      className={
                        profile.user.isEmailVerified
                          ? "text-green-600"
                          : "text-gray-500"
                      }
                    >
                      Email{" "}
                      {profile.user.isEmailVerified
                        ? "Verified"
                        : "Not Verified"}
                    </span>
                  </div>
                  {profile.user.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-2" />
                      <span
                        className={
                          profile.user.isPhoneVerified
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        Phone{" "}
                        {profile.user.isPhoneVerified
                          ? "Verified"
                          : "Not Verified"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex w-full flex-wrap justify-start gap-1 p-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="education" className="text-xs sm:text-sm">
                  Education
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs sm:text-sm">
                  Skills
                </TabsTrigger>
                <TabsTrigger value="projects" className="text-xs sm:text-sm">
                  Projects
                </TabsTrigger>
                <TabsTrigger value="experience" className="text-xs sm:text-sm">
                  Experience
                </TabsTrigger>
                <TabsTrigger value="research" className="text-xs sm:text-sm">
                  Research
                </TabsTrigger>
                <TabsTrigger
                  value="certifications"
                  className="text-xs sm:text-sm"
                >
                  Certifications
                </TabsTrigger>
                <TabsTrigger value="connections" className="text-xs sm:text-sm">
                  Connections
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs sm:text-sm">
                  Events
                </TabsTrigger>
                {!isStudent && (
                  <TabsTrigger
                    value="professional"
                    className="text-xs sm:text-sm"
                  >
                    Professional
                  </TabsTrigger>
                )}
                <TabsTrigger value="social" className="text-xs sm:text-sm">
                  Social
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {isEditing ? (
                  <BasicProfileForm
                    user={profile.user}
                    onUpdate={handleProfileUpdate}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Basic Profile Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Full Name
                            </label>
                            <p className="text-sm">
                              {profile.user.firstName} {profile.user.lastName}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">
                              Email
                            </label>
                            <p className="text-sm">{profile.user.email}</p>
                          </div>
                          {profile.user.phone && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Phone
                              </label>
                              <p className="text-sm">{profile.user.phone}</p>
                            </div>
                          )}
                          {profile.user.dateOfBirth && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Date of Birth
                              </label>
                              <p className="text-sm">
                                {new Date(
                                  profile.user.dateOfBirth
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {profile.user.gender && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Gender
                              </label>
                              <p className="text-sm capitalize">
                                {profile.user.gender}
                              </p>
                            </div>
                          )}
                          {profile.user.location && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Location
                              </label>
                              <p className="text-sm">{profile.user.location}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {isAlumni && profileData && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Professional Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profileData.currentCompany && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Current Company
                                </label>
                                <p className="text-sm">
                                  {profileData.currentCompany}
                                </p>
                              </div>
                            )}
                            {profileData.currentPosition && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Position
                                </label>
                                <p className="text-sm">
                                  {profileData.currentPosition}
                                </p>
                              </div>
                            )}
                            {profileData.experience && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Experience
                                </label>
                                <p className="text-sm">
                                  {profileData.experience} years
                                </p>
                              </div>
                            )}
                            {profileData.currentLocation && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">
                                  Location
                                </label>
                                <p className="text-sm">
                                  {profileData.currentLocation}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <ConnectionsSection
                      connections={profileData?.connections || []}
                      connectionRequests={profileData?.connectionRequests || []}
                      isEditing={isEditing}
                      onUpdate={handleProfileUpdate}
                    />

                    <EventsSection
                      eventsRegistered={profileData?.eventsRegistered || []}
                      eventsAttended={profileData?.eventsAttended || []}
                      isEditing={isEditing}
                      onUpdate={handleProfileUpdate}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="education">
                {isEditing ? (
                  <EducationalDetailsForm
                    profileData={profileData}
                    userRole={profile.user.role}
                    onUpdate={handleProfileUpdate}
                  />
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Educational Background</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {profileData ? (
                          <div className="space-y-6">
                            {/* Basic Educational Information */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Basic Information
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    University
                                  </label>
                                  <p className="text-sm font-medium">
                                    {profileData.university || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Department
                                  </label>
                                  <p className="text-sm font-medium">
                                    {profileData.department || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Program
                                  </label>
                                  <p className="text-sm font-medium">
                                    {profileData.program || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Roll Number
                                  </label>
                                  <p className="text-sm font-medium">
                                    {profileData.rollNumber || "Not specified"}
                                  </p>
                                </div>
                                {profileData.studentId && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Student ID
                                    </label>
                                    <p className="text-sm font-medium">
                                      {profileData.studentId}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Academic Timeline */}
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Academic Timeline
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Batch Year
                                  </label>
                                  <p className="text-sm font-medium">
                                    {profileData.batchYear || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Graduation Year
                                  </label>
                                  <p className="text-sm font-medium">
                                    {profileData.graduationYear ||
                                      "Not specified"}
                                  </p>
                                </div>
                                {isStudent && profileData.currentYear && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Current Year
                                    </label>
                                    <p className="text-sm font-medium">
                                      {profileData.currentYear}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Academic Performance */}
                            {(profileData.currentCGPA ||
                              profileData.currentGPA) && (
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                  Academic Performance
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {profileData.currentCGPA && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">
                                        Current CGPA
                                      </label>
                                      <p className="text-sm font-medium">
                                        {profileData.currentCGPA}/10
                                      </p>
                                    </div>
                                  )}
                                  {profileData.currentGPA && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">
                                        Current GPA
                                      </label>
                                      <p className="text-sm font-medium">
                                        {profileData.currentGPA}/4
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">
                            No educational information available
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Skills & Interests Tab */}
              <TabsContent value="skills">
                {isEditing ? (
                  <SkillsInterestsForm
                    profileData={profileData}
                    userRole={profile.user.role}
                    isEditing={isEditing}
                    onUpdate={handleProfileUpdate}
                  />
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Skills & Interests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Skills
                            </h4>
                            {profileData?.skills &&
                            profileData.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {profileData.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">
                                No skills added yet
                              </p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Career Interests
                            </h4>
                            {profileData?.careerInterests &&
                            profileData.careerInterests.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {profileData.careerInterests.map(
                                  (interest, index) => (
                                    <Badge key={index} variant="outline">
                                      {interest}
                                    </Badge>
                                  )
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">
                                No career interests added yet
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects">
                <ProjectsSection
                  projects={profileData?.projects || []}
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Experience Tab (Internships) */}
              <TabsContent value="experience">
                <InternshipsSection
                  internships={profileData?.internshipExperience || []}
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Research Tab */}
              <TabsContent value="research">
                <ResearchSection
                  research={profileData?.researchWork || []}
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Certifications Tab */}
              <TabsContent value="certifications">
                <CertificationsSection
                  certifications={profileData?.certifications || []}
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections">
                <ConnectionsSection
                  connections={profileData?.connections || []}
                  connectionRequests={profileData?.connectionRequests || []}
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events">
                <EventsSection
                  eventsRegistered={profileData?.eventsRegistered || []}
                  eventsAttended={profileData?.eventsAttended || []}
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {!isStudent && (
                <TabsContent value="professional">
                  {isEditing ? (
                    <ProfessionalDetailsForm
                      profileData={profileData}
                      onUpdate={handleProfileUpdate}
                    />
                  ) : (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Professional Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {profileData ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profileData.currentCompany && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Current Company
                                    </label>
                                    <p className="text-sm">
                                      {profileData.currentCompany}
                                    </p>
                                  </div>
                                )}
                                {profileData.currentPosition && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Position
                                    </label>
                                    <p className="text-sm">
                                      {profileData.currentPosition}
                                    </p>
                                  </div>
                                )}
                                {profileData.experience && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Experience
                                    </label>
                                    <p className="text-sm">
                                      {profileData.experience} years
                                    </p>
                                  </div>
                                )}
                                {profileData.currentLocation && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Location
                                    </label>
                                    <p className="text-sm">
                                      {profileData.currentLocation}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {profileData.skills &&
                                profileData.skills.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Skills
                                    </label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {profileData.skills.map(
                                        (skill, index) => (
                                          <Badge
                                            key={index}
                                            variant="secondary"
                                          >
                                            {skill}
                                          </Badge>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <p className="text-gray-500">
                              No professional information available
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="social">
                {isEditing ? (
                  <SocialNetworkingForm
                    user={profile.user}
                    profileData={profileData}
                    onUpdate={handleProfileUpdate}
                  />
                ) : (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Social & Networking</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.user.linkedinProfile && (
                              <div className="flex items-center">
                                <Linkedin className="w-5 h-5 mr-2 text-blue-600" />
                                <a
                                  href={profile.user.linkedinProfile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  LinkedIn Profile
                                </a>
                              </div>
                            )}
                            {profile.user.githubProfile && (
                              <div className="flex items-center">
                                <Github className="w-5 h-5 mr-2 text-gray-800" />
                                <a
                                  href={profile.user.githubProfile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-gray-800 hover:underline"
                                >
                                  GitHub Profile
                                </a>
                              </div>
                            )}
                            {profile.user.twitterHandle && (
                              <div className="flex items-center">
                                <Twitter className="w-5 h-5 mr-2 text-blue-400" />
                                <a
                                  href={`https://twitter.com/${profile.user.twitterHandle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-400 hover:underline"
                                >
                                  @{profile.user.twitterHandle}
                                </a>
                              </div>
                            )}
                            {profile.user.website && (
                              <div className="flex items-center">
                                <GlobeIcon className="w-5 h-5 mr-2 text-green-600" />
                                <a
                                  href={profile.user.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-600 hover:underline"
                                >
                                  Personal Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {isStudent && (
                      <JobPreferencesForm
                        profileData={profileData}
                        isEditing={isEditing}
                        onUpdate={handleProfileUpdate}
                      />
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
