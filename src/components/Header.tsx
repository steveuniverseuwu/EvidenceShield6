import { LogOut } from "lucide-react";
import { User } from "../App";

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export function Header({ currentUser, onLogout }: HeaderProps) {
  // Dynamic header content based on user role
  const getHeaderContent = () => {
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

  const headerContent = getHeaderContent();

  return (
    <header className="bg-slate-900/80 backdrop-blur-xl border-b border-blue-500/30 px-8 py-4 flex-shrink-0 shadow-lg shadow-blue-500/10">
      <div className="flex items-center justify-between">
        {/* Left Section - Page Title */}
        <div>
          <h1 className="text-blue-100 text-xl mb-0.5 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">{headerContent.title}</h1>
          <p className="text-blue-300 text-sm">{headerContent.subtitle}</p>
        </div>

        {/* Right Section - Live Session, User Info, Sign Out */}
        <div className="flex items-center gap-6">
          {/* Live Session Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-400/40 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,1)]"></div>
            <span className="text-green-300 text-sm uppercase tracking-wide font-semibold">Live Session</span>
          </div>

          {/* User Info */}
          <div className="text-right">
            <div className="text-blue-100 text-sm font-medium">{currentUser.name}</div>
            <div className="text-blue-300 text-xs">{currentUser.role} • {currentUser.department}</div>
          </div>

          {/* Sign Out Button */}
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30 backdrop-blur-sm border border-blue-400/30"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
