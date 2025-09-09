import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ChevronDown, Menu } from "lucide-react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string>(""); // "" = none, "news", "more"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown("");
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Stop click inside dropdown from closing
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Toggle dropdowns
  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? "" : menu);
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <h1
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          Alumni Accel
        </h1>

        {/* Hamburger icon for mobile */}
        <div
          className="sm:hidden cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={28} />
        </div>

        {/* Desktop menu */}
        <ul className="hidden sm:flex space-x-10 text-gray-700 font-medium items-center">
          <li
            onClick={() => navigate("/directormsg")}
            className="cursor-pointer hover:text-blue-600"
          >
            About Us
          </li>
          <li
            onClick={() => navigate("/events")}
            className="cursor-pointer hover:text-blue-600"
          >
            Events
          </li>
          <li
            onClick={() => navigate("/gallery")}
            className="cursor-pointer hover:text-blue-600"
          >
            Gallery
          </li>

          {/* Dropdown: Newsroom */}
          <li className="relative" onClick={stopPropagation}>
            <div
              className="cursor-pointer flex items-center gap-1 hover:text-blue-600 select-none"
              onClick={() => toggleDropdown("news")}
            >
              Newsroom & Reflections <ChevronDown size={16} />
            </div>
            {openDropdown === "news" && (
              <ul className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                <li
                  onClick={() => {
                    navigate("/news");
                    setOpenDropdown("");
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  News
                </li>
                <li
                  onClick={() => {
                    navigate("/successstory");
                    setOpenDropdown("");
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  Success Story
                </li>
              </ul>
            )}
          </li>

          <li
            onClick={() => navigate("/funds")}
            className="cursor-pointer hover:text-blue-600"
          >
            Fund Raising
          </li>

          {/* Dropdown: More */}
          <li className="relative" onClick={stopPropagation}>
            <div
              className="cursor-pointer flex items-center gap-1 hover:text-blue-600 select-none"
              onClick={() => toggleDropdown("more")}
            >
              More <ChevronDown size={16} />
            </div>
            {openDropdown === "more" && (
              <ul className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                <li>
                  <a
                    href="https://www.linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 hover:bg-gray-100 block"
                  >
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 hover:bg-gray-100 block"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 hover:bg-gray-100 block"
                  >
                    Facebook
                  </a>
                </li>
              </ul>
            )}
          </li>
        </ul>

        {/* Login button desktop */}
        <div
          className="hidden sm:flex items-center space-x-2 cursor-pointer px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 select-none"
          onClick={() => navigate("/login")}
        >
          <LogIn size={20} />
          <span>Login</span>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 px-6 py-4">
          <ul className="flex flex-col space-y-4 font-medium text-gray-700">
            <li
              onClick={() => {
                navigate("/directormsg");
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer hover:text-blue-600"
            >
              About Us
            </li>
            <li
              onClick={() => {
                navigate("/events");
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer hover:text-blue-600"
            >
              Events
            </li>
            <li
              onClick={() => {
                navigate("/gallery");
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer hover:text-blue-600"
            >
              Gallery
            </li>

            {/* Mobile dropdown Newsroom */}
            <li>
              <div
                onClick={() =>
                  setOpenDropdown(openDropdown === "news" ? "" : "news")
                }
                className="flex items-center justify-between cursor-pointer hover:text-blue-600 select-none"
              >
                Newsroom & Reflections
                <ChevronDown
                  size={16}
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "news" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openDropdown === "news" && (
                <ul className="mt-2 pl-4 border-l border-gray-300 flex flex-col space-y-2">
                  <li
                    onClick={() => {
                      navigate("/news");
                      setMobileMenuOpen(false);
                      setOpenDropdown("");
                    }}
                    className="cursor-pointer hover:text-blue-600"
                  >
                    News
                  </li>
                  <li
                    onClick={() => {
                      navigate("/successstory");
                      setMobileMenuOpen(false);
                      setOpenDropdown("");
                    }}
                    className="cursor-pointer hover:text-blue-600"
                  >
                    Success Story
                  </li>
                </ul>
              )}
            </li>

            <li
              onClick={() => {
                navigate("/funds");
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer hover:text-blue-600"
            >
              Fund Raising
            </li>

            {/* Mobile dropdown More */}
            <li>
              <div
                onClick={() =>
                  setOpenDropdown(openDropdown === "more" ? "" : "more")
                }
                className="flex items-center justify-between cursor-pointer hover:text-blue-600 select-none"
              >
                More
                <ChevronDown
                  size={16}
                  className={`transform transition-transform duration-300 ${
                    openDropdown === "more" ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openDropdown === "more" && (
                <ul className="mt-2 pl-4 border-l border-gray-300 flex flex-col space-y-2">
                  <li>
                    <a
                      href="https://www.linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      Facebook
                    </a>
                  </li>
                </ul>
              )}
            </li>

            {/* Login button mobile */}
            <li
              onClick={() => {
                navigate("/login");
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center space-x-2 select-none"
            >
              <LogIn size={20} />
              <span>Login</span>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
