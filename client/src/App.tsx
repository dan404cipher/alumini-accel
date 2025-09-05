import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages & Components
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./components/Dashboard";
import AlumniDirectory from "./components/AlumniDirectory";
import JobBoard from "./components/JobBoard";
import EventsMeetups from "./components/EventsMeetups";
import Recognition from "./components/Recognition";
import Layout from "./components/Layout";
import Home from "./pages/Homepage";
import Newspage from "./components/News/Newspage";
import Directormsg from "./components/Directormsg";
import StoryPage from "./components/SuccessStory/story";
import StoryDetails from "./components/SuccessStory/Storydetails";
import Gallery from "./components/Gallery/Gallery";
import VideoGallery from "./components/Gallery/Video";
import Events from "./components/Events/Event";
import Reunion from "./components/Events/Reunion";
import ReunionDetails from "./components/Events/Reuniondetail";
import Webinar from "./components/Events/Webinar";
import WebinarDetails from "./components/Events/Webinardetail";
import NavbarHome from "./components/Navbar";
import Footer from "./pages/Footerpage";
import NotableDetailPage from "./components/Notablealumini/Notabledetail";
import HelpDesk from "./components/dialogs/HelpdeskAlumini/Helpdeskpage";
import ContactRegister from"./components/dialogs/HelpdeskAlumini/ContactRegister";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  // Hide Navbar only on /index and /login
  const hideNavbar = location.pathname === "/index" || location.pathname === "/login";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Conditional Navbar */}
      {!hideNavbar && <NavbarHome />}

      {/* Main content */}
      <main className={!hideNavbar ? "pt-10 flex-grow" : "flex-grow"}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/index" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/news" element={<Newspage />} />
          <Route path="/news/:id" element={<Newspage />} />
          <Route path="/directormsg" element={<Directormsg />} />
          <Route path="/successstory" element={<StoryPage />} />
          <Route path="/story/:id" element={<StoryDetails />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/video" element={<VideoGallery />} />
          <Route path="/events" element={<Events />} />
          <Route path="/reunion" element={<Reunion />} />
          <Route path="/reunion/:id" element={<ReunionDetails />} />
          <Route path="/webinar" element={<Webinar />} />
          <Route path="/webinar/:id" element={<WebinarDetails />} />
          <Route path="/notable" element={<NotableDetailPage />} />
          <Route path="/helpdesk" element={<HelpDesk/>}/>
          <Route path="/contact" element ={<ContactRegister/>}/>

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alumni"
            element={
              <ProtectedRoute>
                <Layout>
                  <AlumniDirectory />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Layout>
                  <JobBoard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/eventsmeetups"
            element={
              <ProtectedRoute>
                <Layout>
                  <EventsMeetups />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recognition"
            element={
              <ProtectedRoute>
                <Layout>
                  <Recognition />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer always visible */}
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
