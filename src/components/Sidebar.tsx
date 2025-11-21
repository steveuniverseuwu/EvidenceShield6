import { Users, Upload, FileCheck, Download, Share2, Activity, AlertTriangle } from "lucide-react";
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
        { id: "audit", label: "Audit Trail", icon: Activity, description: "Blockchain Logs" },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="w-[280px] bg-gradient-to-b from-slate-900/95 via-blue-950/95 to-indigo-950/95 backdrop-blur-xl border-r border-blue-500/30 p-6 flex flex-col flex-shrink-0 shadow-2xl shadow-blue-500/20">
      {/* Logo Section */}
      <div className="mb-8 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <img src="/logo.png" alt="ChainGuard Logo" className="w-16 h-16 object-contain rounded-xl" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">ChainGuard</h1>
            <div className="text-blue-300 text-xs tracking-wider font-medium">DIGITAL EVIDENCE MANAGEMENT</div>
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
                  ? "bg-gradient-to-r from-blue-600/80 to-cyan-600/80 shadow-lg shadow-blue-500/40 border border-blue-400/60 backdrop-blur-sm"
                  : "hover:bg-blue-500/10 hover:border-blue-500/30 border border-transparent backdrop-blur-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center backdrop-blur-sm ${
                active ? "bg-white/20 shadow-[0_0_15px_rgba(59,130,246,0.6)]" : "bg-white/5"
              }`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white">{item.label}</div>
                <div className={`text-xs ${active ? "text-blue-100" : "text-blue-300"}`}>
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Badge */}
      <div className="mt-6 pt-6">
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,1)]"></div>
            <span className="text-green-400 text-xs uppercase tracking-wider font-semibold drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]">System Online</span>
          </div>
          <p className="text-blue-300 text-xs font-medium">Polygon Network Active</p>
        </div>
      </div>
    </div>
  );
}
