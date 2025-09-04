import React from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube, FaInstagram } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand & Description */}
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold">AlumniAccel</h2>
          <p className="text-gray-300 text-sm">
            Connecting alumni worldwide, fostering career opportunities, and celebrating achievements. Join our network to stay updated with events, job postings, and recognition.
          </p>
          {/* Social Icons */}
          <div className="flex space-x-4 mt-2">
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition transform hover:scale-110">
              <FaFacebookF />
            </a>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition transform hover:scale-110">
              <FaTwitter />
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition transform hover:scale-110">
              <FaLinkedinIn />
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="hover:text-red-600 transition transform hover:scale-110">
              <FaYoutube />
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition transform hover:scale-110">
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col space-y-2">
          <h3 className="text-xl font-semibold mb-2">Quick Links</h3>
          <a href="/" className="text-gray-300 hover:text-white transition">Home</a>
          <a href="/notable" className="text-gray-300 hover:text-white transition">Notable Alumni</a>
          <a href="/events" className="text-gray-300 hover:text-white transition">Events</a>
          <a href="/gallery" className="text-gray-300 hover:text-white transition">Gallery</a>
          <a href="/news" className="text-gray-300 hover:text-white transition">News</a>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col space-y-2">
          <h3 className="text-xl font-semibold mb-2">Contact Us</h3>
          <p className="text-gray-300">Email: info@alumniengage.com</p>
          <p className="text-gray-300">Phone: +1 (123) 456-7890</p>
          <p className="text-gray-300">Address: 123 Alumni St, City, Country</p>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} AlumniAccel. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
