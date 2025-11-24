import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Target } from "lucide-react";

interface ProgressTrackingProps {
  alumni: any;
  engagementMetrics: any;
}

export const ProgressTracking = ({ alumni, engagementMetrics }: ProgressTrackingProps) => {
  // Calculate profile completion
  const calculateProfileCompletion = () => {
    const fields = [
      alumni?.currentCompany,
      alumni?.currentPosition,
      alumni?.currentLocation,
      alumni?.skills?.length > 0,
      alumni?.careerTimeline?.length > 0,
      alumni?.education?.length > 0,
      alumni?.certifications?.length > 0,
    ];
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  const milestones = [
    {
      label: "Profile Complete",
      achieved: profileCompletion >= 100,
      icon: CheckCircle,
    },
    {
      label: "First Donation",
      achieved: engagementMetrics.donationCount > 0,
      icon: Award,
    },
    {
      label: "Event Attendee",
      achieved: engagementMetrics.eventsAttended > 0,
      icon: Target,
    },
    {
      label: "High Engagement",
      achieved: engagementMetrics.score >= 80,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Progress Tracking</h2>

      {/* Profile Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{profileCompletion}%</span>
              <span className="text-sm text-muted-foreground">Complete</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Complete your profile to improve engagement opportunities
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {milestones.map((milestone, idx) => {
              const Icon = milestone.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    milestone.achieved
                      ? "bg-green-50 border-green-200"
                      : "bg-muted border-border"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      milestone.achieved ? "text-green-600" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      milestone.achieved ? "font-medium text-green-900" : "text-muted-foreground"
                    }`}
                  >
                    {milestone.label}
                  </span>
                  {milestone.achieved && (
                    <Badge variant="outline" className="ml-auto bg-green-100 text-green-800">
                      Achieved
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

