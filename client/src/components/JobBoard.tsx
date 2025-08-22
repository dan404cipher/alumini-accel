import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Building, 
  Clock,
  DollarSign,
  Users,
  Star,
  ExternalLink,
  Bookmark,
  Plus,
  Filter
} from "lucide-react";
import { PostJobDialog } from "./dialogs/PostJobDialog";

const JobBoard = () => {
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const jobs = [
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "Google",
      location: "Mountain View, CA",
      type: "Full-time",
      salary: "$180,000 - $250,000",
      postedBy: "Sarah Chen",
      postedDate: "2 days ago",
      description: "Join our team building the next generation of cloud infrastructure...",
      requirements: ["5+ years experience", "Python", "Kubernetes", "GCP"],
      applicants: 12,
      isReferral: true,
      companyLogo: "https://logo.clearbit.com/google.com",
      urgency: "High"
    },
    {
      id: 2,
      title: "Product Manager",
      company: "Microsoft",
      location: "Seattle, WA",
      type: "Full-time",
      salary: "$150,000 - $200,000",
      postedBy: "Alex Kumar",
      postedDate: "1 week ago",
      description: "Lead product strategy for our AI-powered developer tools...",
      requirements: ["3+ years PM experience", "Technical background", "Data analysis"],
      applicants: 8,
      isReferral: true,
      companyLogo: "https://logo.clearbit.com/microsoft.com",
      urgency: "Medium"
    },
    {
      id: 3,
      title: "Marketing Specialist",
      company: "Spotify",
      location: "New York, NY",
      type: "Full-time",
      salary: "$70,000 - $90,000",
      postedBy: "Maria Rodriguez",
      postedDate: "3 days ago",
      description: "Drive user acquisition and engagement for our music platform...",
      requirements: ["Digital marketing", "Analytics", "Creative thinking"],
      applicants: 15,
      isReferral: true,
      companyLogo: "https://logo.clearbit.com/spotify.com",
      urgency: "Low"
    },
    {
      id: 4,
      title: "Machine Learning Engineer",
      company: "Tesla",
      location: "Austin, TX",
      type: "Full-time",
      salary: "$160,000 - $220,000",
      postedBy: "David Park",
      postedDate: "5 days ago",
      description: "Build ML models for autonomous driving systems...",
      requirements: ["ML/AI expertise", "Python", "TensorFlow", "Computer Vision"],
      applicants: 6,
      isReferral: true,
      companyLogo: "https://logo.clearbit.com/tesla.com",
      urgency: "High"
    },
    {
      id: 5,
      title: "UX Designer",
      company: "Airbnb",
      location: "San Francisco, CA",
      type: "Contract",
      salary: "$60 - $80/hour",
      postedBy: "Emily Johnson",
      postedDate: "1 day ago",
      description: "Design intuitive user experiences for our mobile platform...",
      requirements: ["UX/UI design", "Figma", "User research", "Prototyping"],
      applicants: 9,
      isReferral: true,
      companyLogo: "https://logo.clearbit.com/airbnb.com",
      urgency: "Medium"
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "High": return "destructive";
      case "Medium": return "warning";
      case "Low": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Job Board</h1>
          <p className="text-muted-foreground">
            Opportunities from our alumni network • {jobs.length} active positions
          </p>
        </div>
        <Button 
          variant="gradient" 
          size="lg"
          onClick={() => setIsPostJobOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Post Job
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search jobs by title, company, or skills..." 
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sf">San Francisco</SelectItem>
                  <SelectItem value="nyc">New York</SelectItem>
                  <SelectItem value="seattle">Seattle</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fulltime">Full-time</SelectItem>
                  <SelectItem value="parttime">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="group hover:shadow-strong transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-1" />
                            {job.company}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {job.postedDate}
                          </div>
                        </div>
                      </div>
                      <Badge variant={getUrgencyColor(job.urgency)} className="ml-4">
                        {job.urgency} Priority
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.requirements.slice(0, 3).map((requirement, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {requirement}
                        </Badge>
                      ))}
                      {job.requirements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center text-success font-semibold">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {job.salary}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {job.type}
                        </Badge>
                        {job.isReferral && (
                          <div className="flex items-center text-primary">
                            <Star className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Alumni Referral</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-1" />
                        {job.applicants} applicants
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        Posted by <span className="text-primary font-medium">{job.postedBy}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Bookmark className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="default" size="sm">
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Jobs
        </Button>
      </div>

      {/* Dialogs */}
      <PostJobDialog open={isPostJobOpen} onOpenChange={setIsPostJobOpen} />
    </div>
  );
};

export default JobBoard;