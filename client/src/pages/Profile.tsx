import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getAuthTokenOrNull } from "@/utils/auth";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";

// Type assertion to fix ReactCrop TypeScript issues
const CropComponent = ReactCrop as any;
import "react-image-crop/dist/ReactCrop.css";
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
  X,
} from "lucide-react";
import { BasicProfileForm } from "@/components/forms/BasicProfileForm";
import { EducationalDetailsForm } from "@/components/forms/EducationalDetailsForm";
import { ProfessionalDetailsForm } from "@/components/forms/ProfessionalDetailsForm";
import { SocialNetworkingForm } from "@/components/forms/SocialNetworkingForm";
import { SkillsInterestsForm } from "@/components/forms/SkillsInterestsForm";
import { JobPreferencesForm } from "@/components/forms/JobPreferencesForm";
import { CareerTimelineForm } from "@/components/forms/CareerTimelineForm";
import { ProjectsSection } from "@/components/profile/ProjectsSection";
import { InternshipsSection } from "@/components/profile/InternshipsSection";
import { ResearchSection } from "@/components/profile/ResearchSection";
import { CertificationsSection } from "@/components/profile/CertificationsSection";
import { ConnectionsSection } from "@/components/profile/ConnectionsSection";
import { EventsSection } from "@/components/profile/EventsSection";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

// Define specific types for profile data
interface Project {
  _id?: string;
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  url?: string;
  githubUrl?: string;
}

interface Internship {
  _id?: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
}

interface Research {
  _id?: string;
  title: string;
  description: string;
  supervisor: string;
  startDate: string;
  endDate?: string;
  publication?: string;
}

