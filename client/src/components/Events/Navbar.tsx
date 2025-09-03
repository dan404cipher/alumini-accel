import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm ">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-center space-x-8">
        <a
          href="/events"
          className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
        >
          All Events
        </a>
        <a
          href="/reunion"
          className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
        >
          Reunion
        </a>
        <a
          href="/webinar"
          className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
        >
          Webinar
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
