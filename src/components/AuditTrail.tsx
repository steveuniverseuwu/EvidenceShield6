import { useState, useEffect } from "react";
import { Activity, FileText, Share2, Upload, ExternalLink, Loader2, AlertCircle, CheckCircle, RefreshCw, Shield } from "lucide-react";
import { User } from "../App";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AuditEvent {
  id: string;
  eventType: "upload" | "share" | "verify" | "download" | "batch_upload";
  fileId?: string;
  fileName?: string;
  caseNumber: string;
  performedBy: string;
  performerName: string;
  performerRole: string;
  txHash: string;
  timestamp: string;
  details?: string;
  batchId?: string;
  fileCount?: number;
  merkleRoot?: string;
  zkpProofId?: string;
  zkpVerified?: boolean;
  verificationType?: 'ipfs' | 'local';
  localFileName?: string;
}

interface AuditTrailProps {
  currentUser: User;
}

export function AuditTrail({ currentUser }: AuditTrailProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchAuditTrail();
  }, [filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditTrail();
    setRefreshing(false);
  };

  const fetchAuditTrail = async () => {
    try {
      const url = currentUser.role === "Administrator"
        ? `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-audit-trail?filter=${filter}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-audit-trail?userEmail=${currentUser.email}&filter=${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching audit trail:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string, event?: AuditEvent) => {
    switch (type) {
      case "upload":
        return <Upload className="w-5 h-5 text-blue-600" />;
      case "batch_upload":
        return <Upload className="w-5 h-5 text-purple-600" />;
      case "share":
        return <Share2 className="w-5 h-5 text-purple-600" />;
      case "verify":
        // Show red X icon for failed verification, green check for success
        // Check for explicit false OR check details field for "failed"
        if (event && (event.zkpVerified === false || event.details?.toLowerCase().includes('failed'))) {
          return <AlertCircle className="w-5 h-5 text-red-600" />;
        }
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "download":
        return <FileText className="w-5 h-5 text-indigo-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: string, event?: AuditEvent) => {
    switch (type) {
      case "upload":
        return "bg-blue-50 border-blue-200";
      case "batch_upload":
        return "bg-purple-50 border-purple-200";
      case "share":
        return "bg-purple-50 border-purple-200";
      case "verify":
        // Show red background for failed verification
        // Check for explicit false OR check details field for "failed"
        if (event && (event.zkpVerified === false || event.details?.toLowerCase().includes('failed'))) {
          return "bg-red-50 border-red-200";
        }
        return "bg-green-50 border-green-200";
      case "download":
        return "bg-indigo-50 border-indigo-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getEventLabel = (type: string, event?: AuditEvent) => {
    switch (type) {
      case "upload":
        return "Evidence Uploaded";
      case "batch_upload":
        return "Batch Upload (Merkle Tree)";
      case "share":
        // Show different label if user is the recipient
        if (event && event.details?.includes(`with: ${currentUser.email}`)) {
          return "Evidence Received";
        }
        return "Evidence Shared";
      case "verify":
        // Show different label based on verification result
        // Check for explicit false OR check details field for "failed"
        if (event && (event.zkpVerified === false || event.details?.toLowerCase().includes('failed'))) {
          return "Evidence Verification Failed - Tampered";
        }
        return "Evidence Verified";
      case "download":
        return "Evidence Downloaded";
      default:
        return "Activity";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-indigo-600">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-indigo-900">Blockchain Audit Trail</h2>
              <p className="text-indigo-600 text-sm">
                Immutable record of all evidence-related activities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh audit trail"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
            <div className="text-right">
              <div className="text-indigo-900">{events.length}</div>
              <div className="text-indigo-600 text-sm">Total Events</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-indigo-900">Filter:</span>
          <div className="flex gap-2 flex-wrap">
            {["all", "upload", "batch_upload", "share", "verify", "download"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === filterType
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {filterType === "batch_upload" 
                  ? "Batch Uploads" 
                  : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900">Uploads</span>
          </div>
          <div className="text-blue-600 text-2xl">
            {events.filter((e) => e.eventType === "upload" || e.eventType === "batch_upload").length}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            <span className="text-purple-900">Shares</span>
          </div>
          <div className="text-purple-600 text-2xl">
            {events.filter((e) => e.eventType === "share").length}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-900">Verifications</span>
          </div>
          <div className="text-green-600 text-2xl">
            {events.filter((e) => e.eventType === "verify").length}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="text-indigo-900">Downloads</span>
          </div>
          <div className="text-indigo-600 text-2xl">
            {events.filter((e) => e.eventType === "download").length}
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      {events.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
          <h3 className="text-indigo-900 mb-2">No Audit Events</h3>
          <p className="text-indigo-600">
            {filter === "all"
              ? "No activities have been recorded yet."
              : `No ${filter} activities found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className={`bg-white/80 backdrop-blur-sm border rounded-xl p-5 shadow-sm ${getEventColor(
                event.eventType,
                event
              )}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  {getEventIcon(event.eventType, event)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`${
                          event.eventType === "verify" && (event.zkpVerified === false || event.details?.toLowerCase().includes('failed'))
                            ? 'text-red-900' 
                            : 'text-indigo-900'
                        }`}>
                          {getEventLabel(event.eventType, event)}
                        </h3>
                        {event.eventType === "verify" && event.verificationType && (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            event.verificationType === 'local' 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {event.verificationType === 'local' ? '📁 Local' : '🌐 IPFS'}
                          </span>
                        )}
                      </div>
                      <p className="text-indigo-600 text-sm">
                        {event.eventType === "batch_upload" 
                          ? `${event.fileCount} files • Case: ${event.caseNumber}`
                          : `${event.fileName} • Case: ${event.caseNumber}`}
                      </p>
                      {event.eventType === "verify" && event.localFileName && (
                        <p className="text-indigo-500 text-xs mt-0.5">
                          Local file: {event.localFileName}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-indigo-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-sm text-indigo-700">
                    <span className="text-indigo-600">
                      {event.eventType === "share" && event.details?.includes(`with: ${currentUser.email}`)
                        ? "Shared by:"
                        : "Performed by:"}
                    </span> {event.performerName} ({event.performerRole})
                  </div>

                  {event.details && (
                    <div className="text-sm text-indigo-700">
                      {event.eventType === "share" && event.details?.includes(`with: ${currentUser.email}`)
                        ? `File shared from ${event.performerRole}`
                        : event.details}
                    </div>
                  )}

                  {/* ZKP Proof Badge */}
                  {event.zkpProofId && (
                    <div className="flex items-center gap-2 text-sm bg-purple-50 -mx-1 px-2 py-1.5 rounded">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700">Zero-Knowledge Proof:</span>
                      <code className="text-purple-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate">
                        {event.zkpProofId}
                      </code>
                      {event.eventType === "verify" && (
                        // Check zkpVerified OR details field for failed status
                        (event.zkpVerified === false || event.details?.toLowerCase().includes('failed')) ? (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            ✗ Tampered
                          </span>
                        ) : event.zkpVerified === true || event.details?.toLowerCase().includes('successful') ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            ✓ Verified
                          </span>
                        ) : null
                      )}
                    </div>
                  )}

                  {/* Merkle Root for batch uploads */}
                  {event.merkleRoot && (
                    <div className="flex items-center gap-2 text-sm bg-purple-50 -mx-1 px-2 py-1.5 rounded">
                      <span className="text-purple-700">🌳 Merkle Root:</span>
                      <code className="text-purple-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate">
                        {event.merkleRoot}
                      </code>
                    </div>
                  )}

                  {/* Blockchain TX */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-indigo-600">Blockchain TX:</span>
                    <code className="text-indigo-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate">
                      {event.txHash}
                    </code>
                    <a
                      href={`https://polygonscan.com/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Polygonscan</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="mb-2 font-semibold">
                Blockchain Audit Trail
              </p>
              <p className="mb-2">
                All activities are permanently recorded on the Polygon blockchain:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Evidence uploads with IPFS hash and metadata</li>
                <li>File sharing between departments and users</li>
                <li>Verification attempts and results</li>
                <li>Download activities for accountability</li>
              </ul>
              <p className="mt-3 text-blue-700">
                This creates a transparent, tamper-proof audit trail for legal proceedings.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <p className="mb-2 font-semibold">
                Zero-Knowledge Proofs (ZKP)
              </p>
              <p className="mb-2">
                Automatic cryptographic proof generation for evidence integrity:
              </p>
              <ul className="list-disc list-inside space-y-1 text-purple-800">
                <li>File hashing using SHA-256</li>
                <li>ZK-SNARK proof generation (Groth16)</li>
                <li>Proof stored on blockchain for verification</li>
                <li>Verify integrity without revealing content</li>
              </ul>
              <p className="mt-3 text-purple-700">
                ZKP ensures evidence authenticity while maintaining privacy and confidentiality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
