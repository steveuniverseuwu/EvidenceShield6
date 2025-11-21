import { useState, useEffect } from "react";
import { Shield, LogIn, Lock, Mail, Copy, Check, Activity, Eye } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { BlockchainBackground } from "./BlockchainBackground";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  error: string | null;
  onViewPublicAuditTrail?: () => void;
}

const demoAccounts = [
  {
    role: "Administrator",
    email: "admin@evidenceshield.gov",
    password: "admin123",
    badgeId: "ADM-001",
    name: "System Administrator",
    department: "IT Department",
    bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
    badgeClass: "bg-emerald-200 text-emerald-800",
  },
  {
    role: "Police Officer",
    email: "officer@police.gov",
    password: "police123",
    badgeId: "P-2345",
    name: "John Smith",
    department: "Metropolitan Police",
    bgClass: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    badgeClass: "bg-blue-200 text-blue-800",
  },
  {
    role: "Forensics Specialist",
    email: "forensics@lab.gov",
    password: "forensics123",
    badgeId: "FS-0791",
    name: "Dr. Sarah Johnson",
    department: "Digital Forensics Lab",
    bgClass: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
    badgeClass: "bg-purple-200 text-purple-800",
  },
  {
    role: "Prosecutor",
    email: "prosecutor@da.gov",
    password: "prosecutor123",
    badgeId: "DA-8795",
    name: "Michael Brown",
    department: "District Attorney Office",
    bgClass: "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200",
    badgeClass: "bg-indigo-200 text-indigo-800",
  },
  {
    role: "Police Detective",
    email: "detective@police.gov",
    password: "detective123",
    badgeId: "D-3421",
    name: "Emily Davis",
    department: "Metropolitan Police",
    bgClass: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    badgeClass: "bg-blue-200 text-blue-800",
  },
  {
    role: "Forensics Specialist",
    email: "forensics2@lab.gov",
    password: "forensics2123",
    badgeId: "FS-1123",
    name: "Dr. Robert Chen",
    department: "Digital Forensics Lab",
    bgClass: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
    badgeClass: "bg-purple-200 text-purple-800",
  },
  {
    role: "Prosecutor",
    email: "prosecutor2@da.gov",
    password: "prosecutor2123",
    badgeId: "DA-9234",
    name: "Jessica Martinez",
    department: "District Attorney Office",
    bgClass: "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200",
    badgeClass: "bg-indigo-200 text-indigo-800",
  },
  {
    role: "Police Officer",
    email: "officer2@police.gov",
    password: "officer2123",
    badgeId: "P-5678",
    name: "David Wilson",
    department: "Metropolitan Police",
    bgClass: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    badgeClass: "bg-blue-200 text-blue-800",
  },
];

