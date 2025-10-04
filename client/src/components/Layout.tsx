import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import Dashboard from "./Dashboard";
import AlumniDirectory from "./AlumniDirectory";
// Note: AlumniManagement and TenantManagement are now integrated into CollegeAdminDashboard
import JobBoard from "./JobBoard";
import EventsMeetups from "./EventsMeetups";
import NewsRoom from "./NewsRoom";
import Recognition from "./Recognition";
import CommunityNew from "./CommunityNew";
import Donations from "./Donations";
import Mentorship from "./mentorship";
import JobDetail from "../pages/JobDetail";
import EventDetail from "../pages/EventDetail";
import CommunityDetailNew from "../pages/CommunityDetailNew";
import RoleBasedDashboard from "./RoleBasedDashboard";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");

  // Update active tab based on current route
  useEffect(() => {
    const path = location.pathname.substring(1); // Remove leading slash
    if (path && path !== "dashboard") {
      // Handle nested routes like jobs/123 -> jobs
      const basePath = path.split("/")[0];
      setActiveTab(basePath);
    } else {
      setActiveTab("dashboard");
    }
  }, [location]);

  const renderContent = () => {
    // Handle job detail pages
    if (
      location.pathname.startsWith("/jobs/") &&
      location.pathname !== "/jobs"
    ) {
      return <JobDetail />;
    }

    // Handle event detail pages
    if (
      location.pathname.startsWith("/events/") &&
      location.pathname !== "/events"
    ) {
      return <EventDetail />;
    }

    // Handle community detail pages
    if (
      location.pathname.startsWith("/community/") &&
      location.pathname !== "/community"
    ) {
      console.log("Routing to CommunityDetailNew for:", location.pathname);
      return <CommunityDetailNew />;
    }

    switch (activeTab) {
      case "dashboard":
        return <RoleBasedDashboard />;
      // Note: "admin" and "users" tabs are now handled within the Dashboard tabs
      // case "admin": - Now part of College Admin Dashboard
      // case "users": - Now part of College Admin Dashboard
      case "alumni":
        return <AlumniDirectory />;
      case "jobs":
        return <JobBoard />;
      case "events":
        return <EventsMeetups />;
      case "news":
        return <NewsRoom />;
      case "recognition":
        return <Recognition />;
      case "community":
        return <CommunityNew />;
      case "donations":
        return <Donations />;
      case "mentorship":
        return <Mentorship />;
      case "about":
        // Redirect to the public About Us page
        navigate("/about");
        return null;
      case "gallery":
        // Redirect to the public Gallery page
        navigate("/gallery");
        return null;
      case "connections":
        // Redirect to the Connections page
        navigate("/connections");
        return null;
      case "more":
        // More dropdown doesn't navigate to a page
        return <RoleBasedDashboard />;
      default:
        return <RoleBasedDashboard />;
    }
  };

  // Check if we're rendering the Super Admin Dashboard
  const isSuperAdminDashboard =
    activeTab === "dashboard" && user?.role === "super_admin";

  const isJobBoard = activeTab === "jobs";
  const isEventsPage = activeTab === "events";
  const isNewsPage = activeTab === "news";
  const isGalleryPage = activeTab === "gallery";
  const isAlumniPage = activeTab === "alumni";
  const isCommunityPage = activeTab === "community";
  const isDonationsPage = activeTab === "donations";
  const isMentorshipPage = activeTab === "mentorship";

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ overflowY: "auto" }}
    >
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main
        className={`flex-1 w-full ${
          isSuperAdminDashboard ||
          isJobBoard ||
          isEventsPage ||
          isNewsPage ||
          isGalleryPage ||
          isAlumniPage ||
          isCommunityPage ||
          isDonationsPage ||
          isMentorshipPage
            ? ""
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }`}
      >
        {/* Content */}
        <div
          className={
            isSuperAdminDashboard ||
            isJobBoard ||
            isEventsPage ||
            isNewsPage ||
            isGalleryPage ||
            isAlumniPage ||
            isCommunityPage ||
            isDonationsPage ||
            isMentorshipPage
              ? ""
              : "animate-fade-in-up"
          }
        >
          {renderContent()}
        </div>
      </main>
      {!isSuperAdminDashboard &&
        !isJobBoard &&
        !isEventsPage &&
        !isNewsPage &&
        !isGalleryPage &&
        !isAlumniPage &&
        !isCommunityPage &&
        !isDonationsPage &&
        !isMentorshipPage && <Footer />}
    </div>
  );
};

export default Layout;
