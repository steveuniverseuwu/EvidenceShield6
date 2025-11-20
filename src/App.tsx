import { useState } from "react";
import { motion } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { UserTable } from "./components/UserTable";
import { LoginPage } from "./components/LoginPage";
import { SplashScreen } from "./components/SplashScreen";
import { UploadEvidence } from "./components/UploadEvidence";
import { EvidenceFiles } from "./components/EvidenceFiles";
import { ShareEvidence } from "./components/ShareEvidence";
import { AuditTrail } from "./components/AuditTrail";
import { TamperDetectionDemo } from "./components/TamperDetectionDemo";

export interface User {
  email: string;
  name: string;
  role: string;
  department: string;
  badgeId: string;
}

// User credentials database
const users: Record<string, { password: string; user: User }> = {
  "admin@evidenceshield.gov": {
    password: "admin123",
    user: {
      email: "admin@evidenceshield.gov",
      name: "System Administrator",
      role: "Administrator",
      department: "IT Department",
      badgeId: "ADM-001",
    },
  },
  "officer@police.gov": {
    password: "police123",
    user: {
      email: "officer@police.gov",
      name: "John Smith",
      role: "Police Officer",
      department: "Metropolitan Police",
      badgeId: "P-2345",
    },
  },
  "forensics@lab.gov": {
    password: "forensics123",
    user: {
      email: "forensics@lab.gov",
      name: "Dr. Sarah Johnson",
      role: "Forensics Specialist",
      department: "Digital Forensics Lab",
      badgeId: "FS-0791",
    },
  },
  "prosecutor@da.gov": {
    password: "prosecutor123",
    user: {
      email: "prosecutor@da.gov",
      name: "Michael Brown",
      role: "Prosecutor",
      department: "District Attorney Office",
      badgeId: "DA-8795",
    },
  },
  "detective@police.gov": {
    password: "detective123",
    user: {
      email: "detective@police.gov",
      name: "Emily Davis",
      role: "Police Officer",
      department: "Metropolitan Police",
      badgeId: "D-3421",
    },
  },
  "forensics2@lab.gov": {
    password: "forensics2123",
    user: {
      email: "forensics2@lab.gov",
      name: "Dr. Robert Chen",
      role: "Forensics Specialist",
      department: "Digital Forensics Lab",
      badgeId: "FS-1123",
    },
  },
  "prosecutor2@da.gov": {
    password: "prosecutor2123",
    user: {
      email: "prosecutor2@da.gov",
      name: "Jessica Martinez",
      role: "Prosecutor",
      department: "District Attorney Office",
      badgeId: "DA-9234",
    },
  },
  "officer2@police.gov": {
    password: "officer2123",
    user: {
      email: "officer2@police.gov",
      name: "David Wilson",
      role: "Police Officer",
      department: "Metropolitan Police",
      badgeId: "P-5678",
    },
  },
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>("users");

  const handleLogin = (email: string, password: string) => {
    const userRecord = users[email];
    
    if (!userRecord) {
      setLoginError("Invalid email address. Please check your credentials.");
      return;
    }

    if (userRecord.password !== password) {
      setLoginError("Incorrect password. Please try again.");
      return;
    }

    // Successful login
    setLoginError(null);
    setCurrentUser(userRecord.user);
    
    // Set default page based on role
    if (userRecord.user.role === "Administrator") {
      setCurrentPage("users");
    } else if (userRecord.user.role === "Prosecutor") {
      setCurrentPage("files");
    } else {
      setCurrentPage("upload");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginError(null);
    setCurrentPage("users");
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    if (!currentUser) return null;

    switch (currentPage) {
      case "users":
        return <UserTable currentUser={currentUser} />;
      case "upload":
        return <UploadEvidence currentUser={currentUser} />;
      case "files":
        return <EvidenceFiles currentUser={currentUser} />;
      case "share":
        return <ShareEvidence currentUser={currentUser} />;
      case "audit":
        return <AuditTrail currentUser={currentUser} />;
      case "download":
        return <EvidenceFiles currentUser={currentUser} />;
      case "tamper":
        return <TamperDetectionDemo currentUser={currentUser} />;
      default:
        return <UserTable currentUser={currentUser} />;
    }
  };

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show login page if not authenticated
  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LoginPage onLogin={handleLogin} error={loginError} />
      </motion.div>
    );
  }

  // Show main app if authenticated
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex overflow-hidden"
    >
      {/* Sidebar */}
      <Sidebar 
        currentUser={currentUser} 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header currentUser={currentUser} onLogout={handleLogout} />
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </motion.div>
  );
}
