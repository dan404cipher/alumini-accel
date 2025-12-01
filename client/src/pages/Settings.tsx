import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Shield,
  Eye,
  Globe,
  Mail,
  Lock,
  Save,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { settingsAPI } from "@/lib/api";

type PrivacySettings = {
  profileVisibility: "public" | "alumni" | "private";
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showCompany: boolean;
};

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Notification settings
    emailNotifications: true,
    jobAlerts: true,
    eventReminders: true,
    weeklyDigest: false,
    marketingEmails: false,

    // Privacy settings
    profileVisibility: "alumni", // public, alumni, private
    showEmail: true,
    showPhone: false,
    showLocation: true,
    showCompany: true,

    // Security settings
    twoFactorAuth: false,
    loginAlerts: true,

    // Preferences
    language: "en",
    timezone: "America/Los_Angeles",
  });
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSettingChange = (
    key: string,
    value: string | boolean | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const response = await settingsAPI.updatePrivacy({
        profileVisibility: settings.profileVisibility as
          | "public"
          | "alumni"
          | "private",
        showEmail: settings.showEmail,
        showPhone: settings.showPhone,
        showLocation: settings.showLocation,
        showCompany: settings.showCompany,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to save settings");
      }

      toast({
        title: "Settings Saved",
        description: "Your privacy settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Unable to save settings",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPrivacySettings = async () => {
      try {
        setPrivacyLoading(true);
        const response = await settingsAPI.getPrivacy();
        const privacyData = (
          response.data as { privacy: PrivacySettings } | undefined
        )?.privacy;
        if (isMounted && response.success && privacyData) {
          setSettings((prev) => ({
            ...prev,
            ...privacyData,
          }));
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: "Unable to load privacy settings",
            description:
              error instanceof Error
                ? error.message
                : "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setPrivacyLoading(false);
        }
      }
    };

    if (user) {
      fetchPrivacySettings();
    }

    return () => {
      isMounted = false;
    };
  }, [toast, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-16">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-muted-foreground mb-4">
              Please log in to access settings
            </h2>
            <Button onClick={() => (window.location.href = "/login")}>
              Go to Login
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      <Navigation activeTab="" onTabChange={() => {}} />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account preferences and privacy settings
              </p>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={privacyLoading || savingSettings}
            >
              <Save className="w-4 h-4 mr-2" />
              {savingSettings ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("emailNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Job Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about new job postings
                      </p>
                    </div>
                    <Switch
                      checked={settings.jobAlerts}
                      onCheckedChange={(checked) =>
                        handleSettingChange("jobAlerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Event Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Remind me about upcoming events
                      </p>
                    </div>
                    <Switch
                      checked={settings.eventReminders}
                      onCheckedChange={(checked) =>
                        handleSettingChange("eventReminders", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of activities
                      </p>
                    </div>
                    <Switch
                      checked={settings.weeklyDigest}
                      onCheckedChange={(checked) =>
                        handleSettingChange("weeklyDigest", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive promotional content and updates
                      </p>
                    </div>
                    <Switch
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) =>
                        handleSettingChange("marketingEmails", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy
                </CardTitle>
                <CardDescription>
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  
                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Email Address</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your email on your profile
                        </p>
                      </div>
                      <Switch
                        checked={settings.showEmail}
                        disabled={privacyLoading}
                        onCheckedChange={(checked) =>
                          handleSettingChange("showEmail", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Phone Number</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your phone number on your profile
                        </p>
                      </div>
                      <Switch
                        checked={settings.showPhone}
                        disabled={privacyLoading}
                        onCheckedChange={(checked) =>
                          handleSettingChange("showPhone", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Location</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your location on your profile
                        </p>
                      </div>
                      <Switch
                        checked={settings.showLocation}
                        disabled={privacyLoading}
                        onCheckedChange={(checked) =>
                          handleSettingChange("showLocation", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Company</Label>
                        <p className="text-sm text-muted-foreground">
                          Display your current company on your profile
                        </p>
                      </div>
                      <Switch
                        checked={settings.showCompany}
                        disabled={privacyLoading}
                        onCheckedChange={(checked) =>
                          handleSettingChange("showCompany", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prefer

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
