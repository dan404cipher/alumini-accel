import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Loader2, Mail, XCircle } from "lucide-react";
import { authAPI } from "@/lib/api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      setError("Invalid verification link. No token provided.");
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    verifyEmail(tokenParam);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyEmail(token);

      if (response.success) {
        setVerified(true);
        toast({
          title: "Email verified successfully",
          description: "Your email has been verified. You can now log in.",
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.message || "Email verification failed");
        toast({
          title: "Verification failed",
          description:
            response.message ||
            "Failed to verify email. The link may have expired.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to verify email. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    // This would require the user's email, so we'll need to handle this differently
    // For now, just redirect to login where they can request a new verification email
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              Verifying Email
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-green-600">
              Email Verified!
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Your email has been successfully verified. Redirecting to login...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-red-600">
              Verification Failed
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {error || "Failed to verify your email address."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Possible reasons:</strong>
              </p>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1 text-left">
                <li>• The verification link has expired</li>
                <li>• The link has already been used</li>
                <li>• The link is invalid or corrupted</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Go to Login
              </Button>
              <Button
                onClick={handleResendVerification}
                variant="outline"
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Request New Verification Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default VerifyEmail;
