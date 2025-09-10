import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const TermsOfService = () => {
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
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: January 1, 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-700">
                By accessing and using AlumniAccel ("the Service"), you accept
                and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                2. Description of Service
              </h2>
              <p className="text-gray-700 mb-4">
                AlumniAccel is a platform that connects alumni from educational
                institutions, providing networking opportunities, job postings,
                event management, and news sharing. The service includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Alumni directory and networking features</li>
                <li>Job board and career opportunities</li>
                <li>Event management and meetup coordination</li>
                <li>News sharing and community updates</li>
                <li>Recognition and achievement tracking</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-4">
                To access certain features of the Service, you must register for
                an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious code</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Spam or send unsolicited communications</li>
                <li>Impersonate another person or entity</li>
                <li>Collect user information without permission</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                5. Content and Intellectual Property
              </h2>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you post, but grant us a license
                to use, display, and distribute such content in connection with
                the Service. You are responsible for ensuring you have the right
                to post any content.
              </p>
              <p className="text-gray-700">
                The Service and its original content, features, and
                functionality are owned by AlumniAccel and are protected by
                international copyright, trademark, and other intellectual
                property laws.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">6. Privacy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy
                Policy, which also governs your use of the Service, to
                understand our practices.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
              <p className="text-gray-700">
                We may terminate or suspend your account and access to the
                Service immediately, without prior notice, for any reason,
                including breach of these Terms. Upon termination, your right to
                use the Service will cease immediately.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimers</h2>
              <p className="text-gray-700">
                The Service is provided "as is" and "as available" without
                warranties of any kind. We do not guarantee that the Service
                will be uninterrupted, secure, or error-free. We are not
                responsible for the content, accuracy, or opinions expressed by
                users.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-gray-700">
                In no event shall AlumniAccel be liable for any indirect,
                incidental, special, consequential, or punitive damages,
                including without limitation, loss of profits, data, use,
                goodwill, or other intangible losses, resulting from your use of
                the Service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance
                with the laws of the jurisdiction in which AlumniAccel operates,
                without regard to conflict of law provisions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                11. Changes to Terms
              </h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will
                notify users of any material changes by posting the new Terms on
                this page and updating the "Last updated" date.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                12. Contact Information
              </h2>
              <p className="text-gray-700">
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@alumniaccel.com
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

export default TermsOfService;
