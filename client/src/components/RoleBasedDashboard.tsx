import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminDashboard from "./dashboards/SuperAdminDashboard";
import CollegeAdminDashboard from "./dashboards/CollegeAdminDashboard";
import HODPanel from "./dashboards/HODPanel";
import StaffPanel from "./dashboards/StaffPanel";
import AlumniPortal from "./dashboards/AlumniPortal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const RoleBasedDashboard = () => {
  const { user } = useAuth();

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case "super_admin":
      return <SuperAdminDashboard />;

    case "college_admin":
      return <CollegeAdminDashboard />;

    case "hod":
      return <HODPanel />;

    case "staff":
      return <StaffPanel />;

    case "alumni":
      return <AlumniPortal />;

    default:
      // Fallback for unknown roles
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                Unknown Role
              </CardTitle>
              <CardDescription>
                Your role "{user.role}" is not recognized by the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Please contact your system administrator to resolve this
                  issue.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Your Account Details:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      <strong>Name:</strong> {user.firstName} {user.lastName}
                    </li>
                    <li>
                      <strong>Email:</strong> {user.email}
                    </li>
                    <li>
                      <strong>Role:</strong> {user.role}
                    </li>
                    <li>
                      <strong>Status:</strong> {user.status}
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }
};

export default RoleBasedDashboard;
