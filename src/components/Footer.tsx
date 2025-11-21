import { Shield, Database } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900/80 backdrop-blur-xl border-t border-blue-500/30 px-8 py-4 flex-shrink-0 shadow-lg shadow-blue-500/10">
      <div className="flex items-center justify-between">
        {/* Copyright */}
        <div className="text-blue-300 text-sm">
          © 2025 ChainGuard - Secure Digital Evidence Platform
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-4 text-xs text-blue-400">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>Database Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>Blockchain Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}