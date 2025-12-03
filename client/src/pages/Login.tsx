import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Loader2,
  Briefcase,
  TrendingUp,
  Award,
  Network,
  Shield,
  Zap,
} from "lucide-react";
import { tenantAPI, API_BASE_URL } from "@/lib/api";

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
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const { login, error, clearError } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

    const success = await login(formData.email, formData.password, rememberMe);

    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome back to AlumniAccel!",
      });
      const returnUrl = searchParams.get("returnUrl");
      navigate(returnUrl || "/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: error || "Please check your credentials and try again",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const requestData = { email: forgotPasswordEmail };

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Reset email sent",
          description:
            "Please check your email for password reset instructions",
        });
        setForgotPasswordOpen(false);
        setForgotPasswordEmail("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const features = [
    {
      icon: Network,
      title: "Alumni Network",
      description: "Connect with thousands of alumni worldwide",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Briefcase,
      title: "Career Opportunities",
      description: "Access exclusive job postings and career resources",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: "Mentorship",
      description: "Find mentors or guide the next generation",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: TrendingUp,
      title: "Professional Growth",
      description: "Workshops, webinars, and skill development",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const stats = [
    { value: "10K+", label: "Alumni Members" },
    { value: "500+", label: "Active Mentors" },
    { value: "1K+", label: "Job Opportunities" },
    { value: "200+", label: "Annual Events" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Pattern - Hidden on mobile for performance */}
      <div className="hidden md:block fixed inset-0 z-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Floating Orbs - Optimized for different screen sizes */}
      <div className="hidden md:block fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-8 xl:p-16">
        <div className="w-full max-w-2xl">
          {/* Logo & Branding */}
          <div className="mb-8 xl:mb-12 animate-fade-in">
            <div className="flex items-center gap-3 xl:gap-4 mb-4 xl:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 xl:p-3 rounded-2xl shadow-xl">
                  <GraduationCap className="w-8 h-8 xl:w-10 xl:h-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AlumniAccel
                </h1>
                <p className="text-xs xl:text-sm text-slate-600 font-medium">
                  {collegeInfo?.name || "Professional Alumni Network"}
                </p>
              </div>
            </div>

            <h2 className="text-2xl xl:text-4xl font-bold text-slate-800 mb-3 xl:mb-4 leading-tight">
              Connect. Grow. Succeed.
            </h2>
            <p className="text-base xl:text-lg text-slate-600 leading-relaxed">
              Join a thriving community of alumni dedicated to professional growth,
              mentorship, and lifelong connections.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-4 gap-3 xl:gap-4 mb-8 xl:mb-12 animate-fade-in animation-delay-200">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white/70 backdrop-blur-sm rounded-xl p-3 xl:p-4 text-center border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="text-xl xl:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 xl:gap-4 animate-fade-in animation-delay-400">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex items-center gap-6 animate-fade-in animation-delay-600">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Verified Alumni</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Zap className="w-5 h-5 text-purple-600" />
              <span>Fast & Reliable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-16 min-h-screen lg:min-h-0">
        
        {/* Mobile Branding - Visible only on small screens */}
        <div className="lg:hidden mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AlumniAccel
          </h1>
          <p className="text-sm text-slate-600 font-medium max-w-xs mx-auto">
            {collegeInfo?.name || "Professional Alumni Network"}
          </p>
        </div>

        <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl shadow-2xl border-0 rounded-3xl animate-fade-in-up overflow-hidden">
          {/* Card Header with Gradient */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white">
            <CardTitle className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-blue-100 text-sm sm:text-base">
              Sign in to access your alumni dashboard
            </CardDescription>
          </div>

          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 pl-12 pr-4 text-base border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 pl-12 pr-12 text-base border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                    className="border-2 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>

                <Dialog
                  open={forgotPasswordOpen}
                  onOpenChange={setForgotPasswordOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 p-0 h-auto"
                    >
                      Forgot password?
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in to Dashboard"
                )}
              </Button>
            </form>

            {/* Forgot Password Dialog */}
            <Dialog
              open={forgotPasswordOpen}
              onOpenChange={setForgotPasswordOpen}
            >
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Reset Password</DialogTitle>
                  <DialogDescription className="text-base">
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="forgot-email"
                      className="text-sm font-semibold"
                    >
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="pl-12 h-12 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setForgotPasswordOpen(false)}
                      className="rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                    >
                      {forgotPasswordLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Help Section */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">
                    Need Help?
                  </span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  New to the platform?
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Alumni accounts are created by your institution's administrators.
                  Please contact your alumni coordinator to get access credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