export function LoginPage({ onLogin, error, onViewPublicAuditTrail }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);

  // Trigger content to show after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(text);
      setCopiedEmail(type);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      // Fallback for when clipboard API is blocked
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        
        if (successful) {
          setCopiedEmail(type);
          setTimeout(() => setCopiedEmail(null), 2000);
        }
      } catch (fallbackErr) {
        // If both methods fail, just show visual feedback anyway
        // The user can manually copy the visible text
        console.log('Copy failed, but text is visible for manual copy');
        setCopiedEmail(type);
        setTimeout(() => setCopiedEmail(null), 2000);
      }
    }
  };

  const useCredentials = (account: typeof demoAccounts[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setShowDemoAccounts(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Blockchain Background */}
      <BlockchainBackground />
      
      {/* Centered Login Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Public Audit Trail Button - Left Side */}
        {onViewPublicAuditTrail && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2"
          >
            <button
              onClick={onViewPublicAuditTrail}
              className="group bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-all hover:border-blue-400/50"
            >
              <div className="flex flex-col items-center gap-4 text-center max-w-[200px]">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:shadow-blue-500/70 transition-all group-hover:scale-110">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-blue-100 font-semibold mb-1 flex items-center gap-2 justify-center">
                    <Eye className="w-4 h-4" />
                    Public Audit Trail
                  </h3>
                  <p className="text-blue-300 text-xs leading-relaxed">
                    View all blockchain activities for transparency
                  </p>
                </div>
                <div className="text-blue-400 text-xs font-medium group-hover:text-blue-300 transition-colors">
                  Click to view →
                </div>
              </div>
            </button>
          </motion.div>
        )}

        <div className="w-full max-w-md">
          {/* Glass morphism container */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.3)] p-6 sm:p-8">
            {/* Logo */}
            <div className="flex flex-col items-center justify-center gap-3 mb-6">
              <motion.img 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                src="/CYBERCRIME.png" 
                alt="ChainGuard Logo" 
                className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
              />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="text-center"
              >
                <h1 className="text-white text-2xl font-bold mb-1">ChainGuard</h1>
                <p className="text-blue-300 text-xs">Digital Evidence Management</p>
              </motion.div>
            </div>

            {/* Login Heading */}
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-white text-lg font-semibold mb-1 text-center"
            >
              Welcome Back
            </motion.h2>
            
            {/* Demo Credentials Link */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-blue-200 text-xs mb-5 text-center"
            >
              Don't have credentials?{" "}
              <button
                type="button"
                onClick={() => setShowDemoAccounts(true)}
                className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
              >
                View Demo Accounts
              </button>
            </motion.p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-900/50 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email" className="text-blue-200 text-xs mb-1.5 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 pl-10 bg-slate-800/60 border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-500 focus:ring-blue-500/50"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-blue-200 text-xs mb-1.5 block">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-10 bg-slate-800/60 border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-500 focus:ring-blue-500/50"
                    required
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-800/60 border-blue-500/30 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 text-xs text-blue-200">
                  Remember Me
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-10 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
            </motion.form>

            {/* Forgot Password */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-center mt-4"
            >
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">
                Forgot Your Password?
              </a>
            </motion.div>

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="mt-6 pt-4 border-t border-blue-500/20"
            >
              <p className="text-xs text-blue-300/70 text-center">
                Secure blockchain-powered evidence platform
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Demo Accounts Modal */}
      <Dialog open={showDemoAccounts} onOpenChange={setShowDemoAccounts}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8">
          {/* Header */}
          <DialogHeader className="pb-6 sm:pb-8 border-b border-gray-200">
            <DialogTitle className="flex items-center justify-start gap-2 sm:gap-3 text-indigo-900 text-xl sm:text-2xl">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
              Demo User Accounts
            </DialogTitle>
            <DialogDescription className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600">
              Click "Use Credentials" to auto-fill the login form, or copy individual credentials.
            </DialogDescription>
          </DialogHeader>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 py-6 sm:py-8">
            {demoAccounts.map((account, index) => (
              <div
                key={index}
                className={`${account.bgClass} border-2 rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col h-full`}
              >
                {/* Account Info */}
                <div className="mb-4 sm:mb-5 lg:mb-6">
                  <div className={`inline-flex items-center justify-center px-2.5 py-1 sm:px-3 sm:py-1.5 ${account.badgeClass} rounded-lg text-xs mb-3 sm:mb-4`}>
                    {account.badgeId}
                  </div>
                  <h3 className="text-gray-900 text-sm sm:text-base mb-1.5 sm:mb-2 leading-tight">{account.role}</h3>
                  <p className="text-gray-700 text-xs sm:text-sm mb-1 leading-snug">{account.name}</p>
                  <p className="text-gray-500 text-xs leading-snug">{account.department}</p>
                </div>

                {/* Credentials */}
                <div className="space-y-3 sm:space-y-4 flex-1 mb-4 sm:mb-5 lg:mb-6">
                  {/* Email */}
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 leading-none">Email</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-white/70 border border-gray-300 rounded-lg p-2 sm:p-2.5 lg:p-3 min-h-[40px] sm:min-h-[44px]">
                      <code className="text-[10px] sm:text-xs font-mono text-gray-800 flex-1 select-all break-all leading-relaxed overflow-hidden">
                        {account.email}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(account.email, `${account.email}-email`)}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors shrink-0 flex items-center justify-center"
                        title="Copy email"
                      >
                        {copiedEmail === `${account.email}-email` ? (
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs text-gray-600 leading-none">Password</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 bg-white/70 border border-gray-300 rounded-lg p-2 sm:p-2.5 lg:p-3 min-h-[40px] sm:min-h-[44px]">
                      <code className="text-[10px] sm:text-xs font-mono text-gray-800 flex-1 select-all leading-relaxed overflow-hidden">
                        {account.password}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(account.password, `${account.email}-password`)}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors shrink-0 flex items-center justify-center"
                        title="Copy password"
                      >
                        {copiedEmail === `${account.email}-password` ? (
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Use Button */}
                <button
                  type="button"
                  onClick={() => useCredentials(account)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors text-xs sm:text-sm flex items-center justify-center min-h-[44px] sm:min-h-[48px]"
                >
                  Use Credentials
                </button>
              </div>
            ))}
          </div>

          {/* Footer - Role Permissions */}
          <div className="border-t border-gray-200 pt-6 sm:pt-8">
            <h4 className="text-sm sm:text-base text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
              Role Permissions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              <div className="flex gap-2.5 sm:gap-3 items-start">
                <span className="text-emerald-600 text-lg sm:text-xl leading-none mt-0.5 flex-shrink-0">●</span>
                <div className="min-w-0">
                  <div className="text-gray-900 text-sm sm:text-base leading-tight">Administrator</div>
                  <div className="text-gray-600 text-xs mt-1 leading-relaxed">Manage users only</div>
                </div>
              </div>
              <div className="flex gap-2.5 sm:gap-3 items-start">
                <span className="text-blue-600 text-lg sm:text-xl leading-none mt-0.5 flex-shrink-0">●</span>
                <div className="min-w-0">
                  <div className="text-gray-900 text-sm sm:text-base leading-tight">Police Officer</div>
                  <div className="text-gray-600 text-xs mt-1 leading-relaxed">Upload, share to Forensics</div>
                </div>
              </div>
              <div className="flex gap-2.5 sm:gap-3 items-start">
                <span className="text-purple-600 text-lg sm:text-xl leading-none mt-0.5 flex-shrink-0">●</span>
                <div className="min-w-0">
                  <div className="text-gray-900 text-sm sm:text-base leading-tight">Forensics Specialist</div>
                  <div className="text-gray-600 text-xs mt-1 leading-relaxed">Upload, share to Prosecutors</div>
                </div>
              </div>
              <div className="flex gap-2.5 sm:gap-3 items-start">
                <span className="text-indigo-600 text-lg sm:text-xl leading-none mt-0.5 flex-shrink-0">●</span>
                <div className="min-w-0">
                  <div className="text-gray-900 text-sm sm:text-base leading-tight">Prosecutor</div>
                  <div className="text-gray-600 text-xs mt-1 leading-relaxed">Verify and download only</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
