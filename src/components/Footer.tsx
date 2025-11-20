import { Shield, Database } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-indigo-200 px-8 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Copyright */}
        <div className="text-indigo-600 text-sm">
          © 2025 EvidenceShield - Secure Digital Evidence Platform
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-4 text-xs text-indigo-500">
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