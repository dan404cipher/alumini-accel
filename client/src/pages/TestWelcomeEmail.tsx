import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const TestWelcomeEmail = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "meganathan1206@gmail.com",
    firstName: "Meganathan",
    lastName: "Test",
    collegeName: "Singapore Institute of Technology",
    password: "Welcome123!",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendTestEmail = async () => {
    setLoading(true);
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const baseUrl = apiBaseUrl.replace("/api/v1", "");
      const response = await fetch(`${baseUrl}/test-send-welcome-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success!",
          description: `Welcome email sent successfully to ${formData.email}. Please check your inbox.`,
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Failed to send email");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to send test email. Make sure the server is running and SMTP is configured.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewEmail = () => {
    const params = new URLSearchParams({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      collegeName: formData.collegeName,
      password: formData.password,
    });
    window.open(
      `${
        import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") ||
        "http://localhost:3000"
      }/preview-welcome-email?${params.toString()}`,
      "_blank"
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Welcome Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="alumni@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collegeName">College Name</Label>
            <Input
              id="collegeName"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleInputChange}
              placeholder="Your College Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Temporary password"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSendTestEmail}
              disabled={loading || !formData.email}
              className="flex-1"
            >
              {loading ? "Sending..." : "Send Test Email"}
            </Button>
            <Button
              onClick={handlePreviewEmail}
              variant="outline"
              className="flex-1"
            >
              Preview Email Template
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Make sure your backend server is running
              and SMTP configuration is set up in your .env file for the email
              to be sent successfully.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestWelcomeEmail;
