import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Home,
  MessageSquare,
  Briefcase,
  DollarSign,
  User,
  Plus,
  Upload,
  Calendar,
  MapPin,
  Building2,
  TrendingUp,
  Heart,
  Share2,
  Edit,
  Camera,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantAPI } from "@/lib/api";

const AlumniPortal = () => {
  const { user } = useAuth();
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isUploadPaymentOpen, setIsUploadPaymentOpen] = useState(false);
  const [collegeBanner, setCollegeBanner] = useState<string | null>(null);

  // Load college banner
  useEffect(() => {
    const loadCollegeBanner = async () => {
      if (user?.tenantId) {
        try {
          const bannerResponse = await tenantAPI.getBanner(user.tenantId);
          if (bannerResponse instanceof Blob) {
            const bannerUrl = URL.createObjectURL(bannerResponse);
            setCollegeBanner(bannerUrl);
          }
        } catch (error) {
          console.log("No banner found or error loading banner:", error);

          // Check localStorage as fallback
          try {
            const storedBanner = localStorage.getItem(
              `college_banner_${user.tenantId}`
            );
            if (storedBanner) {
              setCollegeBanner(storedBanner);
            }
          } catch (localStorageError) {
            console.log(
              "Error loading banner from localStorage:",
              localStorageError
            );
          }
        }
      }
    };

    loadCollegeBanner();
  }, [user?.tenantId]);

  // Listen for banner updates
  useEffect(() => {
    const handleBannerUpdate = () => {
      if (user?.tenantId) {
        const loadCollegeBanner = async () => {
          try {
            const bannerResponse = await tenantAPI.getBanner(user.tenantId);
            if (bannerResponse instanceof Blob) {
              const bannerUrl = URL.createObjectURL(bannerResponse);
              setCollegeBanner(bannerUrl);
            }
          } catch (error) {
            console.log("No banner found or error loading banner:", error);

            // Check localStorage as fallback
            try {
              const storedBanner = localStorage.getItem(
                `college_banner_${user.tenantId}`
              );
              if (storedBanner) {
                setCollegeBanner(storedBanner);
              }
            } catch (localStorageError) {
              console.log(
                "Error loading banner from localStorage:",
                localStorageError
              );
            }
          }
        };
        loadCollegeBanner();
      }
    };

    window.addEventListener("collegeBannerUpdated", handleBannerUpdate);
    return () => {
      window.removeEventListener("collegeBannerUpdated", handleBannerUpdate);
    };
  }, [user?.tenantId]);

  // Mock data - replace with actual API calls
  const stats = {
    eventsJoined: 8,
    fundsContributed: 2500,
    jobsPosted: 3,
    postsCreated: 12,
    connections: 45,
  };

  const jobReferrals = [
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "Google",
      location: "Mountain View, CA",
      postedBy: "David Kim",
      postedDate: "2024-01-15",
      applicants: 12,
      salary: "$150k - $200k",
    },
    {
      id: 2,
      title: "Product Manager",
      company: "Microsoft",
      location: "Seattle, WA",
      postedBy: "Lisa Wang",
      postedDate: "2024-01-14",
      applicants: 8,
      salary: "$130k - $180k",
    },
  ];

  const fundraisingEvents = [
    {
      id: 1,
      title: "Research Fund Drive",
      description:
        "Support our ongoing research projects in AI and Machine Learning",
      targetAmount: 50000,
      currentAmount: 35000,
      endDate: "2024-02-28",
      organizer: "Computer Science Department",
      status: "active",
    },
    {
      id: 2,
      title: "Scholarship Fund",
      description: "Help provide scholarships for deserving students",
      targetAmount: 100000,
      currentAmount: 75000,
      endDate: "2024-03-15",
      organizer: "Student Affairs",
      status: "active",
    },
  ];

  const userProfile = {
    name: "John Smith",
    email: "john.smith@email.com",
    graduationYear: 2020,
    department: "Computer Science",
    currentCompany: "Tech Corp",
    currentPosition: "Software Engineer",
    location: "San Francisco, CA",
    bio: "Passionate about technology and helping fellow alumni succeed in their careers.",
    profilePicture: null,
    linkedinProfile: "https://linkedin.com/in/johnsmith",
    githubProfile: "https://github.com/johnsmith",
  };

  return (
    <div className="space-y-6">
      {/* College Banner */}
      {collegeBanner && (
        <div className="relative overflow-hidden rounded-lg shadow-lg">
          <img
            src={collegeBanner}
            alt="College Banner"
            className="w-full h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Welcome to Your College Alumni Portal
              </h2>
              <p className="text-xl text-white/90 mb-6 max-w-2xl">
                Connect with fellow alumni, discover opportunities, and stay
                updated with college news
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alumni Portal</h1>
          <p className="text-muted-foreground">
            Connect, share, and contribute to your alma mater
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <User className="w-4 h-4 mr-2" />
          Alumni
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Joined</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsJoined}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Funds Contributed
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.fundsContributed}</div>
            <p className="text-xs text-muted-foreground">Total contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Posted</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jobsPosted}</div>
            <p className="text-xs text-muted-foreground">Referrals made</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Created</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsCreated}</div>
            <p className="text-xs text-muted-foreground">Stories shared</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connections}</div>
            <p className="text-xs text-muted-foreground">Alumni network</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="wall" className="space-y-6">
        <TabsList>
          <TabsTrigger value="wall">Information Wall</TabsTrigger>
          <TabsTrigger value="jobs">Job Referrals</TabsTrigger>
          <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        {/* Information Wall */}
        <TabsContent value="wall" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Information Wall</h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-600">
                      Check back later for announcements, achievements, and
                      updates from your college community.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Job Referrals */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Job Referrals</h2>
            <Dialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job Opening
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post Job Opening</DialogTitle>
                  <DialogDescription>
                    Share job opportunities with fellow alumni.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job-company">Company</Label>
                    <Input id="job-company" placeholder="e.g., Google" />
                  </div>
                  <div>
                    <Label htmlFor="job-role">Role</Label>
                    <Input id="job-role" placeholder="e.g., Full-time" />
                  </div>
                  <div>
                    <Label htmlFor="job-location">Location</Label>
                    <Input
                      id="job-location"
                      placeholder="e.g., Mountain View, CA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job-description">Description</Label>
                    <Textarea
                      id="job-description"
                      placeholder="Describe the job requirements and responsibilities..."
                      className="min-h-32"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsPostJobOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsPostJobOpen(false)}>
                    Post Job
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {jobReferrals.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription>
                        {job.company} • Posted by {job.postedBy}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{job.salary}</Badge>
                      <Badge variant="secondary">
                        {job.applicants} applicants
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </span>
                      <span>{job.postedDate}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm">Apply Now</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Fundraising */}
        <TabsContent value="fundraising" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Fundraising Section</h2>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Payment
            </Button>
          </div>

          <div className="space-y-4">
            {fundraisingEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <CardDescription>{event.organizer}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          event.status === "active" ? "default" : "secondary"
                        }
                      >
                        {event.status}
                      </Badge>
                      <Badge variant="outline">Ends {event.endDate}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-700">{event.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {Math.round(
                            (event.currentAmount / event.targetAmount) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (event.currentAmount / event.targetAmount) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${event.currentAmount.toLocaleString()}</span>
                        <span>${event.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm">Make Payment</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Profile */}
        <TabsContent value="profile" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My Profile</h2>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    {userProfile.profilePicture ? (
                      <img
                        src={userProfile.profilePicture}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={userProfile.name} readOnly />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={userProfile.email} readOnly />
                  </div>
                  <div>
                    <Label>Graduation Year</Label>
                    <Input value={userProfile.graduationYear} readOnly />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input value={userProfile.department} readOnly />
                  </div>
                  <div>
                    <Label>Current Company</Label>
                    <Input value={userProfile.currentCompany} readOnly />
                  </div>
                  <div>
                    <Label>Current Position</Label>
                    <Input value={userProfile.currentPosition} readOnly />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={userProfile.location} readOnly />
                  </div>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={userProfile.bio}
                    readOnly
                    className="min-h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>LinkedIn Profile</Label>
                    <Input value={userProfile.linkedinProfile} readOnly />
                  </div>
                  <div>
                    <Label>GitHub Profile</Label>
                    <Input value={userProfile.githubProfile} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlumniPortal;
