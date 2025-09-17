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
import JobDetail from "../pages/JobDetail";
import EventDetail from "../pages/EventDetail";
import RoleBasedDashboard from "./RoleBasedDashboard";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();

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

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ overflowY: "auto" }}
    >
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Content */}
        <div className="animate-fade-in-up">{renderContent()}</div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
