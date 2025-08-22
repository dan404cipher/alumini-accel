import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Trophy, 
  Star,
  Crown,
  Medal,
  Users,
  TrendingUp,
  Heart,
  Zap
} from "lucide-react";

const Recognition = () => {
  const featuredAlumni = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      achievement: "Promoted to VP of Engineering at Google",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      badges: ["Tech Leader", "Mentor", "Donor"],
      description: "Leading groundbreaking AI research and mentoring 50+ junior engineers.",
      company: "Google"
    },
    {
      id: 2,
      name: "Maria Rodriguez",
      achievement: "Founded successful EdTech startup",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      badges: ["Entrepreneur", "Speaker", "Innovation"],
      description: "Revolutionizing online education with AI-powered learning platforms.",
      company: "EduAI"
    },
    {
      id: 3,
      name: "David Park",
      achievement: "Published breakthrough ML research",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      badges: ["Researcher", "Published Author"],
      description: "Contributing to open-source ML frameworks used by millions.",
      company: "Tesla AI"
    }
  ];

  const leaderboards = [
    {
      title: "Top Mentors",
      icon: Users,
      color: "text-primary",
      data: [
        { name: "Emily Johnson", score: "45 mentees", badge: "Mentor Champion" },
        { name: "Alex Kumar", score: "38 mentees", badge: "Super Mentor" },
        { name: "Sarah Chen", score: "32 mentees", badge: "Guide" },
      ]
    },
    {
      title: "Top Donors",
      icon: Heart,
      color: "text-success",
      data: [
        { name: "Michael Brown", score: "$50,000", badge: "Platinum Donor" },
        { name: "Lisa Wang", score: "$35,000", badge: "Gold Donor" },
        { name: "John Davis", score: "$25,000", badge: "Silver Donor" },
      ]
    },
    {
      title: "Most Active",
      icon: Zap,
      color: "text-warning",
      data: [
        { name: "James Wilson", score: "95% engagement", badge: "Super Active" },
        { name: "Anna Lee", score: "87% engagement", badge: "Engaged" },
        { name: "Robert Chen", score: "82% engagement", badge: "Active" },
      ]
    }
  ];

  const achievements = [
    {
      title: "Distinguished Alumni Award",
      recipients: 12,
      icon: Crown,
      color: "text-warning",
      description: "Recognizing exceptional career achievements and contributions"
    },
    {
      title: "Innovation Leader",
      recipients: 28,
      icon: Zap,
      color: "text-primary",
      description: "Pioneers in technology and innovation"
    },
    {
      title: "Community Champion",
      recipients: 45,
      icon: Heart,
      color: "text-success",
      description: "Outstanding service to the alumni community"
    },
    {
      title: "Mentor of Excellence",
      recipients: 67,
      icon: Star,
      color: "text-accent",
      description: "Dedicated to guiding the next generation"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Alumni Recognition
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Celebrating the outstanding achievements and contributions of our alumni community
        </p>
      </div>

      {/* Featured Alumni of the Month */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Alumni</h2>
          <Badge variant="warning" className="text-sm">
            <Crown className="w-4 h-4 mr-1" />
            This Month
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredAlumni.map((alumni, index) => (
            <Card key={alumni.id} className="group hover:shadow-strong transition-smooth animate-fade-in-up bg-gradient-card border-0">
              <CardContent className="p-6 text-center">
                <div className="relative mx-auto w-20 h-20 mb-4">
                  <img
                    src={alumni.image}
                    alt={alumni.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto"
                  />
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                      <Crown className="w-4 h-4 text-warning-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-1">{alumni.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{alumni.company}</p>
                <p className="text-sm text-muted-foreground mb-3">{alumni.description}</p>
                
                <div className="flex flex-wrap justify-center gap-1 mb-4">
                  {alumni.badges.map((badge, badgeIndex) => (
                    <Badge key={badgeIndex} variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-success">🎉 {alumni.achievement}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leaderboards */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Community Leaderboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaderboards.map((board, index) => {
            const Icon = board.icon;
            return (
              <Card key={index} className="shadow-medium animate-fade-in-up bg-gradient-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon className={`w-5 h-5 mr-2 ${board.color}`} />
                    {board.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {board.data.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          itemIndex === 0 ? 'bg-warning text-warning-foreground' :
                          itemIndex === 1 ? 'bg-muted text-muted-foreground' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {itemIndex + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.badge}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">{item.score}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Achievement Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon;
            return (
              <Card key={index} className="group hover:shadow-medium transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center ${achievement.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                  <p className="text-2xl font-bold text-primary mb-2">{achievement.recipients}</p>
                  <p className="text-xs text-muted-foreground mb-4">{achievement.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Recipients
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-hero text-primary-foreground border-0">
        <CardContent className="p-8 text-center">
          <Award className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Nominate an Alumni</h3>
          <p className="text-lg mb-6 text-primary-foreground/90">
            Know someone who deserves recognition? Nominate them for our upcoming awards!
          </p>
          <Button variant="secondary" size="lg">
            Submit Nomination
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Recognition;