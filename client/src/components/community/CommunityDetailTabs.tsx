import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Info,
  Shield,
  Users,
  UserPlus,
  Crown,
  Flag,
} from "lucide-react";

interface CommunityDetailTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
  isModerator?: boolean;
  isAdmin?: boolean;
}

const CommunityDetailTabs: React.FC<CommunityDetailTabsProps> = ({
  activeTab,
  onTabChange,
  children,
  isModerator = false,
  isAdmin = false,
}) => {
  // Calculate grid columns based on user role
  const getGridCols = () => {
    if (isAdmin) return "grid-cols-5"; // Posts, About, Members, Join Requests, Reports
    if (isModerator) return "grid-cols-5"; // Posts, About, Members, Join Requests, Reports
    return "grid-cols-2"; // Posts, About
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex-1 flex flex-col"
    >
      <TabsList className={`grid w-full mb-4 sm:mb-6 ${getGridCols()}`}>
        <TabsTrigger
          value="posts"
          className="flex items-center gap-2 text-xs sm:text-sm"
        >
          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Posts</span>
        </TabsTrigger>
        <TabsTrigger
          value="about"
          className="flex items-center gap-2 text-xs sm:text-sm"
        >
          <Info className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">About</span>
        </TabsTrigger>

        {/* Admin-only tabs */}
        {isAdmin && (
          <>
            <TabsTrigger
              value="members"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger
              value="join-requests"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </>
        )}

        {/* Moderator-only tab (if not admin) */}
        {isModerator && !isAdmin && (
          <>
            <TabsTrigger
              value="members"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger
              value="join-requests"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Requests</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </>
        )}
      </TabsList>
      <div className="flex-1">{children}</div>
    </Tabs>
  );
};

export default CommunityDetailTabs;
