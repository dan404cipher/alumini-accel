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
import { tenantAPI } from "@/lib/api";
import { useState, useEffect } from "react";
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
  const [collegeLogo, setCollegeLogo] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Check if user has admin permissions
  const isAdmin = user ? canAccessAdmin(user.role) : false;
  const canManageUsersAccess = user ? canManageUsers(user.role) : false;
  const canManageContentAccess = user ? canManageContent(user.role) : false;

  const navItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, count: null },
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

  // Load college logo from localStorage and listen for changes
  useEffect(() => {
    const loadCollegeLogo = async () => {
      // For college_admin, if tenantId is undefined, use the user's _id as tenantId
      const tenantId =
        user?.tenantId ||
        (user as any)?.tenant?._id ||
        (user as any)?.tenantId ||
        (user?.role === "college_admin" ? user._id : null);

      if (tenantId) {
        try {
          console.log(
            "Loading college logo from database for tenant:",
            tenantId
          );
          const logoResponse = await tenantAPI.getLogo(tenantId);

          if (logoResponse.success && logoResponse.data) {
            // Convert blob to data URL for display
            const logoBlob = logoResponse.data as Blob;
            const logoUrl = URL.createObjectURL(logoBlob);
            console.log("College logo loaded successfully from database");
            setCollegeLogo(logoUrl);
          } else {
            console.log("No logo found in database, checking localStorage");

            // Fallback to localStorage
            try {
              const localLogo = localStorage.getItem(
                `college_logo_${tenantId}`
              );
              console.log(
                "Checking localStorage for logo:",
                localLogo ? "Found" : "Not found"
              );
              if (localLogo) {
                console.log("Found logo in localStorage as fallback");
                setCollegeLogo(localLogo);
              } else {
                console.log("No logo found in localStorage either");
                setCollegeLogo(null);
              }
            } catch (localError) {
              console.log("Error loading from localStorage:", localError);
              setCollegeLogo(null);
            }
          }
        } catch (error) {
          console.log("Error loading logo from database:", error);

          // Fallback to localStorage
          try {
            const localLogo = localStorage.getItem(`college_logo_${tenantId}`);
            console.log(
              "Checking localStorage for logo:",
              localLogo ? "Found" : "Not found"
            );
            if (localLogo) {
              console.log("Found logo in localStorage as fallback");
              setCollegeLogo(localLogo);
            } else {
              console.log("No logo found in localStorage either");
              setCollegeLogo(null);
            }
          } catch (localError) {
            console.log("Error loading from localStorage:", localError);
            setCollegeLogo(null);
          }
        }
      } else {
        console.log("No tenantId, setting logo to null. User:", user);
        setCollegeLogo(null);
      }
    };

    // Load logo initially
    loadCollegeLogo();

    // Listen for storage changes (when logo is updated in another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `college_logo_${user?.tenantId}`) {
        loadCollegeLogo();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadCollegeLogo();
    };

    window.addEventListener("collegeLogoUpdated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "collegeLogoUpdated",
        handleCustomStorageChange
      );
    };
  }, [user?.tenantId]);

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center group cursor-pointer flex-shrink-0"
            onClick={() => navigate("/")}
          >
            <div className="flex items-center space-x-2">
              {collegeLogo ? (
                <img
                  src={collegeLogo}
                  alt="College Logo"
                  className="w-8 h-8 rounded-lg object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
              )}
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                AlumniAccel
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    navigate(`/${item.id}`);
                  }}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-blue-600 bg-blue-50 border border-blue-200"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span>{item.name}</span>
                  {item.count && (
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700"
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
                <button className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200">
                  <Newspaper className="w-4 h-4 mr-2" />
                  <span>Content</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
                      className={`flex items-center ${
                        isActive ? "bg-blue-50 text-blue-600" : ""
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                      {item.count && (
                        <Badge variant="secondary" className="ml-auto text-xs">
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
                <button className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span>Social</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
                      className={`flex items-center ${
                        isActive ? "bg-blue-50 text-blue-600" : ""
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                      {item.count && (
                        <Badge variant="secondary" className="ml-auto text-xs">
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
                <button className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200">
                  <Menu className="w-4 h-4 mr-2" />
                  <span>More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            {user ? (
              <DropdownMenu
                open={userDropdownOpen}
                onOpenChange={setUserDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </span>
                    </div>
                    <span className="hidden md:block text-sm font-medium">
                      {user.firstName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                          className={`w-fit text-xs ${getRoleColor(user.role)}`}
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
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="text-sm"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Register
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
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
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors ${
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.count && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </button>
                );
              })}

              {/* Content Section */}
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Content
                </div>
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
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors ${
                        isActive
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.count && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Social Section */}
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Social
                </div>
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
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors ${
                        isActive
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {item.count && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
