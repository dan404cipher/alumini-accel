import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Building2,
  MapPin,
  Phone,
  Globe,
  Users,
  GraduationCap,
} from "lucide-react";
import { tenantAPI } from "@/lib/api";

interface CollegeInfo {
  name: string;
  about?: string;
  logo?: string;
  banner?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  settings?: {
    allowAlumniRegistration?: boolean;
    requireApproval?: boolean;
    allowJobPosting?: boolean;
    allowFundraising?: boolean;
    allowMentorship?: boolean;
    allowEvents?: boolean;
  };
}

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo | null>(null);
  const [collegeLoading, setCollegeLoading] = useState(true);

  const { login, error, clearError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch college information on component mount
  useEffect(() => {
    const fetchCollegeInfo = async () => {
      try {
        const response = await tenantAPI.getPublicCollegeInfo();
        if (response.success) {
          setCollegeInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching college info:", error);
      } finally {
        setCollegeLoading(false);
      }
    };

    fetchCollegeInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    const success = await login(formData.email, formData.password);

    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: error || "Please check your credentials",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - College Information */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 relative overflow-hidden min-h-[50vh] lg:min-h-screen">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {collegeInfo?.banner && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
            style={{ backgroundImage: `url(${collegeInfo.banner})` }}
          />
        )}

        <div className="relative z-10 flex flex-col justify-center items-start p-6 sm:p-8 lg:p-12 text-left max-w-2xl mx-auto lg:mx-0">
          {collegeLoading ? (
            <div className="animate-pulse space-y-6 w-full">
              <div className="h-8 sm:h-10 lg:h-12 bg-white/20 rounded w-3/4"></div>
              <div className="h-3 sm:h-4 bg-white/20 rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-white/20 rounded w-5/6"></div>
              <div className="h-3 sm:h-4 bg-white/20 rounded w-4/5"></div>
              <div className="h-6 sm:h-8 bg-white/20 rounded w-1/2"></div>
              <div className="h-3 sm:h-4 bg-white/20 rounded w-full"></div>
              <div className="h-3 sm:h-4 bg-white/20 rounded w-3/4"></div>
            </div>
          ) : collegeInfo ? (
            <>
              <div className="mb-6 sm:mb-8 animate-fade-in">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4 sm:mb-6 leading-tight drop-shadow-lg">
                  {collegeInfo.name}
                </h1>
                <div className="w-16 sm:w-20 lg:w-24 h-1 bg-primary rounded-full mb-4 sm:mb-6 shadow-lg"></div>

                {collegeInfo.about && (
                  <p className="text-base sm:text-lg lg:text-xl text-primary/80 mb-6 sm:mb-8 leading-relaxed drop-shadow-md">
                    {collegeInfo.about}
                  </p>
                )}
              </div>

              {/* AlumniAccel Platform Description */}
              <div className="mb-6 sm:mb-8 animate-fade-in delay-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-3 sm:mb-4 drop-shadow-lg">
                  AlumniAccel
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-primary/80 mb-4 sm:mb-6 leading-relaxed drop-shadow-md">
                  Connect with your alumni community and unlock new
                  opportunities
                </p>
              </div>

              {/* Key Features */}
              <div className="mb-6 sm:mb-8 animate-fade-in delay-300">
                <h3 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 drop-shadow-lg">
                  Features:
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-primary text-sm sm:text-base">
                        Alumni Directory & Networking:
                      </h4>
                      <p className="text-xs sm:text-sm text-primary/70 leading-relaxed">
                        Find and connect with fellow alumni, expand your
                        professional network, and stay updated with your
                        community.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-primary text-sm sm:text-base">
                        Mentorship Programs:
                      </h4>
                      <p className="text-xs sm:text-sm text-primary/70 leading-relaxed">
                        Join or become a mentor, share knowledge, and accelerate
                        career growth through meaningful guidance.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-primary text-sm sm:text-base">
                        Career Development:
                      </h4>
                      <p className="text-xs sm:text-sm text-primary/70 leading-relaxed">
                        Access job postings, career resources, and
                        skill-building opportunities tailored for alumni.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-6 sm:mb-8 animate-fade-in delay-400">
                <h3 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 drop-shadow-lg">
                  Why AlumniAccel?
                </h3>
                <p className="text-sm sm:text-base text-primary/80 leading-relaxed drop-shadow-md">
                  Stay connected, grow professionally, and create lasting
                  relationships that open doors to new opportunities.
                  AlumniAccel empowers you to leverage your educational
                  background and alumni network for career advancement, personal
                  growth, and community impact. Join thousands of successful
                  alumni who have transformed their careers and built meaningful
                  connections through our platform.
                </p>
              </div>

              {/* Contact Information */}
              {collegeInfo.contactInfo && (
                <div className="border-t border-white/20 pt-4 sm:pt-6 animate-fade-in delay-500">
                  <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4 drop-shadow-lg">
                    Get in Touch
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-primary/80">
                    {collegeInfo.contactInfo.address && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="leading-relaxed">
                          {collegeInfo.contactInfo.address}
                        </span>
                      </div>
                    )}
                    {collegeInfo.contactInfo.phone && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span className="leading-relaxed">
                          {collegeInfo.contactInfo.phone}
                        </span>
                      </div>
                    )}
                    {collegeInfo.contactInfo.website && (
                      <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300">
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <a
                          href={collegeInfo.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors leading-relaxed"
                        >
                          {collegeInfo.contactInfo.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-left animate-fade-in">
              <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary mb-4 sm:mb-6 drop-shadow-lg" />
              <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3 sm:mb-4 drop-shadow-lg">
                AlumniAccel
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-primary/80 mb-4 sm:mb-6 leading-relaxed drop-shadow-md">
                Connect with your alumni community and unlock new opportunities.
                AlumniAccel is your gateway to a thriving network of
                professionals, mentors, and lifelong friends who share your
                educational journey. Whether you're seeking career advancement,
                looking to give back through mentorship, or simply want to stay
                connected with your alma mater, our platform provides the tools
                and connections you need to succeed.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-primary text-xs sm:text-sm">
                      Alumni Directory & Networking:
                    </h4>
                    <p className="text-xs text-primary/70 leading-relaxed">
                      Find and connect with fellow alumni, expand your
                      professional network, and stay updated with your
                      community.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-primary text-xs sm:text-sm">
                      Mentorship Programs:
                    </h4>
                    <p className="text-xs text-primary/70 leading-relaxed">
                      Join or become a mentor, share knowledge, and accelerate
                      career growth through meaningful guidance.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-medium text-primary text-xs sm:text-sm">
                      Career Development:
                    </h4>
                    <p className="text-xs text-primary/70 leading-relaxed">
                      Access job postings, career resources, and skill-building
                      opportunities tailored for alumni.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile College Info */}
      <div className="lg:hidden bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 p-4 sm:p-6 text-center relative overflow-hidden">
        {/* Mobile Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2 drop-shadow-lg">
            {collegeInfo?.name || "AlumniAccel"}
          </h1>
          <p className="text-xs sm:text-sm text-primary/80 mb-3 sm:mb-4 drop-shadow-md">
            Connect with your alumni community
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-primary/70">
            <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              • Alumni Directory
            </span>
            <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              • Mentorship
            </span>
            <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              • Job Board
            </span>
            <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
              • Events
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background to-muted/20 min-h-[50vh] lg:min-h-screen">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm animate-fade-in-up">
          <CardHeader className="space-y-2 p-6 sm:p-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-primary">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 h-11 border-2 focus:border-primary transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-11 border-2 focus:border-primary transition-all duration-200"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50">
                <p className="text-sm font-medium text-foreground mb-2">
                  Need access?
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Alumni accounts are created by administrators. Contact your
                  coordinator or admin to get access to the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
