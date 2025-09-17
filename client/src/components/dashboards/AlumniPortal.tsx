import React, { useState } from "react";
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

const AlumniPortal = () => {
  const { user } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isUploadPaymentOpen, setIsUploadPaymentOpen] = useState(false);

  // Mock data - replace with actual API calls
  const stats = {
    eventsJoined: 8,
    fundsContributed: 2500,
    jobsPosted: 3,
    postsCreated: 12,
    connections: 45,
  };

  const feedPosts = [
    {
      id: 1,
      author: "Dr. Sarah Johnson",
      role: "College Admin",
      title: "Annual Alumni Reunion 2024",
      content:
        "Join us for our annual alumni reunion on February 15th. We'll have networking sessions, career workshops, and a gala dinner.",
      type: "announcement",
      likes: 45,
      comments: 12,
      date: "2024-01-15",
      isPinned: true,
    },
    {
      id: 2,
      author: "Mike Chen",
      role: "Alumni",
      title: "Success Story: From Startup to IPO",
      content:
        "Sharing my journey from founding a small startup to taking it public. Happy to mentor fellow entrepreneurs!",
      type: "achievement",
      likes: 78,
      comments: 23,
      date: "2024-01-14",
      isPinned: false,
    },
    {
      id: 3,
      author: "Emily Rodriguez",
      role: "Staff",
      title: "Career Workshop: Tech Industry Trends",
      content:
        "Join our upcoming workshop on the latest trends in the tech industry. Industry experts will be speaking.",
      type: "event",
      likes: 34,
      comments: 8,
      date: "2024-01-13",
      isPinned: false,
    },
  ];

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
      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="feed">Home Feed</TabsTrigger>
          <TabsTrigger value="wall">Information Wall</TabsTrigger>
          <TabsTrigger value="jobs">Job Referrals</TabsTrigger>
          <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        {/* Home Feed */}
        <TabsContent value="feed" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Home Feed</h2>
            <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>
                    Share your achievements, ideas, or success stories with the
                    alumni community.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="post-title">Title</Label>
                    <Input id="post-title" placeholder="Enter post title" />
                  </div>
                  <div>
                    <Label htmlFor="post-type">Type</Label>
                    <select
                      id="post-type"
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="achievement">Achievement</option>
                      <option value="idea">Idea</option>
                      <option value="success-story">Success Story</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="post-content">Content</Label>
                    <Textarea
                      id="post-content"
                      placeholder="Share your story, achievement, or idea with the alumni community..."
                      className="min-h-32"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatePostOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreatePostOpen(false)}>
                    Create Post
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {feedPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{post.author}</CardTitle>
                        <CardDescription>
                          {post.role} • {post.date}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {post.isPinned && <Badge variant="default">Pinned</Badge>}
                      <Badge variant="outline">{post.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-700">{post.content}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4 mr-2" />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Information Wall */}
        <TabsContent value="wall" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Information Wall</h2>
            <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Share Achievement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Share Your Achievement</DialogTitle>
                  <DialogDescription>
                    Post your achievements, ideas, or success stories with
                    comments enabled.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="achievement-title">Title</Label>
                    <Input
                      id="achievement-title"
                      placeholder="Enter achievement title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievement-content">Content</Label>
                    <Textarea
                      id="achievement-content"
                      placeholder="Describe your achievement, idea, or success story..."
                      className="min-h-32"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatePostOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreatePostOpen(false)}>
                    Share Achievement
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {feedPosts
              .filter(
                (post) => post.type === "achievement" || post.type === "idea"
              )
              .map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {post.author}
                          </CardTitle>
                          <CardDescription>
                            {post.role} • {post.date}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">{post.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-700">{post.content}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Button variant="ghost" size="sm">
                            <Heart className="w-4 h-4 mr-2" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {post.comments}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
