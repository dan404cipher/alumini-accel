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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState } from "react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user has admin permissions
  const isAdmin =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.role === "coordinator";

  const navItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3, count: null },
    ...(isAdmin
      ? [{ id: "admin", name: "Admin Dashboard", icon: Settings, count: null }]
      : []),
    {
      id: "alumni",
      name: "Alumni",
      icon: Users,
      count: "2.8K",
    },

    { id: "jobs", name: "Jobs", icon: Briefcase, count: "47" },
    { id: "events", name: "Events", icon: Calendar, count: "8" },
    { id: "connections", name: "Connections", icon: UserPlus, count: null },
    { id: "news", name: "News Room", icon: Newspaper, count: null },
    { id: "recognition", name: "Recognition", icon: Award, count: null },
    { id: "about", name: "About Us", icon: Info, count: null },
    { id: "more", name: "More", icon: Menu, count: null },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-lg sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                AlumniAccel
              </h1>
            </div>
          </div>

          {/* Navigation Links - Aligned to the right */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              // Handle More dropdown separately
              if (item.id === "more") {
                return (
                  <DropdownMenu key={item.id}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`flex items-center px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? "text-blue-600 bg-blue-50 border border-blue-200 shadow-md"
                            : "text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md"
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <span className="tracking-wide">{item.name}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => navigate("/gallery")}>
                        <Image className="mr-2 h-4 w-4" />
                        <span>Gallery</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            "https://instagram.com/yourcollege",
                            "_blank"
                          )
                        }
                      >
                        <Instagram className="mr-2 h-4 w-4" />
                        <span>Instagram</span>
                        <ExternalLink className="ml-auto h-3 w-3" />
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            "https://facebook.com/yourcollege",
                            "_blank"
                          )
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
                );
              }

              // Regular navigation items
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    navigate(`/${item.id}`);
                  }}
                  className={`flex items-center px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-blue-600 bg-blue-50 border border-blue-200 shadow-md"
                      : "text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="tracking-wide">{item.name}</span>
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

            {/* Theme Toggle */}
            <div className="ml-6">
              <ThemeToggle />
            </div>

            {/* Login/Register Links */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center px-5 py-3 rounded-xl text-sm font-semibold text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {user?.role && (
                        <Badge variant="secondary" className="w-fit text-xs">
                          {user.role}
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
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="px-5 py-3 text-sm font-semibold text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md transition-all duration-200 tracking-wide rounded-xl"
                >
                  LOGIN
                </Button>
                <span className="text-gray-400 font-bold text-lg">::</span>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="px-5 py-3 text-sm font-semibold text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md transition-all duration-200 tracking-wide rounded-xl"
                >
                  REGISTER
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md transition-all duration-200 rounded-xl"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-6 py-6 space-y-3">
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
                      <div className="pl-6 space-y-1">
                        <button
                          onClick={() => {
                            navigate("/gallery");
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Gallery
                        </button>
                        <button
                          onClick={() => {
                            window.open(
                              "https://instagram.com/yourcollege",
                              "_blank"
                            );
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
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
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
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
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </button>
                        <button
                          onClick={() => {
                            navigate("/about");
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl w-full transition-all duration-200"
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
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold w-full transition-all duration-200 ${
                      isActive
                        ? "text-blue-600 bg-blue-50 shadow-md"
                        : "text-gray-800 hover:text-blue-600 hover:bg-gray-50 hover:shadow-md"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                    {item.count && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-xs px-2 py-0.5 bg-blue-100 text-blue-700"
                      >
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