interface Certification {
  _id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

interface ConnectionRequest {
  _id: string;
  from: string;
  to: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface EventRegistration {
  eventId: string;
  registeredAt: string;
  status: "registered" | "attended" | "cancelled";
}

interface EventAttendance {
  eventId: string;
  attendedAt: string;
  feedback?: {
    rating: number;
    comment?: string;
  };
}

interface CareerTimelineItem {
  _id?: string;
  position: string;
  company: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}

interface Testimonial {
  _id?: string;
  content: string;
  author: string;
  date: string;
}

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
  alumniProfile?: {
    currentCompany?: string;
    currentPosition?: string;
    experience?: number;
    currentLocation?: string;
    salary?: number;
    currency?: string;
    specialization?: string;
    isHiring?: boolean;
    achievements?: string[];
    availableForMentorship?: boolean;
    mentorshipDomains?: string[];
    projects?: Project[];
    internshipExperience?: Internship[];
    researchWork?: Research[];
    certifications?: Certification[];
    connections?: string[];
    connectionRequests?: ConnectionRequest[];
    eventsRegistered?: EventRegistration[];
    eventsAttended?: EventAttendance[];
    careerTimeline?: CareerTimelineItem[];
    testimonials?: Testimonial[];
    skills?: string[];
    careerInterests?: string[];
    university?: string;
    department?: string;
    program?: string;
    rollNumber?: string;
    studentId?: string;
    batchYear?: string;
    graduationYear?: string;
    currentYear?: string;
    currentCGPA?: number;
    currentGPA?: number;
  };
  studentProfile?: {
    university?: string;
    department?: string;
    program?: string;
    rollNumber?: string;
    studentId?: string;
    batchYear?: string;
    graduationYear?: string;
    currentYear?: string;
    currentCGPA?: number;
    currentGPA?: number;
    projects?: Project[];
    internshipExperience?: Internship[];
    researchWork?: Research[];
    certifications?: Certification[];
    connections?: string[];
    connectionRequests?: ConnectionRequest[];
    eventsRegistered?: EventRegistration[];
    eventsAttended?: EventAttendance[];
    skills?: string[];
    careerInterests?: string[];
    // Alumni-specific properties (for students who might have some alumni data)
    currentCompany?: string;
    currentPosition?: string;
    experience?: number;
    currentLocation?: string;
    salary?: number;
    currency?: string;
    specialization?: string;
    isHiring?: boolean;
    achievements?: string[];
    availableForMentorship?: boolean;
    mentorshipDomains?: string[];
    careerTimeline?: CareerTimelineItem[];
    testimonials?: Testimonial[];
  };
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Image cropping states
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  // Image processing utility functions
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (e) => reject(e));
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url;
    });

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop,
    fileName: string
  ): Promise<File> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Calculate the scale factor between displayed image and natural image
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to the crop size (square)
    const cropSize = Math.min(crop.width, crop.height);
    canvas.width = cropSize;
    canvas.height = cropSize;

    // Draw the cropped portion directly
    ctx.drawImage(
      image,
      crop.x * scaleX, // Source X
      crop.y * scaleY, // Source Y
      crop.width * scaleX, // Source width
      crop.height * scaleY, // Source height
      0, // Destination X
      0, // Destination Y
      cropSize, // Destination width
      cropSize // Destination height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Canvas is empty");
          }
          const file = new File([blob], fileName, { type: "image/jpeg" });
          resolve(file);
        },
        "image/jpeg",
        0.95
      );
    });
  };

  // Crop event handlers
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      // Create a square crop area
      const cropSize = Math.min(width, height) * 0.8; // 80% of the smaller dimension
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: "px",
            width: cropSize,
            height: cropSize,
          },
          1,
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    },
    []
  );

  const onCropChange = useCallback((crop: Crop) => {
    setCrop(crop);
  }, []);

  const onCropComplete = useCallback((crop: PixelCrop) => {
    setCompletedCrop(crop);

    // Generate preview of cropped image
    if (imgRef.current && crop.width && crop.height) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const cropSize = Math.min(crop.width, crop.height);

        canvas.width = cropSize;
        canvas.height = cropSize;

        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          cropSize,
          cropSize
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCroppedPreviewUrl(URL.createObjectURL(blob));
            }
          },
          "image/jpeg",
          0.95
        );
      }
    }
  }, []);

  const handleCropAndUpload = async () => {
    if (!imgRef.current || !completedCrop || !selectedFile) {
      return;
    }

    try {
      // Use the same image element as the preview for consistency
      const image = imgRef.current;

      const croppedImage = await getCroppedImg(
        image,
        completedCrop,
        "profile-image.jpg"
      );
      await handleImageUpload(croppedImage);

      // Reset crop interface
      setShowCrop(false);
      setPreviewUrl("");
      setSelectedFile(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      console.error("Error cropping and uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to crop and upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetCrop = () => {
    setShowCrop(false);
    setPreviewUrl("");
    setSelectedFile(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCroppedPreviewUrl("");
  };

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      // Add cache-busting parameter to prevent browser caching
      const response = await fetch(`${apiUrl}/auth/me?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileUpdate = () => {
    fetchProfile();
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const formData = new FormData();
      formData.append("profileImage", file);
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
      }/users/profile-image`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        throw new Error("Failed to upload image");
      }

      const result = await response.json();

      if (result.success) {
        // Update the profile state with the new image
        const newImageUrl = result.data.profileImage;

        setProfile((prev) => {
          const updated = prev
            ? {
                ...prev,
                user: {
                  ...prev.user,
                  profilePicture: newImageUrl,
                },
              }
            : null;
          return updated;
        });

        // Force refresh profile data to ensure image shows up
        setTimeout(() => {
          fetchProfile();
        }, 1000);

        toast({
          title: "Success",
          description: "Profile image updated successfully",
        });
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col pt-16">
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
      <div className="min-h-screen flex flex-col pt-16">
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
    <div className="min-h-screen flex flex-col pt-16">
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
                        src={
                          profile.user.profilePicture.startsWith("http")
                            ? profile.user.profilePicture
                            : profile.user.profilePicture
                        }
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            profile.user.firstName + " " + profile.user.lastName
                          )}&background=random`;
                        }}
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

                {/* Profile Image Upload Button */}
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Check file size (5MB max)
                        const maxSize = 5 * 1024 * 1024; // 5MB
                        if (file.size > maxSize) {
                          toast({
                            title: "File too large",
                            description:
                              "Please select an image smaller than 5MB",
                            variant: "destructive",
                          });
                          return;
                        }

                        // Check file type
                        if (!file.type.startsWith("image/")) {
                          toast({
                            title: "Invalid file type",
                            description: "Please select a valid image file",
                            variant: "destructive",
                          });
                          return;
                        }

                        setSelectedFile(file);
                        const url = URL.createObjectURL(file);
                        setPreviewUrl(url);
                        setShowCrop(true);
                        setCrop(undefined);
                        setCompletedCrop(undefined);
                      } else {
                        // No file selected
                      }
                    }}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById(
                        "profile-image-upload"
                      );
                      input?.click();
                    }}
                    disabled={uploadingImage || showCrop}
                    className="w-full"
                  >
                    {uploadingImage ? "Uploading..." : "Upload Profile Image"}
                  </Button>
                </div>

                {/* Crop Interface */}
                {showCrop && previewUrl && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Crop Your Image
                        </h3>
                        <Button variant="outline" size="sm" onClick={resetCrop}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>

                      <div className="flex justify-center">
                        <CropComponent
                          crop={crop}
                          onChange={onCropChange}
                          onComplete={onCropComplete}
                          aspect={1}
                          minWidth={50}
                        >
                          <img
                            ref={imgRef}
                            src={previewUrl}
                            alt="Crop preview"
                            className="max-w-full max-h-64"
                            onLoad={onImageLoad}
                          />
                        </CropComponent>
                      </div>

                      {/* Cropped Preview */}
                      {croppedPreviewUrl && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                          <h4 className="text-sm font-medium mb-2">
                            Preview of cropped image:
                          </h4>
                          <div className="flex justify-center">
                            <img
                              src={croppedPreviewUrl}
                              alt="Cropped preview"
                              className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={handleCropAndUpload}
                          disabled={!completedCrop || uploadingImage}
                          className="w-full"
                        >
                          {uploadingImage ? "Uploading..." : "Crop & Upload"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Clean Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav
                  className="flex space-x-8 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "overview"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("education")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "education"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Education
                  </button>
                  <button
                    onClick={() => setActiveTab("skills")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "skills"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Skills
                  </button>
                  <button
                    onClick={() => setActiveTab("projects")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "projects"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Projects
                  </button>
                  <button
                    onClick={() => setActiveTab("experience")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "experience"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    Experience
                  </button>
                  <button
                    onClick={() => setActiveTab("research")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "research"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Research
                  </button>
                  <button
                    onClick={() => setActiveTab("certifications")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "certifications"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Certifications
                  </button>
                  <button
                    onClick={() => setActiveTab("connections")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "connections"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Network
                  </button>
                  <button
                    onClick={() => setActiveTab("events")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "events"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Events
                  </button>
                  {!isStudent && (
                    <>
                      <button
                        onClick={() => setActiveTab("professional")}
                        className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === "professional"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        Professional
                      </button>
                      <button
                        onClick={() => setActiveTab("career")}
                        className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === "career"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Career Timeline
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveTab("social")}
                    className={`flex items-center gap-2 px-1 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === "social"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Social
                  </button>
                </nav>
              </div>

              <TabsContent
                value="overview"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
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
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Current Company
                              </label>
                              <p className="text-sm">
                                {(profileData.currentCompany as string) ||
                                  "Not specified"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Position
                              </label>
                              <p className="text-sm">
                                {(profileData.currentPosition as string) ||
                                  "Not specified"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Experience
                              </label>
                              <p className="text-sm">
                                {(profileData.experience as number)
                                  ? `${profileData.experience} years`
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">
                                Location
                              </label>
                              <p className="text-sm">
                                {(profileData.currentLocation as string) ||
                                  "Not specified"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <ConnectionsSection
                      connections={(profileData?.connections as string[]) || []}
                      connectionRequests={
                        (profileData?.connectionRequests as any[]) || []
                      }
                      isEditing={isEditing}
                      onUpdate={handleProfileUpdate}
                    />

                    <EventsSection
                      eventsRegistered={
                        (profileData?.eventsRegistered as EventRegistration[]) ||
                        []
                      }
                      eventsAttended={
                        (profileData?.eventsAttended as EventAttendance[]) || []
                      }
                      isEditing={isEditing}
                      onUpdate={handleProfileUpdate}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="education"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
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
                                    {(profileData.university as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Department
                                  </label>
                                  <p className="text-sm font-medium">
                                    {(profileData.department as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Program
                                  </label>
                                  <p className="text-sm font-medium">
                                    {(profileData.program as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Roll Number
                                  </label>
                                  <p className="text-sm font-medium">
                                    {(profileData.rollNumber as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                {profileData.studentId && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Student ID
                                    </label>
                                    <p className="text-sm font-medium">
                                      {profileData.studentId as string}
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
                                    {(profileData.batchYear as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Graduation Year
                                  </label>
                                  <p className="text-sm font-medium">
                                    {(profileData.graduationYear as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                {isStudent && profileData.currentYear && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Current Year
                                    </label>
                                    <p className="text-sm font-medium">
                                      {profileData.currentYear as string}
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
                                        {profileData.currentCGPA as number}/10
                                      </p>
                                    </div>
                                  )}
                                  {profileData.currentGPA && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-500">
                                        Current GPA
                                      </label>
                                      <p className="text-sm font-medium">
                                        {profileData.currentGPA as number}/4
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
              <TabsContent
                value="skills"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
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
                            {(profileData?.skills as string[]) &&
                            (profileData.skills as string[]).length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(profileData.skills as string[]).map(
                                  (skill, index) => (
                                    <Badge key={index} variant="secondary">
                                      {skill}
                                    </Badge>
                                  )
                                )}
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
                            {(profileData?.careerInterests as string[]) &&
                            (profileData.careerInterests as string[]).length >
                              0 ? (
                              <div className="flex flex-wrap gap-2">
                                {(profileData.careerInterests as string[]).map(
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
              <TabsContent
                value="projects"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
                <ProjectsSection
                  projects={(profileData?.projects as any[]) || []}
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                  userRole={profile.user.role}
                />
              </TabsContent>

              {/* Experience Tab (Internships) */}
              <TabsContent
                value="experience"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
                <InternshipsSection
                  internships={
                    (profileData?.internshipExperience as any[]) || []
                  }
                  isEditing={isEditing}
                  userRole={profile.user.role}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Research Tab */}
              <TabsContent
                value="research"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
                <ResearchSection
                  research={(profileData?.researchWork as any[]) || []}
                  isEditing={isEditing}
                  userRole={profile.user.role}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Certifications Tab */}
              <TabsContent
                value="certifications"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
                <CertificationsSection
                  certifications={(profileData?.certifications as any[]) || []}
                  isEditing={isEditing}
                  userRole={profile.user.role}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent
                value="connections"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
                <ConnectionsSection
                  connections={(profileData?.connections as string[]) || []}
                  connectionRequests={
                    (profileData?.connectionRequests as any[]) || []
                  }
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {/* Events Tab */}
              <TabsContent
                value="events"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
                <EventsSection
                  eventsRegistered={
                    (profileData?.eventsRegistered as EventRegistration[]) || []
                  }
                  eventsAttended={
                    (profileData?.eventsAttended as EventAttendance[]) || []
                  }
                  isEditing={isEditing}
                  onUpdate={handleProfileUpdate}
                />
              </TabsContent>

              {!isStudent && (
                <TabsContent
                  value="professional"
                  className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
                >
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
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Current Company
                                  </label>
                                  <p className="text-sm">
                                    {(profileData.currentCompany as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Position
                                  </label>
                                  <p className="text-sm">
                                    {(profileData.currentPosition as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Experience
                                  </label>
                                  <p className="text-sm">
                                    {(profileData.experience as number)
                                      ? `${profileData.experience} years`
                                      : "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Location
                                  </label>
                                  <p className="text-sm">
                                    {(profileData.currentLocation as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Salary
                                  </label>
                                  <p className="text-sm">
                                    {(profileData.salary as number) &&
                                    (profileData.currency as string)
                                      ? `${profileData.salary} ${profileData.currency}`
                                      : "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Specialization
                                  </label>
                                  <p className="text-sm">
                                    {(profileData.specialization as string) ||
                                      "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Hiring Status
                                  </label>
                                  <p className="text-sm">
                                    {(profileData.isHiring as boolean)
                                      ? "Currently Hiring"
                                      : "Not Hiring"}
                                  </p>
                                </div>
                              </div>
                              {(profileData.achievements as string[]) &&
                                (profileData.achievements as string[]).length >
                                  0 && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-500">
                                      Achievements
                                    </label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {(
                                        profileData.achievements as string[]
                                      ).map((achievement, index) => (
                                        <Badge
                                          key={index}
                                          variant="outline"
                                          className="bg-yellow-50 text-yellow-700 border-yellow-200"
                                        >
                                          {achievement}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              {(profileData.availableForMentorship as boolean) && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">
                                    Mentorship
                                  </label>
                                  <div className="mt-1">
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200"
                                    >
                                      Available for Mentorship
                                    </Badge>
                                    {(profileData.mentorshipDomains as string[]) &&
                                      (
                                        profileData.mentorshipDomains as string[]
                                      ).length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-500 mb-1">
                                            Domains:
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {(
                                              profileData.mentorshipDomains as string[]
                                            ).map((domain, index) => (
                                              <Badge
                                                key={index}
                                                variant="secondary"
                                                className="text-xs"
                                              >
                                                {domain}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
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

              {/* Career Timeline Tab - Alumni Only */}
              {!isStudent && (
                <TabsContent
                  value="career"
                  className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
                >
                  {isEditing ? (
                    <CareerTimelineForm
                      careerTimeline={
                        (profileData?.careerTimeline as CareerTimelineItem[]) ||
                        []
                      }
                      onUpdate={handleProfileUpdate}
                    />
                  ) : (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Career Timeline</CardTitle>
                          <CardDescription>
                            Your professional journey and work history
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(profileData?.careerTimeline as CareerTimelineItem[]) &&
                          (profileData.careerTimeline as CareerTimelineItem[])
                            .length > 0 ? (
                            <div className="space-y-4">
                              {(
                                profileData.careerTimeline as CareerTimelineItem[]
                              ).map((job, index) => (
                                <div
                                  key={index}
                                  className="border-l-4 border-blue-200 pl-4 py-2"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg">
                                        {job.position}
                                      </h4>
                                      <p className="text-gray-600 font-medium">
                                        {job.company}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {new Date(
                                          job.startDate
                                        ).toLocaleDateString()}{" "}
                                        -
                                        {job.isCurrent && !job.endDate
                                          ? " Present"
                                          : job.endDate
                                          ? new Date(
                                              job.endDate
                                            ).toLocaleDateString()
                                          : " Present"}
                                      </p>
                                      {job.description && (
                                        <p className="text-sm text-gray-700 mt-2">
                                          {job.description}
                                        </p>
                                      )}
                                    </div>
                                    {job.isCurrent && !job.endDate && (
                                      <Badge
                                        variant="outline"
                                        className="bg-green-50 text-green-700 border-green-200"
                                      >
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500">
                              No career timeline available
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent
                value="social"
                className="mt-6 space-y-6 animate-in fade-in-50 duration-300"
              >
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

                    {/* Testimonials Section - Alumni Only */}
                    {!isStudent &&
                      (profileData?.testimonials as Testimonial[]) &&
                      (profileData.testimonials as Testimonial[]).length >
                        0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Testimonials</CardTitle>
                            <CardDescription>
                              What others say about working with you
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {(profileData.testimonials as Testimonial[]).map(
                                (testimonial, index) => (
                                  <div
                                    key={index}
                                    className="border-l-4 border-blue-200 pl-4 py-2"
                                  >
                                    <p className="text-gray-700 italic">
                                      "{testimonial.content}"
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900">
                                        - {testimonial.author}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(
                                          testimonial.date
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

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
