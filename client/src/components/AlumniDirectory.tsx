import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Building, 
  Calendar,
  Linkedin,
  Mail,
  Phone,
  Filter,
  Users,
  Star
} from "lucide-react";
import { AddAlumniDialog } from "./dialogs/AddAlumniDialog";

const AlumniDirectory = () => {
  const [isAddAlumniOpen, setIsAddAlumniOpen] = useState(false);
  const alumni = [
    {
      id: 1,
      name: "Sarah Chen",
      graduationYear: 2019,
      degree: "Computer Science",
      currentRole: "Senior Software Engineer",
      company: "Google",
      location: "San Francisco, CA",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isHiring: true,
      badges: ["Mentor", "Donor"],
      connections: 45
    },
    {
      id: 2,
      name: "Alex Kumar",
      graduationYear: 2020,
      degree: "Electrical Engineering",
      currentRole: "Product Manager",
      company: "Microsoft",
      location: "Seattle, WA",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isHiring: false,
      badges: ["Speaker"],
      connections: 32
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      graduationYear: 2018,
      degree: "Business Administration",
      currentRole: "Marketing Director",
      company: "Spotify",
      location: "New York, NY",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isHiring: true,
      badges: ["Mentor", "Champion"],
      connections: 67
    },
    {
      id: 4,
      name: "David Park",
      graduationYear: 2021,
      degree: "Data Science",
      currentRole: "ML Engineer",
      company: "Tesla",
      location: "Austin, TX",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isHiring: false,
      badges: ["Rising Star"],
      connections: 28
    },
    {
      id: 5,
      name: "Emily Johnson",
      graduationYear: 2017,
      degree: "Mechanical Engineering",
      currentRole: "Engineering Manager",
      company: "SpaceX",
      location: "Los Angeles, CA",
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isHiring: true,
      badges: ["Mentor", "Donor", "Speaker"],
      connections: 89
    },
    {
      id: 6,
      name: "James Wilson",
      graduationYear: 2022,
      degree: "Computer Science",
      currentRole: "Software Developer",
      company: "Amazon",
      location: "Seattle, WA",
      profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      isVerified: true,
      isHiring: false,
      badges: ["Recent Graduate"],
      connections: 15
    }
  ];

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

      {/* Search & Filters */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search by name, company, or skills..." 
                className="pl-10"
              />
            </div>
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

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alumni.map((alumnus) => (
          <Card key={alumnus.id} className="group hover:shadow-strong transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <img
                    src={alumnus.profileImage}
                    alt={alumnus.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  {alumnus.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-success-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg truncate">{alumnus.name}</h3>
                    {alumnus.isHiring && (
                      <Badge variant="success" className="text-xs">Hiring</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{alumnus.currentRole}</p>
                  <p className="text-sm font-medium text-primary">{alumnus.company}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Class of {alumnus.graduationYear} • {alumnus.degree}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  {alumnus.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  {alumnus.connections} connections
                </div>
              </div>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap gap-1">
                {alumnus.badges.map((badge, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Connect
                </Button>
                <Button variant="ghost" size="sm">
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Alumni
        </Button>
      </div>

      {/* Dialogs */}
      <AddAlumniDialog open={isAddAlumniOpen} onOpenChange={setIsAddAlumniOpen} />
    </div>
  );
};

export default AlumniDirectory;