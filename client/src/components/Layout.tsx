import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import Dashboard from "./Dashboard";
import AlumniDirectory from "./AlumniDirectory";
import AlumniManagement from "./AlumniManagement";
import JobBoard from "./JobBoard";
import EventsMeetups from "./EventsMeetups";
import NewsRoom from "./NewsRoom";
import Recognition from "./Recognition";
import JobDetail from "../pages/JobDetail";
import EventDetail from "../pages/EventDetail";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const location = useLocation();

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
        return <Dashboard />;
      case "alumni":
        return <AlumniDirectory />;
      case "users":
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
      case "more":
        // More dropdown doesn't navigate to a page
        return <Dashboard />;
      default:
        return <Dashboard />;
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
