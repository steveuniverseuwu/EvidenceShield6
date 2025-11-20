import { useState, useEffect } from "react";
import { Edit, Trash2, User as UserIcon, Mail, Briefcase, Building, Plus, Database, RefreshCw } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { User } from "../App";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { projectId, publicAnonKey, supabaseUrl } from "../utils/supabase/info";

// Debug: Log the imported values
console.log("🔍 UserTable - Supabase Config Check:");
console.log("  projectId:", projectId);
console.log("  publicAnonKey:", publicAnonKey ? "✓ Present" : "✗ Missing");
console.log("  supabaseUrl:", supabaseUrl);
console.log("  Direct env check:");
console.log("  - VITE_SUPABASE_PROJECT_ID:", import.meta.env.VITE_SUPABASE_PROJECT_ID);
console.log("  - VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);

interface UserData {
  email: string;
  name: string;
  role: string;
  department: string;
  badgeId: string;
  password?: string;
  status?: string;
}

interface UserTableProps {
  currentUser: User;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case "Administrator":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "Police Officer":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Forensics Specialist":
      return "bg-purple-100 text-purple-700 border-purple-300";
    case "Prosecutor":
      return "bg-indigo-100 text-indigo-700 border-indigo-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

export function UserTable({ currentUser }: UserTableProps) {
  // Dynamic page title based on user role
  const getPageTitle = () => {
    switch (currentUser.role) {
      case "Police Officer":
        return {
          title: "Police Officers",
          subtitle: "Law enforcement personnel managing evidence collection and chain of custody"
        };
      case "Forensics Specialist":
        return {
          title: "Forensic Analysts",
          subtitle: "Forensic experts analyzing and processing evidence with scientific methods"
        };
      case "Prosecutor":
        return {
          title: "Prosecutors",
          subtitle: "Legal professionals building cases and presenting evidence in court"
        };
      case "Administrator":
        return {
          title: "System Administrators",
          subtitle: "Managing all system users: Police Officers, Forensic Analysts, and Prosecutors"
        };
      default:
        return {
          title: "System Personnel",
          subtitle: "Law enforcement and legal professionals"
        };
    }
  };

  const pageTitle = getPageTitle();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showResetStorageDialog, setShowResetStorageDialog] = useState(false);
  const [resettingStorage, setResettingStorage] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "",
    department: "",
    badgeId: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Initialize demo users
  const initializeUsers = async () => {
    try {
      setLoading(true);
      console.log("Manually initializing demo users...");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/init-users`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Init error:", errorText);
        throw new Error(`Failed to initialize users: ${response.status}`);
      }

      const data = await response.json();
      console.log("Users initialized:", data);
      setSuccess("8 demo users created successfully!");
      
      // Now fetch the users
      await fetchUsers();
    } catch (err: any) {
      console.error("Error initializing users:", err);
      setError(`Failed to initialize users: ${err.message}`);
      setLoading(false);
    }
  };

  // Fetch users from server
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("Fetching users from backend...");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-users`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      console.log("Users data received:", data);
      
      // Filter out null users and deactivated users
      const activeUsers = (data.users || []).filter(
        (u: UserData | null) => u !== null && u.status !== "deactivated"
      );
      
      console.log("Active users after filtering:", activeUsers.length);
      setUsers(activeUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test backend connectivity first
    const testBackend = async () => {
      try {
        // Test health endpoint
        const healthCheck = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/health`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const health = await healthCheck.json();
        console.log("✅ Backend health check:", health);
        
        // Test KV store
        const kvTest = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/test-kv`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        const kvResult = await kvTest.json();
        console.log("✅ KV Store test:", kvResult);
      } catch (err) {
        console.error("❌ Backend/KV test failed:", err);
      }
    };
    
    testBackend();
    fetchUsers();
  }, []);

  // Handle create user
  const handleCreate = async () => {
    try {
      setError(null);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            ...formData,
            createdBy: currentUser.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccess("User created successfully!");
      setShowCreateDialog(false);
      setFormData({
        email: "",
        name: "",
        role: "",
        department: "",
        badgeId: "",
        password: "",
      });
      fetchUsers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle edit user
  const handleEdit = async () => {
    try {
      setError(null);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/update-user`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            ...formData,
            updatedBy: currentUser.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setSuccess("User updated successfully!");
      setShowEditDialog(false);
      setSelectedUser(null);
      setFormData({
        email: "",
        name: "",
        role: "",
        department: "",
        badgeId: "",
        password: "",
      });
      fetchUsers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle deactivate user
  const handleDeactivate = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/deactivate-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: selectedUser.email,
            deactivatedBy: currentUser.email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to deactivate user");
      }

      setSuccess("User deactivated successfully!");
      setShowDeactivateDialog(false);
      setSelectedUser(null);
      fetchUsers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle reset storage
  const handleResetStorage = async () => {
    try {
      setError(null);
      setResettingStorage(true);
      
      // Step 1: Clear server-side storage (evidence files, audit events)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/reset-storage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset storage");
      }

      // Step 2: Clear client-side localStorage (encryption keys, ZKP keys)
      console.log('🧹 Clearing client-side storage...');
      
      const keysToRemove = Object.keys(localStorage).filter(
        k => k.startsWith('encryption_') || k.startsWith('zkp_file_')
      );
      
      console.log(`Found ${keysToRemove.length} client-side keys to remove`);
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`   Removed: ${key}`);
      });
      
      console.log('✅ Client-side storage cleared');

      setSuccess(
        `Storage reset successfully! ` +
        `Deleted ${data.deleted.total} server entries (${data.deleted.evidenceFiles} files, ${data.deleted.auditEvents} audit events) ` +
        `and ${keysToRemove.length} client-side keys (encryption & ZKP data).`
      );
      setShowResetStorageDialog(false);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResettingStorage(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      badgeId: user.badgeId,
      password: "", // Don't populate password for security
    });
    setShowEditDialog(true);
  };

  // Open deactivate dialog
  const openDeactivateDialog = (user: UserData) => {
    setSelectedUser(user);
    setShowDeactivateDialog(true);
  };

  // Calculate stats
  const stats = [
    { label: "TOTAL USERS", value: users.length.toString() },
    {
      label: "ADMINISTRATORS",
      value: users.filter((u) => u.role === "Administrator").length.toString(),
    },
    {
      label: "POLICE OFFICERS",
      value: users.filter((u) => u.role === "Police Officer").length.toString(),
    },
    {
      label: "FORENSICS",
      value: users.filter((u) => u.role === "Forensics Specialist").length.toString(),
    },
    {
      label: "PROSECUTORS",
      value: users.filter((u) => u.role === "Prosecutor").length.toString(),
    },
  ];

  // Check if configuration is missing
  const configMissing = !projectId || !publicAnonKey;

  return (
    <div className="p-6 space-y-6">
      {/* Configuration Error Message */}
      {configMissing && (
        <div className="bg-red-50 border-2 border-red-300 text-red-900 px-6 py-4 rounded-lg animate-pulse">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">🚨 CONFIGURATION ERROR - DEV SERVER NOT RESTARTED 🚨</h3>
              <p className="mb-3">
                The Supabase environment variables are <strong>NOT LOADED</strong>. This happens when the development server was started before the <code className="bg-red-100 px-1 rounded">.env</code> file was configured.
              </p>
              <div className="bg-red-100 border border-red-300 rounded p-3 mb-3">
                <p className="font-semibold mb-2 text-red-800">⚡ STOP AND READ THIS - YOU MUST RESTART THE SERVER:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li className="font-semibold">Find your terminal where <code className="bg-white px-2 py-0.5 rounded">npm run dev</code> is running</li>
                  <li className="font-semibold">Press <code className="bg-white px-2 py-0.5 rounded">Ctrl+C</code> to stop the server</li>
                  <li className="font-semibold">Run <code className="bg-white px-2 py-0.5 rounded">npm run dev</code> again to restart</li>
                  <li className="font-semibold">Come back here and press <code className="bg-white px-2 py-0.5 rounded">Ctrl+Shift+R</code> (hard refresh)</li>
                </ol>
              </div>
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-3">
                <p className="text-sm font-semibold text-yellow-900">
                  📋 Current Status (from browser console):
                </p>
                <ul className="text-sm mt-2 space-y-1 font-mono">
                  <li>projectId: {projectId || '❌ UNDEFINED'}</li>
                  <li>supabaseUrl: {supabaseUrl || '❌ UNDEFINED'}</li>
                </ul>
              </div>
              <p className="text-sm">
                Open browser console (F12) to see the full debug output.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Section Header with Create Button */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-indigo-900">{pageTitle.title}</h2>
              <p className="text-indigo-600 text-sm">
                {pageTitle.subtitle}
              </p>
            </div>
          </div>
          {currentUser.role === "Administrator" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetStorageDialog(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                title="Reset all evidence files and audit trails (keeps users)"
              >
                <Database className="w-4 h-4" />
                Reset Storage
              </button>
              <button
                onClick={() => {
                  setFormData({
                    email: "",
                    name: "",
                    role: "",
                    department: "",
                    badgeId: "",
                    password: "",
                  });
                  setShowCreateDialog(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create New User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-indigo-600 text-3xl mb-1">{stat.value}</div>
            <div className="text-indigo-500 text-xs uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-indigo-200">
                <th className="text-left px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-2 text-indigo-700 text-sm uppercase tracking-wider">
                    <UserIcon className="w-4 h-4" />
                    Name
                  </div>
                </th>
                <th className="text-left px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-2 text-indigo-700 text-sm uppercase tracking-wider">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                </th>
                <th className="text-left px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-2 text-indigo-700 text-sm uppercase tracking-wider">
                    <Briefcase className="w-4 h-4" />
                    Role
                  </div>
                </th>
                <th className="text-left px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-2 text-indigo-700 text-sm uppercase tracking-wider">
                    <Building className="w-4 h-4" />
                    Department
                  </div>
                </th>
                <th className="text-left px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="text-indigo-700 text-sm uppercase tracking-wider">
                    Badge ID
                  </div>
                </th>
                {currentUser.role === "Administrator" && (
                  <th className="text-right px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50">
                    <div className="text-indigo-700 text-sm uppercase tracking-wider">
                      Actions
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-indigo-600">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="text-indigo-600 mb-3">No users found in database</div>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={fetchUsers}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Retry Loading
                      </button>
                      <button
                        onClick={initializeUsers}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        Initialize 8 Demo Users
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.email}
                    className="border-b border-indigo-100 hover:bg-indigo-50/50 transition-colors"
                  >
                    {/* Name Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-indigo-900">{user.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </td>

                    {/* Role Column */}
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`${getRoleColor(user.role)} border whitespace-nowrap`}
                      >
                        {user.role}
                      </Badge>
                    </td>

                    {/* Department Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <Building className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                        <span>{user.department}</span>
                      </div>
                    </td>

                    {/* Badge ID Column */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
                        <span className="text-indigo-700 text-sm">
                          {user.badgeId}
                        </span>
                      </div>
                    </td>

                    {/* Actions Column - Only for Admins */}
                    {currentUser.role === "Administrator" && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeactivateDialog(user)}
                            disabled={user.email === currentUser.email}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the EvidenceShield system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Full Name</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.gov"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Police Officer">Police Officer</SelectItem>
                  <SelectItem value="Forensics Specialist">
                    Forensics Specialist
                  </SelectItem>
                  <SelectItem value="Prosecutor">Prosecutor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-department">Department</Label>
              <Input
                id="create-department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="IT Department"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-badgeId">Badge ID</Label>
              <Input
                id="create-badgeId"
                value={formData.badgeId}
                onChange={(e) =>
                  setFormData({ ...formData, badgeId: e.target.value })
                }
                placeholder="P-1234"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Police Officer">Police Officer</SelectItem>
                  <SelectItem value="Forensics Specialist">
                    Forensics Specialist
                  </SelectItem>
                  <SelectItem value="Prosecutor">Prosecutor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-badgeId">Badge ID</Label>
              <Input
                id="edit-badgeId"
                value={formData.badgeId}
                onChange={(e) =>
                  setFormData({ ...formData, badgeId: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this user? This action will prevent
              them from accessing the system.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="text-indigo-900">{selectedUser.name}</div>
                <div className="text-indigo-600 text-sm">{selectedUser.email}</div>
                <div className="text-indigo-700 text-sm mt-2">
                  Role: {selectedUser.role}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate}>
              Deactivate User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Storage Dialog */}
      <Dialog open={showResetStorageDialog} onOpenChange={setShowResetStorageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Database className="w-5 h-5" />
              Reset Storage
            </DialogTitle>
            <DialogDescription>
              This action will permanently delete ALL evidence files, file contents, audit trail events from the database, and clear all client-side encryption/ZKP data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-900 text-sm space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-red-600">⚠️</span>
                  <span><strong>Warning:</strong> This action is irreversible and cannot be undone.</span>
                </p>
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="text-indigo-900 text-sm space-y-2">
                <p className="mb-2"><strong>What will be deleted:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-indigo-700 text-sm ml-2">
                  <li>All uploaded evidence files (server)</li>
                  <li>All file contents stored in the database</li>
                  <li>All audit trail events (uploads, shares, verifications, downloads)</li>
                  <li>All encryption keys (client-side localStorage)</li>
                  <li>All ZKP proof data (client-side localStorage)</li>
                  <li>All test data</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-900 text-sm space-y-2">
                <p className="mb-2"><strong>What will be preserved:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-green-700 text-sm ml-2">
                  <li>All user accounts and credentials</li>
                  <li>User roles and permissions</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetStorageDialog(false)}
              disabled={resettingStorage}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetStorage}
              disabled={resettingStorage}
              className="flex items-center gap-2"
            >
              {resettingStorage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Reset Storage
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
