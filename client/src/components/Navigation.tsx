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
  LogOut,
  UserCircle,
  Newspaper,
  Menu,
  Image,
  X,
  UserPlus,
  MessageCircle,
  Bell,
  Users2,
  GraduationCap,
  Heart,
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
  const [collegeLogo, setCollegeLogo] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Check if user has admin permissions
  const isAdmin = user ? canAccessAdmin(user.role) : false;
  const canManageUsersAccess = user ? canManageUsers(user.role) : false;
  const canManageContentAccess = user ? canManageContent(user.role) : false;

  // All navigation items in a single array
  const allNavItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, count: null },
    {
      id: "alumni",
      name: "Alumni Directory",
      icon: Users,
      count: "2.8K",
    },
    { id: "jobs", name: "Jobs", icon: Briefcase, count: "47" },
    { id: "events", name: "Events", icon: Calendar, count: "8" },
    { id: "news", name: "News Room", icon: Newspaper, count: null },
    { id: "recognition", name: "Recognition", icon: Award, count: null },
    { id: "gallery", name: "Gallery", icon: Image, count: null },
    { id: "messages", name: "Messages", icon: MessageCircle, count: null },
    { id: "connections", name: "Connections", icon: UserPlus, count: null },
    { id: "community", name: "Community", icon: Users2, count: null },
    { id: "mentorship", name: "Mentorship", icon: GraduationCap, count: null },
    { id: "donations", name: "Donations", icon: Heart, count: null },
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
        (user as { tenant?: { _id: string } })?.tenant?._id ||
        (user as { tenantId?: string })?.tenantId ||
        (user?.role === "college_admin" ? user._id : null);

      if (tenantId) {
        try {
          const logoResponse = await tenantAPI.getLogo(tenantId);

          // Check if response is a blob (image file) or JSON
          if (logoResponse instanceof Blob) {
            // Direct image blob response
            const logoUrl = URL.createObjectURL(logoResponse);
            setCollegeLogo(logoUrl);
          } else if (logoResponse.success && logoResponse.data) {
            // Legacy JSON response format
            const logoBlob = logoResponse.data as Blob;
            const logoUrl = URL.createObjectURL(logoBlob);
            setCollegeLogo(logoUrl);
          } else {
            // Fallback to localStorage
            try {
              const localLogo = localStorage.getItem(
                `college_logo_${tenantId}`
              );
              if (localLogo) {
                setCollegeLogo(localLogo);
              } else {
                setCollegeLogo(null);
              }
            } catch (localError) {
              setCollegeLogo(null);
            }
          }
        } catch (error) {
          // Fallback to localStorage
          try {
            const localLogo = localStorage.getItem(`college_logo_${tenantId}`);
            if (localLogo) {
              setCollegeLogo(localLogo);
            } else {
              setCollegeLogo(null);
            }
          } catch (localError) {
            setCollegeLogo(null);
          }
        }
      } else {
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
  }, [user]);

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
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
                  className="w-12 h-12 rounded-lg object-contain"
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

          {/* Desktop Navigation - Full Screen */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center overflow-x-auto scrollbar-none">
            <div className="flex items-center space-x-1 min-w-max">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      navigate(`/${item.id}`);
                    }}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
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
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2"
              onClick={() => {
                // TODO: Implement notifications functionality
                console.log("Notifications clicked");
              }}
            >
              <Bell className="w-5 h-5" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>

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
              {/* Mobile Notifications */}
              <button
                onClick={() => {
                  console.log("Mobile notifications clicked");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                <Bell className="w-4 h-4 mr-3" />
                <span className="flex-1 text-left">Notifications</span>
                <span className="w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>

              {allNavItems.map((item) => {
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
        )}
      </div>
    </nav>
  );
};

export default Navigation;
