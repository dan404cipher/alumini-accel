import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Target,
  UsersRound,
  Handshake,
  AlertCircle,
} from "lucide-react";

interface SummaryCardsProps {
  summary: {
    totalAlumni: number;
    totalStudents: number;
    totalStaff: number;
    totalEvents: number;
    totalDonations: number;
    totalDonationAmount: number;
    totalJobs: number;
    totalCampaigns: number;
    totalCommunities: number;
    totalMentorshipPrograms: number;
    activeMentorshipMatches: number;
    pendingJobs: number;
  };
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const cards = [
    {
      title: "Total Alumni",
      value: summary.totalAlumni.toLocaleString(),
      icon: GraduationCap,
      color: "text-blue-500",
      bgColor: "bg-blue-50/50",
      borderColor: "border-l-blue-500",
    },
    {
      title: "Total Students",
      value: summary.totalStudents.toLocaleString(),
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-50/50",
      borderColor: "border-l-green-500",
    },
    {
      title: "Total Staff",
      value: summary.totalStaff.toLocaleString(),
      icon: UsersRound,
      color: "text-purple-500",
      bgColor: "bg-purple-50/50",
      borderColor: "border-l-purple-500",
    },
    {
      title: "Total Events",
      value: summary.totalEvents.toLocaleString(),
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-orange-50/50",
      borderColor: "border-l-orange-500",
    },
    {
      title: "Total Donations",
      value: `$${summary.totalDonationAmount.toLocaleString()}`,
      subtitle: `${summary.totalDonations} donations`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50/50",
      borderColor: "border-l-emerald-500",
    },
    {
      title: "Total Jobs",
      value: summary.totalJobs.toLocaleString(),
      subtitle: summary.pendingJobs > 0 ? `${summary.pendingJobs} pending` : "",
      icon: Briefcase,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50/50",
      borderColor: "border-l-indigo-500",
    },
    {
      title: "Total Campaigns",
      value: summary.totalCampaigns.toLocaleString(),
      icon: Target,
      color: "text-pink-500",
      bgColor: "bg-pink-50/50",
      borderColor: "border-l-pink-500",
    },
    {
      title: "Total Communities",
      value: summary.totalCommunities.toLocaleString(),
      icon: UsersRound,
      color: "text-teal-500",
      bgColor: "bg-teal-50/50",
      borderColor: "border-l-teal-500",
    },
    {
      title: "Mentorship Programs",
      value: summary.totalMentorshipPrograms.toLocaleString(),
      subtitle: `${summary.activeMentorshipMatches} active matches`,
      icon: Handshake,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50/50",
      borderColor: "border-l-cyan-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`${card.bgColor} ${card.borderColor} border-l-4 transition-shadow hover:shadow-md`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

