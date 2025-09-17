import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Briefcase,
  Calendar,
  Award,
  BarChart3,
  Settings,
  Bell,
  User,
  LogOut,
  UserCircle,
  Newspaper,
  Info,
  Menu,
  Image,
  Instagram,
  Facebook,
  Linkedin,
  ExternalLink,
  X,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import {
  canAccessAdmin,
  canManageUsers,
  canManageContent,
  getRoleDisplayName,
  getRoleColor,
} from "@/utils/rolePermissions";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentDropdownOpen, setContentDropdownOpen] = useState(false);
  const [socialDropdownOpen, setSocialDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Check if user has admin permissions
  const isAdmin = user ? canAccessAdmin(user.role) : false;
  const canManageUsersAccess = user ? canManageUsers(user.role) : false;
  const canManageContentAccess = user ? canManageContent(user.role) : false;

  const navItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, count: null },
    // For Super Admin, everything is in the Dashboard tabs
    // For College Admin, everything is also in the Dashboard tabs (College Management, Admin & Staff, Alumni are all combined)
    {
      id: "alumni",
      name: "Alumni Directory",
      icon: Users,
      count: "2.8K",
    },
    { id: "jobs", name: "Jobs", icon: Briefcase, count: "47" },
  ];

  // Content dropdown items
  const contentItems = [
    { id: "events", name: "Events", icon: Calendar, count: "8" },
    { id: "news", name: "News Room", icon: Newspaper, count: null },
    { id: "recognition", name: "Recognition", icon: Award, count: null },
    { id: "gallery", name: "Gallery", icon: Image, count: null },
    ...(canManageContentAccess
      ? [
          {
            id: "content-management",
            name: "Content Management",
            icon: Settings,
            count: null,
          },
        ]
      : []),
  ];

  // Social dropdown items
  const socialItems = [
    { id: "feed", name: "Feed", icon: Newspaper, count: null },
    { id: "messages", name: "Messages", icon: MessageCircle, count: null },
    { id: "connections", name: "Connections", icon: UserPlus, count: null },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-xl sticky top-0 z-50 overflow-hidden">
      <div className="w-full max-w-8xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20 min-w-0">
          {/* Logo */}
          <div
            className="flex items-center group cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent tracking-tight group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-blue-900 transition-all duration-300">
                AlumniAccel
              </h1>
              <div className="h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </div>
          </div>

          {/* Navigation Links - Centered */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-1.5 lg:space-x-2 min-w-0 flex-shrink-0 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              // Regular navigation items
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    navigate(`/${item.id}`);
                  }}
                  className={`group flex items-center px-1.5 sm:px-2 md:px-2.5 lg:px-3 py-1.5 sm:py-2 md:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "text-blue-600 bg-blue-50/80 border border-blue-200/50 shadow-lg backdrop-blur-sm"
                      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-105 hover:border-blue-200/30"
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="tracking-wide hidden sm:inline">
                    {item.name}
                  </span>
                  {item.count && (
                    <Badge
                      variant="secondary"
                      className="ml-1 md:ml-2 text-xs px-1.5 md:px-2 py-0.5 bg-blue-100 text-blue-700"
                    >
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}

            {/* Content Dropdown */}
            <DropdownMenu
              open={contentDropdownOpen}
              onOpenChange={setContentDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center px-2 md:px-3 lg:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-105 transition-all duration-300"
                  onMouseEnter={() => setContentDropdownOpen(true)}
                  onMouseLeave={() => setContentDropdownOpen(false)}
                >
                  <Newspaper className="w-4 h-4 md:w-4 md:h-4 mr-1 md:mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="tracking-wide hidden lg:inline">
                    Content
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl"
                onMouseEnter={() => setContentDropdownOpen(true)}
                onMouseLeave={() => setContentDropdownOpen(false)}
              >
                {contentItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        navigate(`/${item.id}`);
                      }}
                      className={`flex items-center group hover:bg-blue-50/80 transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50/80 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                      {item.count && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700"
                        >
                          {item.count}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Social Dropdown */}
            <DropdownMenu
              open={socialDropdownOpen}
              onOpenChange={setSocialDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center px-2 md:px-3 lg:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-105 transition-all duration-300"
                  onMouseEnter={() => setSocialDropdownOpen(true)}
                  onMouseLeave={() => setSocialDropdownOpen(false)}
                >
                  <MessageCircle className="w-4 h-4 md:w-4 md:h-4 mr-1 md:mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="tracking-wide hidden lg:inline">Social</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl"
                onMouseEnter={() => setSocialDropdownOpen(true)}
                onMouseLeave={() => setSocialDropdownOpen(false)}
              >
                {socialItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        navigate(`/${item.id}`);
                      }}
                      className={`flex items-center group hover:bg-blue-50/80 transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50/80 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                      {item.count && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700"
                        >
                          {item.count}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Dropdown */}
            <DropdownMenu
              open={moreDropdownOpen}
              onOpenChange={setMoreDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center px-2 md:px-3 lg:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-105 transition-all duration-300"
                  onMouseEnter={() => setMoreDropdownOpen(true)}
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                >
                  <Menu className="w-4 h-4 md:w-4 md:h-4 mr-1 md:mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="tracking-wide hidden lg:inline">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                onMouseEnter={() => setMoreDropdownOpen(true)}
                onMouseLeave={() => setMoreDropdownOpen(false)}
              >
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://instagram.com/yourcollege", "_blank")
                  }
                >
                  <Instagram className="mr-2 h-4 w-4" />
                  <span>Instagram</span>
                  <ExternalLink className="ml-auto h-3 w-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open("https://facebook.com/yourcollege", "_blank")
                  }
                >
                  <Facebook className="mr-2 h-4 w-4" />
                  <span>Facebook</span>
                  <ExternalLink className="ml-auto h-3 w-3" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      "https://linkedin.com/company/yourcollege",
                      "_blank"
                    )
                  }
                >
                  <Linkedin className="mr-2 h-4 w-4" />
                  <span>LinkedIn</span>
                  <ExternalLink className="ml-auto h-3 w-3" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/about")}>
                  <Info className="mr-2 h-4 w-4" />
                  <span>About the College</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <div>
                <ThemeToggle />
              </div>

              {/* Login/Register Links */}
              {user ? (
                <DropdownMenu
                  open={userDropdownOpen}
                  onOpenChange={setUserDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="group flex items-center px-2 md:px-3 lg:px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-105 transition-all duration-300"
                      onMouseEnter={() => setUserDropdownOpen(true)}
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 md:w-4 md:h-4 group-hover:rotate-12 transition-transform duration-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56"
                    align="end"
                    onMouseEnter={() => setUserDropdownOpen(true)}
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        {user?.role && (
                          <Badge
                            className={`w-fit text-xs ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="group px-2 md:px-3 lg:px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-105 transition-all duration-300 tracking-wide rounded-xl"
                  >
                    <span className="hidden sm:inline group-hover:tracking-wider transition-all duration-300">
                      LOGIN
                    </span>
                    <span className="sm:hidden group-hover:tracking-wider transition-all duration-300">
                      LOG
                    </span>
                  </Button>
                  <span className="text-gray-400 font-bold text-xs md:text-sm">
                    ::
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="group px-2 md:px-3 lg:px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-105 transition-all duration-300 tracking-wide rounded-xl"
                  >
                    <span className="hidden sm:inline group-hover:tracking-wider transition-all duration-300">
                      REGISTER
                    </span>
                    <span className="sm:hidden group-hover:tracking-wider transition-all duration-300">
                      REG
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="group text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 hover:shadow-md hover:scale-110 transition-all duration-300 rounded-xl"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-md shadow-xl">
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-2 sm:space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                if (item.id === "more") {
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                        <Icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </div>
                      <div className="pl-4 sm:pl-6 space-y-1">
                        <button
                          onClick={() => {
                            window.open(
                              "https://instagram.com/yourcollege",
                              "_blank"
                            );
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
                        >
                          <Instagram className="w-4 h-4 mr-2" />
                          Instagram
                        </button>
                        <button
                          onClick={() => {
                            window.open(
                              "https://facebook.com/yourcollege",
                              "_blank"
                            );
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
                        >
                          <Facebook className="w-4 h-4 mr-2" />
                          Facebook
                        </button>
                        <button
                          onClick={() => {
                            window.open(
                              "https://linkedin.com/company/yourcollege",
                              "_blank"
                            );
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </button>
                        <button
                          onClick={() => {
                            navigate("/about");
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
                        >
                          <Info className="w-4 h-4 mr-2" />
                          About the College
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      navigate(`/${item.id}`);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-sm font-semibold w-full transition-all duration-200 ${
                      isActive
                        ? "text-blue-600 bg-blue-50 shadow-md"
                        : "text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 sm:mr-3" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.count && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-xs px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </button>
                );
              })}

              {/* Content Section */}
              <div className="space-y-1">
                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                  <Newspaper className="w-4 h-4 mr-2" />
                  Content
                </div>
                <div className="pl-4 sm:pl-6 space-y-1">
                  {contentItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          navigate(`/${item.id}`);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium w-full transition-all duration-200 rounded-xl ${
                          isActive
                            ? "text-blue-600 bg-blue-50 shadow-md"
                            : "text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2 sm:mr-3" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.count && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700"
                          >
                            {item.count}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Social Section */}
              <div className="space-y-1">
                <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Social
                </div>
                <div className="pl-4 sm:pl-6 space-y-1">
                  {socialItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          navigate(`/${item.id}`);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium w-full transition-all duration-200 rounded-xl ${
                          isActive
                            ? "text-blue-600 bg-blue-50 shadow-md"
                            : "text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2 sm:mr-3" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.count && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700"
                          >
                            {item.count}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
