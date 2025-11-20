import { useState } from "react";
import { Shield, LogIn, Lock, Mail, Copy, Check } from "lucide-react";
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

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  error: string | null;
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

export function LoginPage({ onLogin, error }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

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
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-600 shadow-lg">
                <Shield className="w-9 h-9 text-white" />
              </div>
              <span className="text-gray-900 text-2xl">EvidenceShield</span>
            </div>

            {/* Login Heading */}
            <h1 className="text-gray-900 mb-2">Login</h1>
            
            {/* Demo Credentials Link */}
            <p className="text-gray-600 text-sm mb-6">
              Don't have credentials?{" "}
              <button
                type="button"
                onClick={() => setShowDemoAccounts(true)}
                className="text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                View Demo Accounts
              </button>
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-gray-700 text-sm mb-2 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 text-sm mb-2 block">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                  Remember Me
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-sm"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Log In
              </Button>
            </form>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline">
                Forgot Your Password?
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 sm:px-12 lg:px-16 py-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Copyright © 2025 EvidenceShield. EvidenceShield™ is a secure evidence management system. |{" "}
            <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> |{" "}
            <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 relative overflow-hidden">
        {/* Stars */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-1 h-1 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 left-40 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-32 right-32 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-60 right-60 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-80 left-60 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-60 right-40 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        </div>

        {/* Clouds at top */}
        <div className="absolute top-10 right-20">
          <div className="w-24 h-16 bg-indigo-700/40 rounded-full blur-xl"></div>
        </div>
        <div className="absolute top-16 left-32">
          <div className="w-32 h-20 bg-purple-700/40 rounded-full blur-xl"></div>
        </div>

        {/* Main Content Area */}
        <div className="absolute inset-x-0 bottom-0 h-2/3">
          {/* Mountains/Landscape - Left */}
          <div className="absolute bottom-0 left-0 w-80 h-96">
            <svg viewBox="0 0 320 384" className="w-full h-full">
              <defs>
                <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M0,384 L0,200 L100,100 L200,180 L0,384 Z" fill="url(#mountain1)" />
            </svg>
          </div>

          {/* Mountains/Landscape - Right */}
          <div className="absolute bottom-0 right-0 w-96 h-80">
            <svg viewBox="0 0 384 320" className="w-full h-full">
              <defs>
                <linearGradient id="mountain2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M384,320 L384,150 L250,50 L150,120 L384,320 Z" fill="url(#mountain2)" />
            </svg>
          </div>

          {/* Center Shield/Logo with Tagline */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-full flex flex-col items-center justify-center px-12 -mt-32">
              {/* Multi-layer Glow effects */}
              <div className="absolute -top-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
              <div className="absolute -top-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[80px] animate-pulse pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
              
              {/* Shield Container with Shadow */}
              <div className="relative mb-12 flex items-center justify-center">
                {/* Shield */}
                <div className="relative w-40 h-40 bg-gradient-to-br from-indigo-400 via-indigo-500 to-indigo-600 rounded-3xl shadow-[0_20px_60px_rgba(99,102,241,0.5)] flex items-center justify-center transform hover:scale-110 transition-all duration-500 hover:shadow-[0_25px_80px_rgba(99,102,241,0.7)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl pointer-events-none"></div>
                  <Shield className="w-20 h-20 text-white relative z-10 drop-shadow-lg" />
                </div>

                {/* Orbiting Lock */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500 rounded-2xl shadow-[0_15px_40px_rgba(6,182,212,0.5)] flex items-center justify-center animate-float">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl pointer-events-none"></div>
                  <Lock className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
                </div>

                {/* Decorative Rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-indigo-400/20 rounded-full animate-ping-slow pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-purple-400/10 rounded-full animate-ping-slower pointer-events-none"></div>
              </div>

              {/* Animated Tagline Section */}
              <div className="flex flex-col items-center justify-center space-y-6 w-full">
                {/* Main Heading */}
                <div className="flex flex-col items-center justify-center text-center animate-fade-in-up w-full" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
                  <h2 className="text-white text-[2.5rem] leading-[1.2] tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] text-center">
                    <span className="bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent block text-center">
                      Blockchain-Powered
                    </span>
                    <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent block mt-1 text-center">
                      Evidence
                    </span>
                  </h2>
                </div>

                {/* Subtitle */}
                <div className="flex flex-col items-center justify-center text-center animate-fade-in-up space-y-1 w-full" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
                  <p className="text-indigo-100 text-lg leading-[1.6] tracking-wide drop-shadow-md text-center w-full">
                    Secure, Transparent, Immutable
                  </p>
                  <p className="text-indigo-200/90 text-base leading-[1.6] tracking-wide drop-shadow-md text-center w-full">
                    Chain of Custody
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center gap-3 py-2 animate-fade-in-up w-full" style={{ animationDelay: '0.9s', opacity: 0, animationFillMode: 'forwards' }}>
                  <div className="h-px w-20 bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-300/80 rounded-full"></div>
                  <div className="h-px w-20 bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent"></div>
                </div>

                {/* Technology Badges */}
                <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up pt-2 w-full" style={{ animationDelay: '1.2s', opacity: 0, animationFillMode: 'forwards' }}>
                  {/* IPFS Badge */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
                    <div className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/15 transition-all duration-300 hover:scale-105 min-h-[40px]">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                      <span className="text-white text-sm leading-none tracking-wide drop-shadow-md whitespace-nowrap">IPFS Storage</span>
                    </div>
                  </div>

                  {/* Polygon Badge */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
                    <div className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/15 transition-all duration-300 hover:scale-105 min-h-[40px]">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" style={{ animationDelay: '0.3s' }}></div>
                      <span className="text-white text-sm leading-none tracking-wide drop-shadow-md whitespace-nowrap">Polygon Network</span>
                    </div>
                  </div>

                  {/* Web3 Badge */}
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none"></div>
                    <div className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full hover:bg-white/15 transition-all duration-300 hover:scale-105 min-h-[40px]">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" style={{ animationDelay: '0.6s' }}></div>
                      <span className="text-white text-sm leading-none tracking-wide drop-shadow-md whitespace-nowrap">Web3 Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Clouds */}
          <div className="absolute bottom-0 left-1/4 -translate-x-1/2">
            <svg viewBox="0 0 200 100" className="w-64 h-32">
              <ellipse cx="60" cy="70" rx="60" ry="30" fill="white" opacity="0.95" />
              <ellipse cx="100" cy="75" rx="70" ry="35" fill="white" opacity="0.95" />
              <ellipse cx="140" cy="70" rx="60" ry="30" fill="white" opacity="0.95" />
            </svg>
          </div>

          <div className="absolute bottom-0 right-1/4 translate-x-1/2">
            <svg viewBox="0 0 200 100" className="w-64 h-32">
              <ellipse cx="60" cy="70" rx="60" ry="30" fill="white" opacity="0.9" />
              <ellipse cx="100" cy="75" rx="70" ry="35" fill="white" opacity="0.9" />
              <ellipse cx="140" cy="70" rx="60" ry="30" fill="white" opacity="0.9" />
            </svg>
          </div>

          {/* Purple cloud overlay layer */}
          <div className="absolute bottom-12 left-1/3 w-48 h-24 bg-purple-600/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-16 right-1/3 w-56 h-28 bg-indigo-600/30 rounded-full blur-2xl"></div>
        </div>

        {/* Bottom blue layer */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-indigo-600 to-transparent"></div>
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
