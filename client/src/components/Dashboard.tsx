import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  Briefcase,
  Calendar,
  TrendingUp,
  Star,
  MapPin,
  Building,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import heroImage from "@/assets/hero-alumni-network.jpg";
import { AddAlumniDialog } from "./dialogs/AddAlumniDialog";
import { CreateEventDialog } from "./dialogs/CreateEventDialog";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const [isAddAlumniOpen, setIsAddAlumniOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const { user } = useAuth();

  // Check if user can create content
  const canCreateContent =
    user?.role === "super_admin" || user?.role === "coordinator";
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-hero">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Alumni Network"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative px-8 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold text-primary-foreground mb-4">
              Welcome to AlumniAccel
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-6 max-w-2xl">
              Connect, engage, and empower your alumni community. Build lasting
              relationships that drive institutional growth and student success.
            </p>
            {canCreateContent && (
              <div className="flex flex-wrap gap-4">
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">2,847</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success font-medium">+12%</span> from last
              month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alumni</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">1,943</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success font-medium">+8%</span> engagement
              rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Referrals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">47</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success font-medium">+23%</span> this
              quarter
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">8</div>
            <p className="text-xs text-muted-foreground">
              Next: Tech Alumni Meetup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest alumni engagement and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  Sarah Chen promoted to Senior Manager
                </p>
                <p className="text-xs text-muted-foreground">
                  2024 Graduate • Google Inc.
                </p>
                <Badge variant="secondary" className="text-xs">
                  Career Update
                </Badge>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  New job posting: Software Engineer
                </p>
                <p className="text-xs text-muted-foreground">
                  Posted by Alex Kumar • Microsoft
                </p>
                <Badge variant="secondary" className="text-xs">
                  Job Opportunity
                </Badge>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  Tech Alumni Meetup - 50 registrations
                </p>
                <p className="text-xs text-muted-foreground">
                  March 15, 2024 • San Francisco
                </p>
                <Badge variant="secondary" className="text-xs">
                  Event
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canCreateContent ? (
                <>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Invite Alumni
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Event
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Post Job
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Contact your coordinator to create content
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">Top Companies</CardTitle>
              <CardDescription>Where our alumni work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Google</span>
                </div>
                <span className="text-sm text-muted-foreground">134</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Microsoft</span>
                </div>
                <span className="text-sm text-muted-foreground">98</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Amazon</span>
                </div>
                <span className="text-sm text-muted-foreground">76</span>
              </div>
              <Button variant="ghost" className="w-full text-xs">
                View All <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AddAlumniDialog
        open={isAddAlumniOpen}
        onOpenChange={setIsAddAlumniOpen}
      />
      <CreateEventDialog
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
      />
    </div>
  );
};

export default Dashboard;
