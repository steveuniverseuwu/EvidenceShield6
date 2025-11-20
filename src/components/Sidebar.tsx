import { Users, Shield, Upload, FileCheck, Download, Share2, Activity, AlertTriangle } from "lucide-react";
import { User } from "../App";

interface SidebarProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentUser, currentPage, onNavigate }: SidebarProps) {
  const isActive = (page: string) => currentPage === page;

  const getNavItems = () => {
    const role = currentUser.role;

    if (role === "Administrator") {
      return [
        { id: "users", label: "System Personnel", icon: Users, description: "Officers, Analysts & Prosecutors" },
        { id: "tamper", label: "Tamper Detection", icon: AlertTriangle, description: "Real-time Monitoring" },
        { id: "audit", label: "Audit Trail", icon: Activity, description: "Blockchain Logs" },
      ];
    }

    if (role === "Police Officer") {
      return [
        { id: "upload", label: "Upload Evidence", icon: Upload, description: "Upload Files" },
        { id: "files", label: "My Evidence", icon: FileCheck, description: "View & Verify" },
        { id: "share", label: "Share Evidence", icon: Share2, description: "Share to Forensics" },
        { id: "audit", label: "Audit Trail", icon: Activity, description: "Blockchain Logs" },
      ];
    }

    if (role === "Forensics Specialist") {
      return [
        { id: "upload", label: "Upload Evidence", icon: Upload, description: "Upload Files" },
        { id: "files", label: "My Evidence", icon: FileCheck, description: "View & Verify" },
        { id: "share", label: "Share Evidence", icon: Share2, description: "Share to Prosecutor" },
        { id: "audit", label: "Audit Trail", icon: Activity, description: "Blockchain Logs" },
      ];
    }

    if (role === "Prosecutor") {
      return [
        { id: "files", label: "Evidence Files", icon: FileCheck, description: "View & Verify" },
        { id: "download", label: "Downloads", icon: Download, description: "Download Files" },
        { id: "audit", label: "Audit Trail", icon: Activity, description: "Blockchain Logs" },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="w-[280px] bg-gradient-to-b from-indigo-900 via-indigo-800 to-blue-900 border-r border-indigo-700/30 p-6 flex flex-col flex-shrink-0 shadow-2xl">
      {/* Logo Section */}
      <div className="mb-8 pb-6 border-b border-indigo-700/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl">EvidenceShield</h1>
            <div className="text-indigo-300 text-xs">Digital Evidence Management</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.id);

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-900/50 border border-blue-400/20"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm ${
                active ? "bg-white/10" : "bg-white/5"
              }`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white">{item.label}</div>
                <div className={`text-xs ${active ? "text-blue-100" : "text-indigo-300"}`}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Badge */}
      <div className="mt-6 pt-6 border-t border-indigo-700/30">
        <div className="bg-gradient-to-r from-indigo-950/80 to-blue-950/80 rounded-xl p-4 border border-indigo-700/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs uppercase tracking-wider">System Online</span>
          </div>
          <p className="text-indigo-300 text-xs">Polygon Network Active</p>
        </div>
      </div>
    </div>
  );
}
