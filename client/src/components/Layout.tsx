import { useState } from "react";
import Navigation from "./Navigation";
import Dashboard from "./Dashboard";
import AlumniDirectory from "./AlumniDirectory";
import JobBoard from "./JobBoard";
import EventsMeetups from "./EventsMeetups";
import Recognition from "./Recognition";

const Layout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "alumni":
        return <AlumniDirectory />;
      case "jobs":
        return <JobBoard />;
      case "events":
        return <EventsMeetups />;
      case "recognition":
        return <Recognition />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content */}
        <div className="animate-fade-in-up">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Layout;