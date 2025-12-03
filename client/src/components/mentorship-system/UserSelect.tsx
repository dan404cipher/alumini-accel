import React, { useState, useEffect } from "react";
import { Search, User, Check } from "lucide-react";
import api from "@/lib/api";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

interface UserSelectProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
  roles?: string[]; // Filter by roles if provided
  tenantId?: string; // Filter by college/tenant if provided
}

export const UserSelect: React.FC<UserSelectProps> = ({
  selectedUserId,
  onUserChange,
  label,
  placeholder = "Search and select user...",
  required = false,
  roles,
  tenantId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedUserId) {
      fetchSelectedUser();
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId]);

  const fetchSelectedUser = async () => {
    try {
      const response = await api.get("/users", {
        params: {
          limit: 100,
          status: "active",
          ...(roles && roles.length > 0 ? { roles: roles.join(",") } : {}),
          ...(tenantId ? { tenantId } : {}),
        },
      });

      if (response.data.success && response.data.data?.users) {
        // Filter out alumni
        const validUsers = response.data.data.users.filter(
          (u: User) => u.role !== "alumni"
        );
        const user = validUsers.find((u: User) => u._id === selectedUserId);
        if (user) {
          setSelectedUser(user);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch user:", error);
      if (error.response?.status === 403) {
        console.error("Permission denied: You don't have access to fetch users");
      }
    }
  };

  const searchUsers = async (term: string) => {
    if (term.length < 1) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        search: term,
        limit: 20,
        status: "active", // Only show active users
      };
      if (roles && roles.length > 0) {
        params.roles = roles.join(",");
      }
      if (tenantId) {
        params.tenantId = tenantId;
      }

      const response = await api.get("/users", { params });

      if (response.data.success && response.data.data?.users) {
        // Filter out alumni and ensure only allowed roles are shown
        let filteredUsers = response.data.data.users;
        
        // Exclude alumni explicitly
        filteredUsers = filteredUsers.filter((user: User) => user.role !== "alumni");
        
        // If roles are specified, ensure only those roles are shown
        if (roles && roles.length > 0) {
          filteredUsers = filteredUsers.filter((user: User) => 
            user.role && roles.includes(user.role)
          );
        }
        
        setUsers(filteredUsers);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error("Failed to search users:", error);
      setUsers([]);
      // Show error message to user
      if (error.response?.status === 403) {
        console.error("Permission denied: You don't have access to search users");
      } else if (error.response?.status === 401) {
        console.error("Authentication required");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    searchUsers(term);
  };

  const handleSelectUser = (user: User) => {
    onUserChange(user._id);
    setSelectedUser(user);
    setSearchTerm("");
    setUsers([]);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected User Display */}
      {selectedUser && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md mb-2">
          <User className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-900">
            {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
          </span>
          <button
            onClick={() => {
              onUserChange("");
              setSelectedUser(null);
            }}
            className="ml-auto text-gray-400 hover:text-gray-600"
            type="button"
          >
            ×
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Dropdown */}
        {isOpen && searchTerm.length >= 1 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  {selectedUserId === user._id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))
            ) : searchTerm.length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                No users found{roles && roles.length > 0 ? ` with roles: ${roles.join(", ")}` : ""}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Type at least 2 characters to search
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

