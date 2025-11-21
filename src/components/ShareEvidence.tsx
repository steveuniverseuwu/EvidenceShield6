import { useState, useEffect } from "react";
import { Share2, FileText, Send, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Folder, FolderOpen, Search, X } from "lucide-react";
import { User } from "../App";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface EvidenceFile {
  id: string;
  caseNumber: string;
  fileName: string;
  description?: string;
  uploadedBy: string;
  timestamp: string;
}

interface ShareEvidenceProps {
  currentUser: User;
}

export function ShareEvidence({ currentUser }: ShareEvidenceProps) {
  const [myFiles, setMyFiles] = useState<EvidenceFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [openCases, setOpenCases] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Determine recipient based on role
  const getRecipientOptions = () => {
    if (currentUser.role === "Police Officer") {
      return [
        { email: "forensics@lab.gov", name: "Dr. Sarah Johnson (Forensics)" },
        { email: "forensics2@lab.gov", name: "Dr. Robert Chen (Forensics)" },
      ];
    }
    if (currentUser.role === "Forensics Specialist") {
      return [
        { email: "prosecutor@da.gov", name: "Michael Brown (Prosecutor)" },
        { email: "prosecutor2@da.gov", name: "Jessica Martinez (Prosecutor)" },
      ];
    }
    return [];
  };

  const recipientOptions = getRecipientOptions();

  useEffect(() => {
    fetchMyFiles();
  }, []);

  const fetchMyFiles = async () => {
    try {
      // Fetch all evidence (uploaded + shared)
      // Use get-evidence endpoint which returns all files available to the user
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-evidence?userEmail=${currentUser.email}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMyFiles(data.files || []);
      } else {
        console.warn("Failed to fetch files:", response.status);
        setMyFiles([]);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setMyFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === myFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(myFiles.map(file => file.id));
    }
  };

  const toggleCase = (caseNumber: string) => {
    setOpenCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseNumber)) {
        newSet.delete(caseNumber);
      } else {
        newSet.add(caseNumber);
      }
      return newSet;
    });
  };

  const toggleSelectCase = (caseNumber: string) => {
    const caseFileIds = filesByCase[caseNumber].map(file => file.id);
    const allCaseFilesSelected = caseFileIds.every(id => selectedFiles.includes(id));
    
    if (allCaseFilesSelected) {
      // Deselect all files in this case
      setSelectedFiles(prev => prev.filter(id => !caseFileIds.includes(id)));
    } else {
      // Select all files in this case
      setSelectedFiles(prev => [...new Set([...prev, ...caseFileIds])]);
    }
  };

  // Filter files based on search query
  const filteredFiles = myFiles.filter(file => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      file.fileName.toLowerCase().includes(query) ||
      file.caseNumber.toLowerCase().includes(query) ||
      file.description?.toLowerCase().includes(query)
    );
  });

  // Group filtered files by case number
  const filesByCase = filteredFiles.reduce((acc, file) => {
    if (!acc[file.caseNumber]) {
      acc[file.caseNumber] = [];
    }
    acc[file.caseNumber].push(file);
    return acc;
  }, {} as Record<string, EvidenceFile[]>);

  const caseNumbers = Object.keys(filesByCase).sort();

  // Auto-expand cases when searching
  useEffect(() => {
    if (searchQuery.trim() && caseNumbers.length > 0) {
      setOpenCases(new Set(caseNumbers));
    }
  }, [searchQuery, caseNumbers]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0 || !recipientEmail) {
      setShareStatus({
        type: "error",
        message: "Please select at least one file and a recipient",
      });
      return;
    }

    setSharing(true);
    setShareStatus({ type: null, message: "" });

    try {
      const fileCount = selectedFiles.length;
      
      // Use single-file endpoint for 1 file, batch endpoint for 2+ files
      if (fileCount === 1) {
        // Single file share - use original endpoint
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/share-evidence`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileId: selectedFiles[0],
              sharedBy: currentUser.email,
              sharedWith: recipientEmail,
              sharerName: currentUser.name,
              sharerRole: currentUser.role,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to share file");
        }

        await response.json(); // Consume response
        
        setShareStatus({
          type: "success",
          message: `File shared successfully with ${recipientEmail}`,
        });
      } else {
        // Multiple files - use batch endpoint (ONE blockchain transaction)
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/share-batch-evidence`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileIds: selectedFiles,
              sharedBy: currentUser.email,
              sharedWith: recipientEmail,
              sharerName: currentUser.name,
              sharerRole: currentUser.role,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to share files");
        }

        await response.json(); // Consume response
        
        setShareStatus({
          type: "success",
          message: `${fileCount} files shared successfully with ${recipientEmail} (Gas-optimized: 1 blockchain transaction)`,
        });
      }

      // Reset form
      setSelectedFiles([]);
      setRecipientEmail("");
    } catch (error) {
      console.error("Share error:", error);
      setShareStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Sharing failed. Please try again.",
      });
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-300 animate-spin mx-auto mb-4" />
          <p className="text-blue-300">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 shadow-lg shadow-blue-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/50">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-blue-100">Share Evidence</h2>
            <p className="text-blue-300 text-sm">
              {currentUser.role === "Police Officer"
                ? "Share evidence files with Forensics Specialists"
                : "Share evidence files with Prosecutors"}
            </p>
          </div>
        </div>
      </div>

      {/* Share Form */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 shadow-lg shadow-blue-500/20 rounded-xl p-6">
        {myFiles.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-blue-100 mb-2">No Files to Share</h3>
            <p className="text-blue-300">
              You need to upload evidence files before you can share them.
            </p>
          </div>
        ) : (
          <form onSubmit={handleShare} className="space-y-6">
            {/* Select Files */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-blue-100">
                  Select Evidence Files <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-300 hover:text-blue-200 font-medium"
                  disabled={sharing}
                >
                  {selectedFiles.length === myFiles.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                  <input
                    type="text"
                    placeholder="Search by file name, case number, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={sharing}
                    className="w-full pl-9 pr-9 py-2 bg-slate-800/60 border border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-100 placeholder-indigo-400 text-sm disabled:bg-blue-900/40 disabled:cursor-not-allowed"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      disabled={sharing}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="mt-2 text-xs text-blue-300">
                    Found {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} in {caseNumbers.length} case{caseNumbers.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="bg-slate-800/60 border border-blue-500/30 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                {filteredFiles.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-blue-300 text-sm">
                      {searchQuery ? `No files match "${searchQuery}"` : "No files available"}
                    </p>
                  </div>
                ) : (
                <div className="space-y-2 p-2">
                  {caseNumbers.map((caseNumber) => {
                    const caseFiles = filesByCase[caseNumber];
                    const isOpen = openCases.has(caseNumber);
                    const caseFileIds = caseFiles.map(file => file.id);
                    const allCaseFilesSelected = caseFileIds.every(id => selectedFiles.includes(id));
                    const someCaseFilesSelected = caseFileIds.some(id => selectedFiles.includes(id)) && !allCaseFilesSelected;
                    
                    return (
                      <Collapsible
                        key={caseNumber}
                        open={isOpen}
                        onOpenChange={() => toggleCase(caseNumber)}
                      >
                        <div className="bg-slate-800/60 border border-blue-500/30 rounded-lg overflow-hidden">
                          {/* Case Folder Header */}
                          <div className="flex items-center gap-2 p-3 bg-blue-900/40 hover:bg-blue-900/60 transition-colors">
                            <input
                              type="checkbox"
                              checked={allCaseFilesSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someCaseFilesSelected;
                              }}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelectCase(caseNumber);
                              }}
                              disabled={sharing}
                              className="w-4 h-4 text-blue-300 border-blue-500/30 rounded focus:ring-blue-500"
                            />
                            <CollapsibleTrigger className="flex-1 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2">
                                {isOpen ? (
                                  <FolderOpen className="w-5 h-5 text-blue-300" />
                                ) : (
                                  <Folder className="w-5 h-5 text-blue-300" />
                                )}
                                <span className="text-blue-100 font-semibold">
                                  Case {caseNumber}
                                </span>
                                <span className="text-sm text-blue-300">
                                  ({caseFiles.length} file{caseFiles.length > 1 ? 's' : ''})
                                </span>
                              </div>
                              {isOpen ? (
                                <ChevronDown className="w-4 h-4 text-blue-300" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-blue-300" />
                              )}
                            </CollapsibleTrigger>
                          </div>

                          {/* Case Files */}
                          <CollapsibleContent>
                            <div className="border-t border-blue-500/30">
                              {caseFiles.map((file) => (
                                <label
                                  key={file.id}
                                  className={`flex items-start gap-3 p-3 pl-8 hover:bg-blue-900/40 cursor-pointer transition-colors border-b border-blue-500/20 last:border-b-0 ${
                                    selectedFiles.includes(file.id) ? 'bg-blue-900/40' : 'bg-slate-800/40'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => toggleFileSelection(file.id)}
                                    disabled={sharing}
                                    className="mt-1 w-4 h-4 text-blue-300 border-blue-500/30 rounded focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <FileText className="w-4 h-4 text-blue-300 flex-shrink-0" />
                                      <span className="text-blue-100 font-medium truncate">{file.fileName}</span>
                                    </div>
                                    <div className="text-sm text-blue-300">
                                      {new Date(file.timestamp).toLocaleDateString()}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
                )}
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-2 text-sm text-blue-300">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            {/* Select Recipient */}
            <div>
              <label className="block text-blue-100 mb-2">
                Share With <span className="text-red-500">*</span>
              </label>
              <select
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/60 border border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-100 [&>option]:bg-slate-800 [&>option]:text-blue-100"
                disabled={sharing}
              >
                <option value="" className="bg-slate-800 text-blue-100">Select recipient...</option>
                {recipientOptions.map((option) => (
                  <option key={option.email} value={option.email} className="bg-slate-800 text-blue-100">
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Message */}
            {shareStatus.type && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  shareStatus.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {shareStatus.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div
                  className={`text-sm ${
                    shareStatus.type === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {shareStatus.message}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sharing}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sharing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sharing Evidence...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Share Evidence
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="mb-2">
              When you share evidence, the recipient will be able to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>View the evidence file and all its metadata</li>
              <li>Verify the evidence on the blockchain</li>
              <li>Download the file from IPFS</li>
              <li>
                {currentUser.role === "Police Officer"
                  ? "Share it further with Prosecutors (Forensics only)"
                  : "Use it in legal proceedings"}
              </li>
            </ul>
            <p className="mt-3 text-blue-700">
              All sharing actions are recorded on the blockchain audit trail for full transparency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
