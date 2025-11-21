import { useState, useEffect, useMemo } from "react";
import { Activity, FileText, Share2, Upload, ExternalLink, Loader2, AlertCircle, CheckCircle, RefreshCw, Shield, Search } from "lucide-react";
import { User } from "../App";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AuditEvent {
  id: string;
  eventType: "upload" | "share" | "verify" | "download" | "batch_upload" | "batch_share";
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
  const [allEvents, setAllEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch all events only once on mount
  useEffect(() => {
    fetchAuditTrail();
  }, []); // No dependencies - only fetch once

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditTrail();
    setRefreshing(false);
  };

  const fetchAuditTrail = async () => {
    try {
      // Always fetch ALL events, filter on client side
      const url = currentUser.role === "Administrator"
        ? `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-audit-trail?filter=all`
        : `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-audit-trail?userEmail=${currentUser.email}&filter=all`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAllEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching audit trail:", error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and searching - instant, no network calls
  const events = useMemo(() => {
    let filtered = allEvents;
    
    // Apply type filter
    if (filter !== "all") {
      // Handle special case for "upload" filter matching "uploaded" action
      if (filter === "upload") {
        filtered = filtered.filter(event => 
          event.eventType === "upload" || 
          (event as any).action === "uploaded"
        );
      } else if (filter === "tampered") {
        // Filter for tampered/failed verifications
        filtered = filtered.filter(event => 
          event.eventType === "verify" && 
          (event.zkpVerified === false || event.details?.toLowerCase().includes('failed') || event.details?.toLowerCase().includes('tampered'))
        );
      } else {
        filtered = filtered.filter(event => event.eventType === filter);
      }
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.fileName?.toLowerCase().includes(query) ||
        event.caseNumber?.toLowerCase().includes(query) ||
        event.performerName?.toLowerCase().includes(query) ||
        event.performerRole?.toLowerCase().includes(query) ||
        event.performedBy?.toLowerCase().includes(query) ||
        event.details?.toLowerCase().includes(query) ||
        event.txHash?.toLowerCase().includes(query) ||
        event.merkleRoot?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allEvents, filter, searchQuery]);

  const getEventIcon = (type: string, event?: AuditEvent) => {
    switch (type) {
      case "upload":
        return <Upload className="w-5 h-5 text-blue-600" />;
      case "batch_upload":
        return <Upload className="w-5 h-5 text-purple-600" />;
      case "share":
        return <Share2 className="w-5 h-5 text-purple-600" />;
      case "batch_share":
        return <Share2 className="w-5 h-5 text-purple-600" />;
      case "verify":
        // Show red X icon for failed verification, green check for success
        // Check for explicit false OR check details field for "failed"
        if (event && (event.zkpVerified === false || event.details?.toLowerCase().includes('failed'))) {
          return <AlertCircle className="w-5 h-5 text-red-600" />;
        }
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "download":
        return <FileText className="w-5 h-5 text-indigo-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: string, event?: AuditEvent) => {
    switch (type) {
      case "upload":
        return "border-blue-500/30 bg-slate-900/60";
      case "batch_upload":
        return "border-purple-500/30 bg-slate-900/60";
      case "share":
        return "border-purple-500/30 bg-slate-900/60";
      case "batch_share":
        return "border-purple-500/30 bg-slate-900/60";
      case "verify":
        // Show red background for failed verification
        // Check for explicit false OR check details field for "failed"
        if (event && (event.zkpVerified === false || event.details?.toLowerCase().includes('failed'))) {
          return "border-red-500/30 bg-red-950/40";
        }
        return "border-green-500/30 bg-slate-900/60";
      case "download":
        return "border-indigo-500/30 bg-slate-900/60";
      default:
        return "border-blue-500/20 bg-slate-900/60";
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
      case "batch_share":
        // Show different label if user is the recipient
        if (event && event.details?.includes(`with ${currentUser.email}`)) {
          return "Batch Evidence Received (Merkle Tree)";
        }
        return "Batch Evidence Shared (Merkle Tree)";
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
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-blue-300">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-lg shadow-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/50">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-blue-100 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">Blockchain Audit Trail</h2>
              <p className="text-blue-300 text-sm">
                Immutable record of all evidence-related activities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30"
              title="Refresh audit trail"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
            <div className="text-right">
              <div className="text-blue-100 font-bold">{events.length}</div>
              <div className="text-blue-300 text-sm">Total Events</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by file name, case number, user name, TX hash, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-800/60 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-100 placeholder-blue-400/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-2 bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 rounded-lg transition-colors text-sm"
            >
              Clear
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-blue-300">
            Found {events.length} result{events.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-3">
          <span className="text-blue-100">Filter:</span>
          <div className="flex gap-2 flex-wrap">
            {["all", "upload", "batch_upload", "share", "batch_share", "verify", "tampered", "download"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filter === filterType
                    ? filterType === "tampered"
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                    : filterType === "tampered"
                    ? "bg-red-900/40 text-red-200 hover:bg-red-800/60 border border-red-500/30"
                    : "bg-blue-900/40 text-blue-200 hover:bg-blue-800/60 border border-blue-500/30"
                }`}
              >
                {filterType === "batch_upload" 
                  ? "Batch Uploads" 
                  : filterType === "batch_share"
                  ? "Batch Shares"
                  : filterType === "tampered"
                  ? "Tampered"
                  : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4 shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-5 h-5 text-blue-400" />
            <span className="text-blue-100">Uploads</span>
          </div>
          <div className="text-blue-300 text-2xl font-bold drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
            {events.filter((e) => e.eventType === "upload" || e.eventType === "batch_upload").length}
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-lg shadow-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            <span className="text-purple-100">Shares</span>
          </div>
          <div className="text-purple-300 text-2xl font-bold drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]">
            {events.filter((e) => e.eventType === "share" || e.eventType === "batch_share").length}
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 shadow-lg shadow-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-100">Verifications</span>
          </div>
          <div className="text-green-300 text-2xl font-bold drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
            {events.filter((e) => e.eventType === "verify").length}
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-xl p-4 shadow-lg shadow-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-100">Tampered</span>
          </div>
          <div className="text-red-300 text-2xl font-bold drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">
            {events.filter((e) => e.eventType === "verify" && (e.zkpVerified === false || e.details?.toLowerCase().includes('failed') || e.details?.toLowerCase().includes('tampered'))).length}
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 rounded-xl p-4 shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-100">Downloads</span>
          </div>
          <div className="text-indigo-300 text-2xl font-bold drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]">
            {events.filter((e) => e.eventType === "download").length}
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      {events.length === 0 ? (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-xl p-12 text-center shadow-lg shadow-blue-500/20">
          <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-blue-100 mb-2">No Audit Events</h3>
          <p className="text-blue-300">
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
              className={`backdrop-blur-xl border rounded-xl p-5 shadow-lg ${getEventColor(
                event.eventType,
                event
              )}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-900/40 border border-blue-500/30 flex items-center justify-center">
                  {getEventIcon(event.eventType, event)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`${
                          event.eventType === "verify" && (event.zkpVerified === false || event.details?.toLowerCase().includes('failed'))
                            ? 'text-red-300' 
                            : 'text-blue-100'
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
                      <p className="text-blue-300 text-sm">
                        {event.eventType === "batch_upload" || event.eventType === "batch_share"
                          ? `${event.fileCount} files • Case: ${event.caseNumber}`
                          : `${event.fileName} • Case: ${event.caseNumber}`}
                      </p>
                      {event.eventType === "verify" && event.localFileName && (
                        <p className="text-indigo-500 text-xs mt-0.5">
                          Local file: {event.localFileName}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-blue-300">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-sm text-blue-200">
                    <span className="text-blue-300">
                      {event.eventType === "share" && event.details?.includes(`with: ${currentUser.email}`)
                        ? "Shared by:"
                        : "Performed by:"}
                    </span> {event.performerName} ({event.performerRole})
                  </div>

                  {event.details && (
                    <div className="text-sm text-blue-200">
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
                    <span className="text-blue-300">Blockchain TX:</span>
                    <code className="text-blue-200 bg-slate-800/60 px-2 py-1 rounded text-xs flex-1 truncate border border-blue-500/30">
                      {event.txHash}
                    </code>
                    <a
                      href={`https://polygonscan.com/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-300 hover:text-blue-200 flex items-center gap-1"
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
            <div className="text-sm text-purple-200">
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
