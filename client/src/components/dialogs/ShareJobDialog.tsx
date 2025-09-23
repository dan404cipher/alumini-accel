import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Share2,
  Copy,
  Mail,
  Linkedin,
  Twitter,
  ExternalLink,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Job {
  _id: string;
  company: string;
  position: string;
  location: string;
  type: string;
  remote?: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits?: string[];
  tags?: string[];
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  applicants?: number;
  isReferral?: boolean;
  deadline?: string;
  applicationUrl?: string;
  companyWebsite?: string;
  contactEmail?: string;
}

interface ShareJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export const ShareJobDialog = ({
  open,
  onOpenChange,
  job,
}: ShareJobDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  // Generate job URL for dedicated job detail page
  const jobUrl = `${window.location.origin}/jobs/${job._id}`;

  // Generate shareable text
  const shareText = `Check out this job opportunity: ${job.position} at ${job.company} in ${job.location}. ${jobUrl}`;

  // Generate email content
  const emailSubject = `🚀 Job Opportunity: ${job.position} at ${job.company}`;

  const getRequirementsText = () => {
    if (!job.requirements || job.requirements.length === 0) return "";
    const reqs = job.requirements
      .slice(0, 3)
      .map((req) => `• ${req}`)
      .join("\n");
    const moreText =
      job.requirements.length > 3
        ? `• And ${job.requirements.length - 3} more...`
        : "";
    return `\n🎯 **Key Requirements:**\n${reqs}${
      moreText ? "\n" + moreText : ""
    }\n`;
  };

  const getBenefitsText = () => {
    if (!job.benefits || job.benefits.length === 0) return "";
    const benefits = job.benefits
      .slice(0, 3)
      .map((benefit) => `• ${benefit}`)
      .join("\n");
    const moreText =
      job.benefits.length > 3
        ? `• And ${job.benefits.length - 3} more benefits...`
        : "";
    return `\n✨ **Benefits:**\n${benefits}${
      moreText ? "\n" + moreText : ""
    }\n`;
  };

  const getDeadlineText = () => {
    return job.deadline
      ? `\n⏰ **Application Deadline:** ${new Date(
          job.deadline
        ).toLocaleDateString()}\n`
      : "";
  };

  const getApplicationText = () => {
    return job.applicationUrl
      ? `\n🔗 **Apply directly:** ${job.applicationUrl}`
      : "";
  };

  const emailBody = `Hi there! 👋

I came across an exciting job opportunity that I thought might interest you:

🏢 **${job.position}** at **${job.company}**
📍 **Location:** ${job.location} | ${job.type} | ${
    job.remote ? "🌍 Remote" : "🏢 On-site"
  }
💰 **Salary:** ${
    job.salary
      ? `${
          job.salary.currency === "USD" ? "$" : job.salary.currency
        } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
      : "Competitive salary"
  }

📝 **About the Role:**
${job.description.substring(0, 200)}${
    job.description.length > 200 ? "..." : ""
  }${getRequirementsText()}${getBenefitsText()}${getDeadlineText()}${getApplicationText()}
🔗 **View full details:** ${jobUrl}

Let me know if you'd like to discuss this opportunity further!

Best regards,
${user?.firstName || "Your colleague"}`;

  // Copy job link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl);
      setCopied(true);
      toast({
        title: "Link Copied",
        description: "Job link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Copy share text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({
        title: "Text Copied",
        description: "Share text has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  // Open LinkedIn sharing
  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      jobUrl
    )}`;
    window.open(linkedinUrl, "_blank", "width=600,height=400");
  };

  // Open Twitter sharing
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  // Send email
  const handleEmailShare = () => {
    // Try to use the Web Share API if available (mobile-friendly)
    if (navigator.share) {
      navigator
        .share({
          title: emailSubject,
          text: emailBody,
          url: jobUrl,
        })
        .catch((error) => {
          console.log("Error sharing:", error);
          // Fallback to mailto
          const mailtoUrl = `mailto:?subject=${encodeURIComponent(
            emailSubject
          )}&body=${encodeURIComponent(emailBody)}`;
          window.open(mailtoUrl);
        });
    } else {
      // For desktop, use a cleaner approach
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl);
    }
  };

  // Copy email content
  const handleCopyEmail = async () => {
    const emailContent = `Subject: ${emailSubject}

${emailBody}`;

    try {
      await navigator.clipboard.writeText(emailContent);
      toast({
        title: "Email Content Copied",
        description: "Email content has been copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy email content",
        variant: "destructive",
      });
    }
  };

  // Quick email share (no form required)
  const handleQuickEmailShare = () => {
    const subject = emailSubject;
    const body = emailBody;

    // Try to use the Web Share API if available (mobile-friendly)
    if (navigator.share) {
      navigator
        .share({
          title: subject,
          text: body,
          url: jobUrl,
        })
        .catch((error) => {
          console.log("Error sharing:", error);
          // Fallback to mailto
          const mailtoUrl = `mailto:?subject=${encodeURIComponent(
            subject
          )}&body=${encodeURIComponent(body)}`;
          window.open(mailtoUrl);
        });
    } else {
      // For desktop, use mailto
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Share Job Post
          </DialogTitle>
          <DialogDescription>
            Share this job opportunity with your network
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{job.position}</h3>
                <p className="text-sm text-gray-600">{job.company}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {job.location}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {job.type}
                  </Badge>
                  {job.remote && (
                    <Badge variant="secondary" className="text-xs">
                      Remote
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-2">
              {job.description.substring(0, 150)}...
            </p>
          </div>

          {/* Quick Share Options */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Share</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center justify-center"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Link
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyText}
                className="flex items-center justify-center"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Text
              </Button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-4">
            <h4 className="font-semibold">Social Media</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleLinkedInShare}
                className="flex items-center justify-center text-blue-600 hover:text-blue-700"
              >
                <Linkedin className="w-4 h-4 mr-2" />
                Share on LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={handleTwitterShare}
                className="flex items-center justify-center text-blue-400 hover:text-blue-500"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Share on Twitter
              </Button>
            </div>
          </div>

          {/* Email Sharing - Enhanced */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Email Share
              </h4>
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            </div>

            {/* Quick Email Share - Prominent */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-blue-900">Quick Email Share</h5>
                <Button
                  onClick={handleQuickEmailShare}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Now
                </Button>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                Send a pre-formatted email with job details instantly
              </p>
              <div className="text-xs text-blue-600 bg-white rounded p-2 border">
                <strong>Subject:</strong> {emailSubject}
              </div>
            </div>
          </div>

          {/* Direct Link */}
          <div className="space-y-4">
            <h4 className="font-semibold">Direct Link</h4>
            <div className="flex gap-2">
              <Input value={jobUrl} readOnly className="flex-1" />
              <Button variant="outline" onClick={handleCopyLink} size="sm">
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(jobUrl, "_blank")}
                size="sm"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
