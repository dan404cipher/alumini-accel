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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  const [copied, setCopied] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: "",
    subject: "",
    message: "",
  });

  if (!job) return null;

  // Generate job URL for dedicated job detail page
  const jobUrl = `${window.location.origin}/jobs/${job._id}`;

  // Generate shareable text
  const shareText = `Check out this job opportunity: ${job.position} at ${job.company} in ${job.location}. ${jobUrl}`;

  // Generate email content
  const emailSubject = `Job Opportunity: ${job.position} at ${job.company}`;
  const emailBody = `Hi,

I found this interesting job opportunity that might be relevant to you:

${job.position} at ${job.company}
📍 ${job.location} | ${job.type} | ${job.remote ? "Remote" : "On-site"}
💰 ${
    job.salary
      ? `${
          job.salary.currency === "USD" ? "$" : job.salary.currency
        } ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
      : "Salary not specified"
  }

${job.description.substring(0, 150)}${job.description.length > 150 ? "..." : ""}

${job.applicationUrl ? `🔗 Apply: ${job.applicationUrl}` : ""}
🔗 View details: ${jobUrl}

Best regards`;

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
          title: emailData.subject || emailSubject,
          text: emailData.message || emailBody,
          url: jobUrl,
        })
        .catch((error) => {
          console.log("Error sharing:", error);
          // Fallback to mailto
          const mailtoUrl = `mailto:${
            emailData.recipient
          }?subject=${encodeURIComponent(
            emailData.subject || emailSubject
          )}&body=${encodeURIComponent(emailData.message || emailBody)}`;
          window.open(mailtoUrl);
        });
    } else {
      // For desktop, use a cleaner approach
      const recipient = emailData.recipient || "";
      const subject = emailData.subject || emailSubject;
      const body = emailData.message || emailBody;

      // Create a shorter, more readable mailto URL
      const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl);
    }
  };

  // Copy email content
  const handleCopyEmail = async () => {
    const emailContent = `To: ${emailData.recipient || "recipient@example.com"}
Subject: ${emailData.subject || emailSubject}

${emailData.message || emailBody}`;

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
      <DialogContent className="sm:max-w-[600px]">
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

          {/* Email Sharing */}
          <div className="space-y-4">
            <h4 className="font-semibold">Email Share</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="recipient">Recipient Email</Label>
                <Input
                  id="recipient"
                  type="email"
                  value={emailData.recipient}
                  onChange={(e) =>
                    setEmailData({ ...emailData, recipient: e.target.value })
                  }
                  placeholder="friend@example.com"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) =>
                    setEmailData({ ...emailData, subject: e.target.value })
                  }
                  placeholder={emailSubject}
                />
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={emailData.message}
                  onChange={(e) =>
                    setEmailData({ ...emailData, message: e.target.value })
                  }
                  placeholder="Add a personal message..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleEmailShare}
                    className="flex-1"
                    disabled={!emailData.recipient}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" onClick={handleCopyEmail}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Button
                  onClick={handleQuickEmailShare}
                  variant="secondary"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Quick Email Share (No Form)
                </Button>
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
