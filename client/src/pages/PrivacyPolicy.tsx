import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeTab="" onTabChange={() => {}} />
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600">Last updated: January 1, 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Our Commitment to Your Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                1. Information We Collect
              </h2>
              <p className="text-gray-700 mb-4">
                We collect information you provide directly to us, such as when
                you create an account, update your profile, or contact us for
                support.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  Personal information (name, email address, phone number)
                </li>
                <li>
                  Professional information (job title, company, graduation year)
                </li>
                <li>Profile information and preferences</li>
                <li>Communication data when you contact us</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to provide, maintain, and
                improve our services:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>To provide and maintain our alumni network platform</li>
                <li>To send you important updates and notifications</li>
                <li>To facilitate connections between alumni</li>
                <li>To improve our services and develop new features</li>
                <li>
                  To respond to your inquiries and provide customer support
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                3. Information Sharing
              </h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal
                information to third parties without your consent, except in the
                following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  With other alumni members (as part of the network features)
                </li>
                <li>
                  With service providers who assist us in operating our platform
                </li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate security measures to protect your
                personal information against unauthorized access, alteration,
                disclosure, or destruction. However, no method of transmission
                over the internet is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of certain communications</li>
                <li>Request a copy of your data</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                6. Cookies and Tracking
              </h2>
              <p className="text-gray-700">
                We use cookies and similar technologies to enhance your
                experience on our platform. You can control cookie settings
                through your browser preferences.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                7. Changes to This Policy
              </h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last updated" date.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@alumniaccel.com
                  <br />
                  <strong>Address:</strong> 123 University Ave, Education City,
                  EC 12345
                  <br />
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
