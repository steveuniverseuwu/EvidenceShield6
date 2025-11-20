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
    <header className="bg-white/80 backdrop-blur-md border-b border-indigo-200 px-8 py-4 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section - Page Title */}
        <div>
          <h1 className="text-indigo-900 text-xl mb-0.5">{headerContent.title}</h1>
          <p className="text-indigo-600 text-sm">{headerContent.subtitle}</p>
        </div>

        {/* Right Section - Live Session, User Info, Sign Out */}
        <div className="flex items-center gap-6">
          {/* Live Session Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-300 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 text-sm uppercase tracking-wide">Live Session</span>
          </div>

          {/* User Info */}
          <div className="text-right">
            <div className="text-indigo-900 text-sm">{currentUser.name}</div>
            <div className="text-indigo-600 text-xs">{currentUser.role} • {currentUser.department}</div>
          </div>

          {/* Sign Out Button */}
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
