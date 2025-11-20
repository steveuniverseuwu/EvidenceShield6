import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, XCircle, Activity, FileText, Database, Lock, User as UserIcon } from "lucide-react";
import { User } from "../App";

interface TamperDetectionDemoProps {
  currentUser: User;
}

interface TamperAlert {
  id: string;
  timestamp: Date;
  type: "hash_modified" | "content_modified" | "file_corrupted" | "unauthorized_access";
  severity: "critical" | "high" | "medium";
  fileName?: string;
  caseNumber?: string;
  originalHash?: string;
  newHash?: string;
  actor?: string;
  description: string;
  status: "active" | "resolved";
}

export function TamperDetectionDemo({ currentUser: _currentUser }: TamperDetectionDemoProps) {
  const [alerts, setAlerts] = useState<TamperAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    critical: 0,
    resolved: 0,
    monitored: 0,
  });

  // Simulate tamper detection alerts
  useEffect(() => {
    if (!isMonitoring) return;

    const tamperScenarios = [
      {
        type: "hash_modified" as const,
        severity: "critical" as const,
        fileName: "evidence_photo_001.jpg",
        caseNumber: "CASE-2024-001",
        originalHash: "a1b2c3d4e5f6789...",
        newHash: "x9y8z7w6v5u4321...",
        actor: "unknown@external.com",
        description: "File hash mismatch detected! Original hash does not match current hash in database.",
      },
      {
        type: "content_modified" as const,
        severity: "critical" as const,
        fileName: "witness_statement.pdf",
        caseNumber: "CASE-2024-045",
        actor: "unauthorized_user",
        description: "Direct database modification detected in file_content table. Content altered without proper audit trail.",
      },
      {
        type: "file_corrupted" as const,
        severity: "high" as const,
        fileName: "surveillance_video.mp4",
        caseNumber: "CASE-2024-089",
        description: "File integrity check failed. Evidence file appears to be corrupted or incomplete.",
      },
      {
        type: "unauthorized_access" as const,
        severity: "high" as const,
        fileName: "forensic_report.docx",
        caseNumber: "CASE-2024-023",
        actor: "john.doe@external.com",
        description: "Unauthorized access attempt detected. User without proper credentials tried to modify evidence.",
      },
      {
        type: "hash_modified" as const,
        severity: "critical" as const,
        fileName: "digital_evidence.zip",
        caseNumber: "CASE-2024-112",
        originalHash: "f7e8d9c0b1a2345...",
        newHash: "k3l4m5n6o7p8901...",
        actor: "compromised_account",
        description: "Hash tampering detected! Evidence integrity compromised - blockchain verification failed.",
      },
    ];

    // Generate random alerts at intervals
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to generate an alert
        const scenario = tamperScenarios[Math.floor(Math.random() * tamperScenarios.length)];
        const newAlert: TamperAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          ...scenario,
          status: "active",
        };

        setAlerts(prev => [newAlert, ...prev].slice(0, 20)); // Keep last 20 alerts
        setStats(prev => ({
          ...prev,
          totalAlerts: prev.totalAlerts + 1,
          critical: scenario.severity === "critical" ? prev.critical + 1 : prev.critical,
          monitored: prev.monitored + 1,
        }));
      }
    }, 8000); // Every 8 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const resolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status: "resolved" } : alert
      )
    );
    setStats(prev => ({
      ...prev,
      resolved: prev.resolved + 1,
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hash_modified":
        return Lock;
      case "content_modified":
        return Database;
      case "file_corrupted":
        return XCircle;
      case "unauthorized_access":
        return UserIcon;
      default:
        return AlertTriangle;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "hash_modified":
        return "Hash Modified";
      case "content_modified":
        return "Content Modified";
      case "file_corrupted":
        return "File Corrupted";
      case "unauthorized_access":
        return "Unauthorized Access";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tamper Detection Monitor</h1>
              <p className="text-gray-600">Real-time evidence integrity monitoring (Demo Mode)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-lg border-2 ${isMonitoring ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-semibold ${isMonitoring ? 'text-green-700' : 'text-gray-600'}`}>
                  {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                isMonitoring
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isMonitoring ? 'Pause Monitoring' : 'Resume Monitoring'}
            </button>
          </div>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800 text-sm">
              <strong>Demo Mode:</strong> This is a simulation of real-time tamper detection. Alerts are generated randomly and are not stored in the database. Refresh the page to reset.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Alerts</div>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalAlerts}</div>
          <div className="text-gray-500 text-sm mt-1">Since monitoring started</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-red-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-red-600 text-sm font-semibold uppercase tracking-wide">Critical</div>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.critical}</div>
          <div className="text-gray-500 text-sm mt-1">Require immediate action</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-600 text-sm font-semibold uppercase tracking-wide">Resolved</div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.resolved}</div>
          <div className="text-gray-500 text-sm mt-1">Threats mitigated</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border-2 border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Active</div>
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{alerts.filter(a => a.status === 'active').length}</div>
          <div className="text-gray-500 text-sm mt-1">Pending investigation</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Tamper Detection Alerts
          </h2>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No tamper alerts detected</p>
              <p className="text-gray-400 text-sm mt-2">All evidence integrity checks passed</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const TypeIcon = getTypeIcon(alert.type);
              const isResolved = alert.status === "resolved";

              return (
                <div
                  key={alert.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${isResolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 flex-shrink-0 ${
                      isResolved ? 'bg-green-50 border-green-200' : getSeverityColor(alert.severity)
                    }`}>
                      {isResolved ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <TypeIcon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              isResolved ? 'bg-green-100 text-green-700' : getSeverityColor(alert.severity)
                            }`}>
                              {isResolved ? 'Resolved' : alert.severity}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 uppercase">
                              {getTypeLabel(alert.type)}
                            </span>
                          </div>
                          <p className="text-gray-900 font-semibold text-lg">{alert.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-gray-500 text-sm">
                            {alert.timestamp.toLocaleTimeString()}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {alert.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {alert.fileName && (
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">File Name</div>
                            <div className="text-gray-900 font-medium flex items-center gap-1">
                              <FileText className="w-4 h-4 text-gray-400" />
                              {alert.fileName}
                            </div>
                          </div>
                        )}
                        {alert.caseNumber && (
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Case Number</div>
                            <div className="text-gray-900 font-medium">{alert.caseNumber}</div>
                          </div>
                        )}
                        {alert.actor && (
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Suspicious Actor</div>
                            <div className="text-red-600 font-medium">{alert.actor}</div>
                          </div>
                        )}
                        {alert.originalHash && (
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Original Hash</div>
                            <div className="text-gray-900 font-mono text-xs">{alert.originalHash}</div>
                          </div>
                        )}
                        {alert.newHash && (
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">New Hash</div>
                            <div className="text-red-600 font-mono text-xs">{alert.newHash}</div>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      {!isResolved && (
                        <div className="mt-4">
                          <button
                            onClick={() => resolveAlert(alert.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors"
                          >
                            Mark as Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
