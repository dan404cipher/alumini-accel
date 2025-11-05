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
import CommunityNew from "./CommunityNew";
import Donations from "./Donations";
import Mentorship from "./mentorship";
import JobDetail from "../pages/JobDetail";
import EventDetail from "../pages/EventDetail";
import CommunityDetailNew from "../pages/CommunityDetailNew";
import Messages from "../pages/Messages";
import Gallery from "../pages/Gallery";
import Connections from "../pages/Connections";
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

  // Handle navigation redirects
  useEffect(() => {
    if (activeTab === "media") {
      navigate("/news");
    } else if (activeTab === "about") {
      navigate("/about");
    }
  }, [activeTab, navigate]);

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
      case "media":
        // Redirect to news by default, or could create a media landing page
        return null;
      case "news":
        return <NewsRoom />;
      case "community":
        return <CommunityNew />;
      case "donations":
        return <Donations />;
      case "mentorship":
        return <Mentorship />;
      case "messages":
        return <Messages />;
      case "connections":
        return <Connections />;
      case "about":
        // Redirect to the public About Us page
        return null;
      case "gallery":
        return <Gallery />;
      case "more":
        // More dropdown doesn't navigate to a page
        return <RoleBasedDashboard />;
      default:
        return <RoleBasedDashboard />;
    }
  };

  // Check if we're rendering full-screen pages
  const isSuperAdminDashboard =
    activeTab === "dashboard" && user?.role === "super_admin";

  const isJobBoard = activeTab === "jobs";
  const isEventsPage = activeTab === "events";
  const isNewsPage = activeTab === "news";
  const isGalleryPage = activeTab === "gallery";
  const isMediaPage = activeTab === "media";
  const isAlumniPage = activeTab === "alumni";
  const isCommunityPage = activeTab === "community";
  const isDonationsPage = activeTab === "donations";
  const isMentorshipPage = activeTab === "mentorship";
  const isMessagesPage = activeTab === "messages";
  const isConnectionsPage = activeTab === "connections";

  // All dashboards should be full-screen
  const isDashboardPage = activeTab === "dashboard";

  // Pages that should hide the footer (full-screen pages)
  const shouldHideFooter =
    isDashboardPage ||
    isJobBoard ||
    isEventsPage ||
    isNewsPage ||
    isGalleryPage ||
    isMediaPage ||
    isAlumniPage ||
    isCommunityPage ||
    isDonationsPage ||
    isMentorshipPage ||
    isMessagesPage ||
    isConnectionsPage;

  return (
    <div
      className={`min-h-screen bg-background flex flex-col ${
        isMessagesPage ? "h-screen overflow-hidden" : ""
      }`}
      style={isMessagesPage ? {} : { overflowY: "auto" }}
    >
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main
        className={`flex-1 w-full pt-16 ${isMessagesPage ? "h-full" : ""} ${
          shouldHideFooter
            ? ""
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }`}
      >
        {/* Content */}
        <div
          className={
            shouldHideFooter
              ? isMessagesPage
                ? "h-full flex flex-col"
                : ""
              : "animate-fade-in-up"
          }
        >
          {renderContent()}
        </div>
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default Layout;
