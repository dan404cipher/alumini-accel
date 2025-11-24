import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Award, 
  Target, 
  User, 
  Building2, 
  MapPin, 
  Briefcase,
  GraduationCap,
  FileText,
  Trophy,
  TrendingUp,
  MessageSquare,
  Calendar,
  DollarSign
} from "lucide-react";

interface ProgressTrackingProps {
  alumni: any;
  engagementMetrics: any;
}

interface ProfileField {
  label: string;
  value: any;
  required: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export const ProgressTracking = ({ alumni, engagementMetrics }: ProgressTrackingProps) => {
  // Get user data (could be nested in userId or user)
  const user = alumni?.userId || alumni?.user || {};
  const profile = alumni || {};

  // Calculate profile completion with comprehensive field checking
  const calculateProfileCompletion = () => {
    const profileFields: ProfileField[] = [
      {
        label: "Profile Picture",
        value: user?.profilePicture || user?.profileImage,
        required: false,
        icon: User,
      },
      {
        label: "Bio",
        value: user?.bio || profile?.bio,
        required: false,
        icon: FileText,
      },
      {
        label: "Current Company",
        value: profile?.currentCompany || user?.currentCompany,
        required: false,
        icon: Building2,
      },
      {
        label: "Current Position",
        value: profile?.currentPosition || user?.currentPosition,
        required: false,
        icon: Briefcase,
      },
      {
        label: "Location",
        value: profile?.currentLocation || user?.location,
        required: false,
        icon: MapPin,
      },
      {
        label: "Skills",
        value: profile?.skills?.length > 0,
        required: false,
        icon: Target,
      },
      {
        label: "Education",
        value: profile?.education?.length > 0,
        required: false,
        icon: GraduationCap,
      },
      {
        label: "Career Timeline",
        value: profile?.careerTimeline?.length > 0,
        required: false,
        icon: Briefcase,
      },
      {
        label: "Certifications",
        value: profile?.certifications?.length > 0,
        required: false,
        icon: Trophy,
      },
      {
        label: "LinkedIn Profile",
        value: user?.linkedinProfile,
        required: false,
        icon: User,
      },
      {
        label: "Phone Number",
        value: user?.phone,
        required: false,
        icon: User,
      },
    ];

    const completedFields = profileFields.filter((field) => {
      if (typeof field.value === "boolean") {
        return field.value === true;
      }
      return field.value && field.value.toString().trim().length > 0;
    }).length;

    const totalFields = profileFields.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      percentage: completionPercentage,
      completed: completedFields,
      total: totalFields,
      fields: profileFields,
    };
  };

  const profileCompletion = calculateProfileCompletion();

  const milestones = [
    {
      label: "Profile Complete",
      description: "Complete all profile sections",
      achieved: profileCompletion.percentage >= 100,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "First Donation",
      description: "Make your first donation",
      achieved: engagementMetrics?.donationCount > 0,
      icon: DollarSign,
      color: "blue",
    },
    {
      label: "Event Attendee",
      description: "Attend your first event",
      achieved: engagementMetrics?.eventsAttended > 0,
      icon: Calendar,
      color: "purple",
    },
    {
      label: "Active Communicator",
      description: "Send or receive messages",
      achieved: engagementMetrics?.messageCount > 0,
      icon: MessageSquare,
      color: "indigo",
    },
    {
      label: "High Engagement",
      description: "Achieve 80+ engagement score",
      achieved: engagementMetrics?.score >= 80,
      icon: TrendingUp,
      color: "amber",
    },
    {
      label: "Job Contributor",
      description: "Post or apply for jobs",
      achieved: (engagementMetrics?.jobsPosted || 0) > 0 || (engagementMetrics?.jobsApplied || 0) > 0,
      icon: Briefcase,
      color: "teal",
    },
  ];

