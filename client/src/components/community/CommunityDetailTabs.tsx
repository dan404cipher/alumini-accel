import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Info } from "lucide-react";

interface CommunityDetailTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const CommunityDetailTabs: React.FC<CommunityDetailTabsProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex-1 flex flex-col"
    >
      <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
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
      </TabsList>
      <div className="flex-1">{children}</div>
    </Tabs>
  );
};

export default CommunityDetailTabs;
