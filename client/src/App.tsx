import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Dashboard from "./components/Dashboard";
import AlumniDirectory from "./components/AlumniDirectory";
import JobBoard from "./components/JobBoard";

import EventsMeetups from "./components/EventsMeetups";
import Recognition from "./components/Recognition";
import Layout from "./components/Layout";
import NewsDetail from "./pages/NewsDetail";
import AdminDashboard from "./components/AdminDashboard";
import AlumniProfile from "./components/AlumniProfile";
import AboutUs from "./pages/AboutUs";
import Gallery from "./pages/Gallery";
import Connections from "./pages/Connections";
import Messages from "./pages/Messages";
import CommunityDetailNew from "./pages/CommunityDetailNew";
import MenteeRegistration from "./pages/MenteeRegistration";
import { ApprovalWorkflow } from "./components/mentorship-system/ApprovalWorkflow";
import { MatchingDashboard } from "./components/mentorship-system/MatchingDashboard";
import { MenteeMentorSelection } from "./components/mentorship-system/MenteeMentorSelection";
import { MentorMatchRequests } from "./components/mentorship-system/MentorMatchRequests";
import { ProgramMentorRegistration } from "./components/mentorship-system/ProgramMentorRegistration";
import { PublishedMentors } from "./pages/PublishedMentors";
import { MentoringPrograms } from "./pages/MentoringPrograms";
import SendInvitationsPage from "./pages/SendInvitations";
import { YourMentees } from "./pages/YourMentees";
import { RegisteredProgramDetail } from "./pages/RegisteredProgramDetail";

const queryClient = new QueryClient();

const App = () => {
  // Ensure body and html allow scrolling
  React.useEffect(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.height = "auto";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/connections" element={<Connections />} />
              <Route
                path="/connections/my-connections"
                element={<Connections />}
              />
              <Route path="/connections/pending" element={<Connections />} />
              <Route path="/connections/find" element={<Connections />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/inbox" element={<Messages />} />
              <Route path="/messages/sent" element={<Messages />} />
              <Route path="/messages/drafts" element={<Messages />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route
                path="/mentee-registration"
                element={<MenteeRegistration />}
              />
              <Route
                path="/mentor-registration"
                element={
                  <ProtectedRoute>
                    <ProgramMentorRegistration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/your-mentees"
                element={
                  <ProtectedRoute>
                    <YourMentees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/registered-program-detail"
                element={
                  <ProtectedRoute>
                    <RegisteredProgramDetail />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route path="/alumni/:id" element={<AlumniProfile />} />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alumni"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/news"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/news/:id"
                element={
                  <ProtectedRoute>
                    <NewsDetail />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/jobs/:id"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recognition"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/community/:id"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/donations"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/mentorship"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentoring-approvals"
                element={
                  <ProtectedRoute>
                    <ApprovalWorkflow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matching-dashboard"
                element={
                  <ProtectedRoute>
                    <MatchingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentee-mentor-selection"
                element={<MenteeMentorSelection />}
              />
              <Route
                path="/mentor-match-requests"
                element={
                  <ProtectedRoute>
                    <MentorMatchRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/published-mentors/:programId"
                element={<PublishedMentors />}
              />
              <Route
                path="/mentoring-programs"
                element={
                  <ProtectedRoute>
                    <MentoringPrograms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentoring-programs/:id"
                element={
                  <ProtectedRoute>
                    <MentoringPrograms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-invitations"
                element={
                  <ProtectedRoute>
                    <SendInvitationsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
