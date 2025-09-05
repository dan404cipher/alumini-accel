import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Building,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: "Passionate about technology and innovation. Always looking to connect with fellow alumni and contribute to the community.",
    location: "San Francisco, CA",
    graduationYear: 2020,
    degree: "Bachelor of Science",
    major: "Computer Science",
    currentCompany: "Google Inc.",
    currentPosition: "Senior Software Engineer",
    linkedinProfile: "https://linkedin.com/in/example",
    githubProfile: "https://github.com/example",
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would typically call an API to update the user profile
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: "Passionate about technology and innovation. Always looking to connect with fellow alumni and contribute to the community.",
      location: "San Francisco, CA",
      graduationYear: 2020,
      degree: "Bachelor of Science",
      major: "Computer Science",
      currentCompany: "Google Inc.",
      currentPosition: "Senior Software Engineer",
      linkedinProfile: "https://linkedin.com/in/example",
      githubProfile: "https://github.com/example",
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-muted-foreground mb-4">
          Please log in to view your profile
        </h2>
        <Button onClick={() => (window.location.href = "/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} variant="default">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-xl">
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant="secondary" className="w-fit mx-auto">
                {user.role}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Building className="w-4 h-4 mr-2" />
                  <span>Google Inc.</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  <span>Class of 2020</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={editData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                    />
                  ) : (
                    <div className="p-2 text-sm">{user.firstName}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={editData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                    />
                  ) : (
                    <div className="p-2 text-sm">{user.lastName}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                ) : (
                  <div className="p-2 text-sm flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                ) : (
                  <div className="p-2 text-sm flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {editData.phone || "Not provided"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <textarea
                    id="bio"
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={editData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                  />
                ) : (
                  <div className="p-2 text-sm">{editData.bio}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>
                Your career and education details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  {isEditing ? (
                    <Input
                      id="currentCompany"
                      value={editData.currentCompany}
                      onChange={(e) =>
                        handleInputChange("currentCompany", e.target.value)
                      }
                    />
                  ) : (
                    <div className="p-2 text-sm flex items-center">
                      <Building className="w-4 h-4 mr-2" />
                      {editData.currentCompany}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPosition">Current Position</Label>
                  {isEditing ? (
                    <Input
                      id="currentPosition"
                      value={editData.currentPosition}
                      onChange={(e) =>
                        handleInputChange("currentPosition", e.target.value)
                      }
                    />
                  ) : (
                    <div className="p-2 text-sm">
                      {editData.currentPosition}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  {isEditing ? (
                    <Input
                      id="graduationYear"
                      type="number"
                      value={editData.graduationYear}
                      onChange={(e) =>
                        handleInputChange("graduationYear", e.target.value)
                      }
                    />
                  ) : (
                    <div className="p-2 text-sm flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {editData.graduationYear}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  {isEditing ? (
                    <Input
                      id="degree"
                      value={editData.degree}
                      onChange={(e) =>
                        handleInputChange("degree", e.target.value)
                      }
                    />
                  ) : (
                    <div className="p-2 text-sm">{editData.degree}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  {isEditing ? (
                    <Input
                      id="major"
                      value={editData.major}
                      onChange={(e) =>
                        handleInputChange("major", e.target.value)
                      }
                    />
                  ) : (
                    <div className="p-2 text-sm">{editData.major}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
