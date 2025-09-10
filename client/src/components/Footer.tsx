import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Copyright */}
          <div className="flex items-center text-sm text-muted-foreground">
            <span>© {currentYear} AlumniAccel. All rights reserved.</span>
          </div>

          {/* Center - Legal Links */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link
              to="/cookies"
              className="hover:text-primary transition-colors"
            >
              Cookie Policy
            </Link>
          </div>

          {/* Right side - Made with love */}
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="flex items-center">
              Made with <Heart className="w-4 h-4 mx-1 text-red-500" /> by the
              AlumniAccel Team
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
