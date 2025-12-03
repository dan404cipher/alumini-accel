import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Briefcase,
  Calendar,
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
  ChevronDown,
  BookOpen,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { tenantAPI, getImageUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import { useNotificationContext } from "@/contexts/NotificationContext";
import NotificationDropdown from "@/components/NotificationDropdown";
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

  // Get dynamic unread count and notification count
  const { unreadCount, notificationCount, isLoading } =
    useNotificationContext();

  // Check if user has admin permissions
  const isAdmin = user ? canAccessAdmin(user.role) : false;
  const canManageUsersAccess = user ? canManageUsers(user.role) : false;
  const canManageContentAccess = user ? canManageContent(user.role) : false;
  
  // Check if user is not Alumni (Alumni cannot see mentoring programs management)
  const canViewMentoringPrograms = user && user.role !== "alumni";

  // All navigation items in a single array
  const allNavItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, count: null },
    {
      id: "alumni",
      name: "Directory",
      icon: Users,
    },
    { id: "jobs", name: "Jobs", icon: Briefcase, count: null },
    { id: "events", name: "Events", icon: Calendar, count: null },
    {
      id: "media",
      name: "Media",
      icon: Newspaper,
      count: null,
      hasDropdown: true,
      dropdownItems: [
        { id: "news", name: "News Room", icon: Newspaper },
        { id: "gallery", name: "Gallery", icon: Image },
      ],
    },
    { id: "community", name: "Community", icon: Users2, count: null },
    { id: "donations", name: "Donations", icon: Heart, count: null },
    // Mentorship - visible to all roles including Alumni
    {
      id: "mentoring-programs",
      name: "Mentorship",
      icon: BookOpen,
      count: null,
    },
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

          // Handle URL string response (external URLs)
          if (typeof logoResponse === "string") {
            setCollegeLogo(logoResponse);
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
    <nav className="bg-white border-b border-gray-200 shadow-xl fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex items-center group cursor-pointer flex-shrink-0 hover:scale-105 transition-transform duration-200"
            onClick={() => navigate("/")}
          >
            <div className="flex items-center space-x-3">
              {user?.role === "super_admin" && activeTab === "dashboard" ? (
                <>
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-base md:text-lg xl:text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-all duration-200">
                      Super Admin
                    </h1>
                    <p className="text-xs text-gray-500 font-medium hidden lg:block">
                      System Management
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {collegeLogo ? (
                    <div className="relative">
                      <img
                        src={getImageUrl(collegeLogo)}
                        alt="College Logo"
                        className="w-12 h-12 rounded-xl object-contain shadow-md group-hover:shadow-lg transition-shadow duration-200"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:bg-gray-700">
                      <span className="text-white font-bold text-lg">A</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-base md:text-lg xl:text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-all duration-200">
                      AlumniAccel
                    </h1>
                    <p className="text-xs text-gray-500 font-medium hidden lg:block">
                      Alumni Network
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tablet Navigation - Medium screens */}
          <div className="hidden md:flex lg:hidden items-center space-x-1 flex-1 justify-center max-w-2xl mx-auto">
            <div className="flex items-center space-x-1 bg-gray-50/50 rounded-2xl p-1 backdrop-blur-sm">
              {/* Show only essential items on tablet */}
              {allNavItems
                .filter((item, index) =>
                  [
                    "dashboard",
                    "alumni",
                    "jobs",
                    "events",
                    "media",
                    "messages",
                    "connections",
                  ].includes(item.id)
                )
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  // Render dropdown items
                  if (item.hasDropdown && item.dropdownItems) {
                    return (
                      <DropdownMenu key={item.id}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`group flex items-center px-2 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 relative overflow-hidden ${
                              isActive
                                ? "text-white bg-blue-600 shadow-lg transform scale-105"
                                : "text-gray-700 hover:text-blue-600 hover:bg-white/80 hover:shadow-md hover:scale-105"
                            }`}
                          >
                            {/* Background animation for active state */}
                            {isActive && (
                              <div className="absolute inset-0 bg-blue-600 rounded-xl"></div>
                            )}

                            {/* Content */}
                            <div className="relative z-10 flex items-center">
                              <Icon
                                className={`w-4 h-4 mr-1 transition-transform duration-200 ${
                                  isActive
                                    ? "text-white"
                                    : "text-gray-600 group-hover:text-blue-600 group-hover:scale-110"
                                }`}
                              />
                              <span
                                className={`transition-colors duration-200 ${
                                  isActive
                                    ? "text-white font-semibold"
                                    : "group-hover:text-blue-600"
                                }`}
                              >
                                {item.name}
                              </span>
                              <ChevronDown
                                className={`w-3 h-3 ml-1 transition-transform duration-200 ${
                                  isActive
                                    ? "text-white"
                                    : "text-gray-600 group-hover:text-blue-600"
                                }`}
                              />
                            </div>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48">
                          <DropdownMenuLabel>{item.name}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {item.dropdownItems.map((dropdownItem) => {
                            const DropdownIcon = dropdownItem.icon;
                            return (
                              <DropdownMenuItem
                                key={dropdownItem.id}
                                onClick={() => {
                                  onTabChange(dropdownItem.id);
                                  navigate(`/${dropdownItem.id}`);
                                }}
                                className="cursor-pointer"
                              >
                                <DropdownIcon className="w-4 h-4 mr-2" />
                                {dropdownItem.name}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  // Render regular items
                  return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          if (item.id === "mentoring-approvals") {
                            navigate("/mentoring-approvals");
                          } else if (item.id === "mentoring-programs") {
                            navigate("/mentoring-programs");
                          } else {
                            navigate(`/${item.id}`);
                          }
                        }}
                        className={`group flex items-center px-2 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 relative overflow-hidden ${
                          isActive
                            ? "text-white bg-blue-600 shadow-lg transform scale-105"
                            : "text-gray-700 hover:text-blue-600 hover:bg-white/80 hover:shadow-md hover:scale-105"
                        }`}
                      >
                      {/* Background animation for active state */}
                      {isActive && (
                        <div className="absolute inset-0 bg-blue-600 rounded-xl"></div>
                      )}

                      {/* Content */}
                      <div className="relative z-10 flex items-center">
                        <Icon
                          className={`w-4 h-4 mr-1 transition-transform duration-200 ${
                            isActive
                              ? "text-white"
                              : "text-gray-600 group-hover:text-blue-600 group-hover:scale-110"
                          }`}
                        />
                        <span
                          className={`transition-colors duration-200 ${
                            isActive
                              ? "text-white font-semibold"
                              : "group-hover:text-blue-600"
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Desktop Navigation - Large screens */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-4xl mx-auto">
            <div className="flex items-center space-x-1 bg-gray-50/50 rounded-2xl p-1 backdrop-blur-sm">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                // Render dropdown items
                if (item.hasDropdown && item.dropdownItems) {
                  return (
                    <DropdownMenu key={item.id}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`group flex items-center px-2 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 relative overflow-hidden ${
                            isActive
                              ? "text-white bg-blue-600 shadow-lg transform scale-105"
                              : "text-gray-700 hover:text-blue-600 hover:bg-white/80 hover:shadow-md hover:scale-105"
                          }`}
                        >
                          {/* Background animation for active state */}
                          {isActive && (
                            <div className="absolute inset-0 bg-blue-600 rounded-xl"></div>
                          )}

                          {/* Content */}
                          <div className="relative z-10 flex items-center">
                            <Icon
                              className={`w-4 h-4 mr-2 transition-transform duration-200 ${
                                isActive
                                  ? "text-white"
                                  : "text-gray-600 group-hover:text-blue-600 group-hover:scale-110"
                              }`}
                            />
                            <span
                              className={`transition-colors duration-200 ${
                                isActive
                                  ? "text-white font-semibold"
                                  : "group-hover:text-blue-600"
                              }`}
                            >
                              {item.name}
                            </span>
                            <ChevronDown
                              className={`w-3 h-3 ml-1 transition-transform duration-200 ${
                                isActive
                                  ? "text-white"
                                  : "text-gray-600 group-hover:text-blue-600"
                              }`}
                            />
                            {item.count && (
                              <Badge
                                variant="secondary"
                                className={`ml-2 text-xs px-2 py-0.5 transition-all duration-200 ${
                                  isActive
                                    ? "bg-white/20 text-white border-white/30"
                                    : "bg-blue-100 text-blue-700 group-hover:bg-blue-200 group-hover:scale-105"
                                }`}
                              >
                                {item.count}
                              </Badge>
                            )}
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-48">
                        <DropdownMenuLabel>{item.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {item.dropdownItems.map((dropdownItem) => {
                          const DropdownIcon = dropdownItem.icon;
                          return (
                            <DropdownMenuItem
                              key={dropdownItem.id}
                              onClick={() => {
                                onTabChange(dropdownItem.id);
                                navigate(`/${dropdownItem.id}`);
                              }}
                              className="cursor-pointer"
                            >
                              <DropdownIcon className="w-4 h-4 mr-2" />
                              {dropdownItem.name}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                // Render regular items
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      if (item.id === "mentoring-approvals") {
                        navigate("/mentoring-approvals");
                      } else {
                        navigate(`/${item.id}`);
                      }
                    }}
                    className={`group flex items-center px-2 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 relative overflow-hidden ${
                      isActive
                        ? "text-white bg-blue-600 shadow-lg transform scale-105"
                        : "text-gray-700 hover:text-blue-600 hover:bg-white/80 hover:shadow-md hover:scale-105"
                    }`}
                  >
                    {/* Background animation for active state */}
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-600 rounded-xl"></div>
                    )}

                    {/* Content */}
                    <div className="relative z-10 flex items-center">
                      <Icon
                        className={`w-4 h-4 mr-2 transition-transform duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-gray-600 group-hover:text-blue-600 group-hover:scale-110"
                        }`}
                      />
                      <span
                        className={`transition-colors duration-200 ${
                          isActive
                            ? "text-white font-semibold"
                            : "group-hover:text-blue-600"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.count && (
                        <Badge
                          variant="secondary"
                          className={`ml-2 text-xs px-2 py-0.5 transition-all duration-200 ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : "bg-blue-100 text-blue-700 group-hover:bg-blue-200 group-hover:scale-105"
                          }`}
                        >
                          {item.count}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Messages */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2.5 hover:bg-green-50 hover:text-green-600 transition-all duration-200 hover:scale-105 group"
              onClick={() => {
                navigate("/messages");
              }}
            >
              <MessageCircle className="w-5 h-5 group-hover:animate-pulse" />
              {/* Message badge - only show if there are unread messages */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              {/* Loading indicator */}
              {isLoading && unreadCount === 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg">
                  ...
                </span>
              )}
            </Button>

            {/* Notifications */}
            <NotificationDropdown />

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
                    className="flex items-center space-x-3 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-105 group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200 overflow-hidden">
                      {user.profilePicture ? (
                        <img
                          src={
                            user.profilePicture.startsWith("http")
                              ? user.profilePicture
                              : `${(
                                  import.meta.env.VITE_API_BASE_URL ||
                                  "http://localhost:3000/api/v1"
                                ).replace("/api/v1", "")}${user.profilePicture}`
                          }
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-blue-600 flex items-center justify-center ${
                          user.profilePicture ? "hidden" : ""
                        }`}
                      >
                        <span className="text-white font-semibold text-sm">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="hidden lg:block text-left">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                        {user.firstName} {user.lastName}
                      </span>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName(user.role)}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl"
                >
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md overflow-hidden">
                          {user.profilePicture ? (
                            <img
                              src={
                                user.profilePicture.startsWith("http")
                                  ? user.profilePicture
                                  : `${(
                                      import.meta.env.VITE_API_BASE_URL ||
                                      "http://localhost:3000/api/v1"
                                    ).replace("/api/v1", "")}${
                                      user.profilePicture
                                    }`
                              }
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove(
                                  "hidden"
                                );
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-blue-600 flex items-center justify-center ${
                              user.profilePicture ? "hidden" : ""
                            }`}
                          >
                            <span className="text-white font-semibold text-lg">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold leading-none text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs leading-none text-gray-500 mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      {user?.role && (
                        <Badge
                          className={`w-fit text-xs ${getRoleColor(
                            user.role
                          )} shadow-sm`}
                        >
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200/50" />
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                  >
                    <UserCircle className="mr-3 h-4 w-4" />
                    <span className="font-medium">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    <span className="font-medium">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200/50" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200 cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  className="text-sm hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-105"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  Register
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-105"
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
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl shadow-lg">
            <div className="px-4 py-6 space-y-3">
              {/* Mobile Messages */}
              <button
                onClick={() => {
                  navigate("/messages");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200 text-gray-700 hover:text-green-600 hover:bg-green-50 hover:scale-105 group"
              >
                <MessageCircle className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                <span className="flex-1 text-left font-medium">Messages</span>
                <span className="w-5 h-5 bg-green-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-md">
                  2
                </span>
              </button>

              {/* Mobile Notifications */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:scale-105 group"
              >
                <Bell className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                <span className="flex-1 text-left font-medium">
                  Notifications
                </span>
                <span className="w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-md">
                  3
                </span>
              </button>

              <div className="space-y-2">
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  // Render dropdown items for mobile
                  if (item.hasDropdown && item.dropdownItems) {
                    return (
                      <div key={item.id} className="space-y-1">
                        <button
                          onClick={() => {
                            onTabChange(item.id);
                            if (item.id === "mentoring-approvals") {
                              navigate("/mentoring-approvals");
                            } else {
                              navigate(`/${item.id}`);
                            }
                            setMobileMenuOpen(false);
                          }}
                          className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200 ${
                            isActive
                              ? "text-white bg-blue-600 shadow-lg"
                              : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:scale-105"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                              isActive
                                ? "text-white"
                                : "text-gray-600 group-hover:text-blue-600 group-hover:scale-110"
                            }`}
                          />
                          <span className="flex-1 text-left font-medium">
                            {item.name}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isActive
                                ? "text-white"
                                : "text-gray-600 group-hover:text-blue-600"
                            }`}
                          />
                        </button>

                        {/* Dropdown items */}
                        <div className="ml-6 space-y-1">
                          {item.dropdownItems.map((dropdownItem) => {
                            const DropdownIcon = dropdownItem.icon;
                            return (
                              <button
                                key={dropdownItem.id}
                                onClick={() => {
                                  onTabChange(dropdownItem.id);
                                  navigate(`/${dropdownItem.id}`);
                                  setMobileMenuOpen(false);
                                }}
                                className="group flex items-center px-4 py-2 rounded-lg text-sm font-medium w-full transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <DropdownIcon className="w-4 h-4 mr-3 text-gray-500 group-hover:text-blue-600" />
                                <span className="flex-1 text-left">
                                  {dropdownItem.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Render regular items
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        navigate(`/${item.id}`);
                        setMobileMenuOpen(false);
                      }}
                      className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium w-full transition-all duration-200 ${
                        isActive
                          ? "text-white bg-blue-600 shadow-lg"
                          : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:scale-105"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mr-3 transition-transform duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-gray-600 group-hover:text-blue-600 group-hover:scale-110"
                        }`}
                      />
                      <span className="flex-1 text-left font-medium">
                        {item.name}
                      </span>
                      {item.count && (
                        <Badge
                          variant="secondary"
                          className={`ml-auto text-xs ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
                          }`}
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
        )}
      </div>
    </nav>
  );
};

export default Navigation;