  const getColorClasses = (color: string, achieved: boolean) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      green: {
        bg: achieved ? "bg-green-50" : "bg-muted/50",
        border: achieved ? "border-green-200" : "border-border",
        text: achieved ? "text-green-900" : "text-muted-foreground",
        icon: achieved ? "text-green-600" : "text-muted-foreground",
      },
      blue: {
        bg: achieved ? "bg-blue-50" : "bg-muted/50",
        border: achieved ? "border-blue-200" : "border-border",
        text: achieved ? "text-blue-900" : "text-muted-foreground",
        icon: achieved ? "text-blue-600" : "text-muted-foreground",
      },
      purple: {
        bg: achieved ? "bg-purple-50" : "bg-muted/50",
        border: achieved ? "border-purple-200" : "border-border",
        text: achieved ? "text-purple-900" : "text-muted-foreground",
        icon: achieved ? "text-purple-600" : "text-muted-foreground",
      },
      indigo: {
        bg: achieved ? "bg-indigo-50" : "bg-muted/50",
        border: achieved ? "border-indigo-200" : "border-border",
        text: achieved ? "text-indigo-900" : "text-muted-foreground",
        icon: achieved ? "text-indigo-600" : "text-muted-foreground",
      },
      amber: {
        bg: achieved ? "bg-amber-50" : "bg-muted/50",
        border: achieved ? "border-amber-200" : "border-border",
        text: achieved ? "text-amber-900" : "text-muted-foreground",
        icon: achieved ? "text-amber-600" : "text-muted-foreground",
      },
      teal: {
        bg: achieved ? "bg-teal-50" : "bg-muted/50",
        border: achieved ? "border-teal-200" : "border-border",
        text: achieved ? "text-teal-900" : "text-muted-foreground",
        icon: achieved ? "text-teal-600" : "text-muted-foreground",
      },
    };
    return colorMap[color] || colorMap.green;
  };

  const incompleteFields = profileCompletion.fields.filter((field) => {
    if (typeof field.value === "boolean") {
      return field.value === false;
    }
    return !field.value || field.value.toString().trim().length === 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Progress Tracking</h2>
        <Badge variant="outline" className="text-sm">
          {profileCompletion.completed}/{profileCompletion.total} Complete
        </Badge>
      </div>

      {/* Profile Completion Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Profile Completion</CardTitle>
            <span className={`text-2xl font-bold ${
              profileCompletion.percentage >= 100 ? "text-green-600" :
              profileCompletion.percentage >= 75 ? "text-blue-600" :
              profileCompletion.percentage >= 50 ? "text-yellow-600" :
              "text-red-600"
            }`}>
              {profileCompletion.percentage}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Progress 
              value={profileCompletion.percentage} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {profileCompletion.completed} of {profileCompletion.total} fields completed
              </span>
              {profileCompletion.percentage < 100 && (
                <span className="text-muted-foreground">
                  {profileCompletion.total - profileCompletion.completed} remaining
                </span>
              )}
            </div>
          </div>

          {/* Missing Fields */}
          {incompleteFields.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-3 text-muted-foreground">
                Missing Information:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {incompleteFields.slice(0, 6).map((field, idx) => {
                  const Icon = field.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{field.label}</span>
                    </div>
                  );
                })}
                {incompleteFields.length > 6 && (
                  <div className="text-sm text-muted-foreground">
                    +{incompleteFields.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Achievement Milestones</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Track your engagement and profile milestones
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((milestone, idx) => {
              const Icon = milestone.icon;
              const colors = getColorClasses(milestone.color, milestone.achieved);
              return (
                <div
                  key={idx}
                  className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${
                    milestone.achieved
                      ? `${colors.bg} ${colors.border} shadow-sm`
                      : `${colors.bg} ${colors.border}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        milestone.achieved ? "bg-white/50" : "bg-muted"
                      }`}>
                        <Icon className={`w-5 h-5 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${colors.text}`}>
                          {milestone.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    {milestone.achieved && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                  {milestone.achieved && (
                    <Badge 
                      variant="outline" 
                      className={`w-fit ${colors.bg} ${colors.text} border-current`}
                    >
                      Achieved
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Engagement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">
                {engagementMetrics?.score || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Engagement Score</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">
                {engagementMetrics?.donationCount || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Donations</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">
                {engagementMetrics?.eventsAttended || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Events Attended</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">
                {engagementMetrics?.messageCount || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Messages</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
