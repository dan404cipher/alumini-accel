import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const CookiePolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cookie Policy
          </h1>
          <p className="text-gray-600">Last updated: January 1, 2025</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How We Use Cookies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                1. What Are Cookies
              </h2>
              <p className="text-gray-700">
                Cookies are small text files that are placed on your computer or
                mobile device when you visit our website. They help us provide
                you with a better experience by remembering your preferences and
                enabling certain functionality.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                2. Types of Cookies We Use
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Essential Cookies
                  </h3>
                  <p className="text-gray-700 mb-2">
                    These cookies are necessary for the website to function
                    properly. They enable basic functions like page navigation,
                    access to secure areas, and authentication.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Session management</li>
                    <li>User authentication</li>
                    <li>Security features</li>
                    <li>Load balancing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Functional Cookies
                  </h3>
                  <p className="text-gray-700 mb-2">
                    These cookies enable enhanced functionality and
                    personalization, such as remembering your preferences and
                    settings.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Language preferences</li>
                    <li>Theme settings (dark/light mode)</li>
                    <li>User interface preferences</li>
                    <li>Form data retention</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Analytics Cookies
                  </h3>
                  <p className="text-gray-700 mb-2">
                    These cookies help us understand how visitors interact with
                    our website by collecting and reporting information
                    anonymously.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Page views and navigation patterns</li>
                    <li>Time spent on pages</li>
                    <li>Error tracking and performance monitoring</li>
                    <li>User journey analysis</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Marketing Cookies
                  </h3>
                  <p className="text-gray-700 mb-2">
                    These cookies are used to track visitors across websites to
                    display relevant and engaging advertisements.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Ad targeting and personalization</li>
                    <li>Campaign effectiveness measurement</li>
                    <li>Social media integration</li>
                    <li>Retargeting capabilities</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                3. How Long Cookies Last
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Session Cookies
                  </h3>
                  <p className="text-gray-700">
                    These are temporary cookies that expire when you close your
                    browser. They are used to maintain your session while
                    browsing our website.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Persistent Cookies
                  </h3>
                  <p className="text-gray-700">
                    These cookies remain on your device for a set period or
                    until you delete them. They help us recognize you when you
                    return to our website.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                4. Third-Party Cookies
              </h2>
              <p className="text-gray-700 mb-4">
                We may use third-party services that set their own cookies.
                These include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  <strong>Google Analytics:</strong> For website analytics and
                  performance monitoring
                </li>
                <li>
                  <strong>Social Media Platforms:</strong> For social sharing
                  and login features
                </li>
                <li>
                  <strong>Payment Processors:</strong> For secure payment
                  processing
                </li>
                <li>
                  <strong>Email Services:</strong> For newsletter and
                  communication features
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                5. Managing Your Cookie Preferences
              </h2>
              <p className="text-gray-700 mb-4">
                You can control and manage cookies in several ways:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Browser Settings
                  </h3>
                  <p className="text-gray-700">
                    Most web browsers allow you to control cookies through their
                    settings. You can choose to block all cookies, accept only
                    first-party cookies, or delete existing cookies.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Cookie Consent Banner
                  </h3>
                  <p className="text-gray-700">
                    When you first visit our website, you'll see a cookie
                    consent banner where you can choose which types of cookies
                    to accept.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Opt-Out Links</h3>
                  <p className="text-gray-700">
                    For specific third-party cookies, you can use the opt-out
                    links provided by those services.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                6. Impact of Disabling Cookies
              </h2>
              <p className="text-gray-700 mb-4">
                If you choose to disable cookies, some features of our website
                may not function properly:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You may need to log in repeatedly</li>
                <li>Your preferences may not be saved</li>
                <li>Some interactive features may not work</li>
                <li>Personalized content may not be available</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">
                7. Updates to This Policy
              </h2>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons. We will notify you of any material changes
                by posting the updated policy on this page.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about our use of cookies or this
                Cookie Policy, please contact us:
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

export default CookiePolicy;
