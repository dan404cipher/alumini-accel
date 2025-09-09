// import React, { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { LogIn, ChevronDown } from "lucide-react";

// const Navbar: React.FC = () => {
//   const navigate = useNavigate();
//   const [open, setOpen] = useState(false);
//   const dropdownRef = useRef<HTMLLIElement>(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   return (
//     <nav className="flex items-center justify-between py-4 px-6 bg-white shadow-md fixed top-0 left-0 right-0 z-50">
//       {/* Left: Logo */}
//       <h1
//         className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer pl-20"
//         onClick={() => navigate("/")}
//       >
//         Alumni Accel
//       </h1>

//       {/* Center: Nav Links */}
//       <ul className="absolute left-1/2 transform -translate-x-1/2 flex space-x-10 text-gray-700 font-medium items-center">
//         <li onClick={() => navigate("/directormsg")} className="cursor-pointer hover:text-blue-600">About Us</li>
//         <li onClick={() => navigate("/events")} className="cursor-pointer hover:text-blue-600">Events</li>
//         <li onClick={() => navigate("/gallery")} className="cursor-pointer hover:text-blue-600">Gallery</li>
        
//         {/* Dropdown */}
//         <li ref={dropdownRef} className="relative">
//           <div
//             className="cursor-pointer flex items-center gap-1 hover:text-blue-600"
//             onClick={() => setOpen(!open)}
//           >
//             Newsroom & Reflections <ChevronDown size={16} />
//           </div>
//           {open && (
//             <ul className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
//               <li onClick={() => navigate("/news")} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">News</li>
//               <li onClick={() => navigate("/successstory")} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Success Story</li>
//             </ul>
//           )}
//         </li>

//         <li onClick={() => navigate("/fundraising")} className="cursor-pointer hover:text-blue-600">Fund Raising</li>
//         <li onClick={() => navigate("/more")} className="cursor-pointer hover:text-blue-600">More</li>
//       </ul>

//       {/* Right: Login */}
//       <div
//         className="flex items-center space-x-2 cursor-pointer px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 "
//         onClick={() => navigate("/login")}
//       >
//         <LogIn size={20} />
//         <span>Login</span>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ChevronDown, Menu } from "lucide-react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdown when clicking outside (desktop dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle mobile submenu (inside mobile menu)
  const toggleMobileDropdown = () => {
    setOpenDropdown(!openDropdown);
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

          {/* Dropdown desktop */}
          <li ref={dropdownRef} className="relative">
            <div
              className="cursor-pointer flex items-center gap-1 hover:text-blue-600 select-none"
              onClick={() => setOpenDropdown(!openDropdown)}
            >
              Newsroom & Reflections <ChevronDown size={16} />
            </div>
            {openDropdown && (
              <ul className="absolute left-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                <li
                  onClick={() => {
                    navigate("/news");
                    setOpenDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  News
                </li>
                <li
                  onClick={() => {
                    navigate("/successstory");
                    setOpenDropdown(false);
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
          <li
            onClick={() => navigate("/more")}
            className="cursor-pointer hover:text-blue-600"
          >
            More
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

            {/* Mobile dropdown */}
            <li>
              <div
                onClick={toggleMobileDropdown}
                className="flex items-center justify-between cursor-pointer hover:text-blue-600 select-none"
              >
                Newsroom & Reflections
                <ChevronDown
                  size={16}
                  className={`transform transition-transform duration-300 ${
                    openDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openDropdown && (
                <ul className="mt-2 pl-4 border-l border-gray-300 flex flex-col space-y-2">
                  <li
                    onClick={() => {
                      navigate("/news");
                      setMobileMenuOpen(false);
                      setOpenDropdown(false);
                    }}
                    className="cursor-pointer hover:text-blue-600"
                  >
                    News
                  </li>
                  <li
                    onClick={() => {
                      navigate("/successstory");
                      setMobileMenuOpen(false);
                      setOpenDropdown(false);
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
                navigate("/fundraising");
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer hover:text-blue-600"
            >
              Fund Raising
            </li>
            <li
              onClick={() => {
                navigate("/more");
                setMobileMenuOpen(false);
              }}
              className="cursor-pointer hover:text-blue-600"
            >
              More
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
