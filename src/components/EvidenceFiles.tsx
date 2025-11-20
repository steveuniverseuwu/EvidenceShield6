import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, Loader2, AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Folder, FolderOpen, Search, X } from "lucide-react";
import { User } from "../App";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ZKPVerificationBadge } from "./ZKPVerificationBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { FileEncryption, getEncryptionMetadata } from "../utils/encryption/FileEncryption";

interface EvidenceFile {
  id: string;
  caseNumber: string;
  description: string;
  fileName: string;
  fileSize: number;
  fileHash?: string;  // Real file hash from backend
  ipfsCid: string;
  txHash: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderRole: string;
  uploaderEmail?: string;
  department: string;
  timestamp: string;
  sharedWith?: string[];
  isDownloadable?: boolean;
  merkleRoot?: string;
  batchId?: string;
  batchIndex?: number;
  zkpProofId?: string;
  zkpFileHash?: string;  // Hash used for ZKP verification
}

interface EvidenceFilesProps {
  currentUser: User;
}

export function EvidenceFiles({ currentUser }: EvidenceFilesProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCases, setOpenCases] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/get-evidence?userEmail=${currentUser.email}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        const filesWithStatus = data.files || [];
        
        // Check file integrity for each file (optional - can be removed for performance)
        // All files are marked as downloadable (no integrity check needed)
        const filesWithIntegrity = filesWithStatus.map((file: EvidenceFile) => {
          return { ...file, isDownloadable: true };
        });
        
        // Add ZKP proof ID and use real file hash from backend
        const filesWithZKP = filesWithIntegrity.map((file: EvidenceFile) => {
          // Check if ZKP proof already exists (from backend)
          if (file.zkpProofId) {
            return file; // Already has ZKP data from backend
          }
          
          // Check localStorage for ZKP proof generated during upload
          const storageKey = `zkp_file_${file.id}`;
          const storedProofId = localStorage.getItem(storageKey);
          
          if (storedProofId) {
            // Found proof in localStorage
            const proofData = JSON.parse(storedProofId);
            return {
              ...file,
              zkpProofId: proofData.proofId,
              zkpFileHash: proofData.fileHash,
            };
          }
          
          // Generate ZKP proof ID (but use REAL file hash from backend)
          const mockProofId = `ZKP-${Date.now()}-${file.id.substring(0, 8)}`;
          
          // Use the REAL fileHash from backend (stored during upload)
          // Cast file to any to access fileHash property
          const realFileHash = (file as any).fileHash || null;
          
          // Store in localStorage so it persists
          localStorage.setItem(storageKey, JSON.stringify({
            proofId: mockProofId,
            fileHash: realFileHash,
          }));
          
          return {
            ...file,
            zkpProofId: mockProofId,
            zkpFileHash: realFileHash, // Use REAL hash, not random mock
          };
        });
        
        setFiles(filesWithZKP);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleDownload = async (file: EvidenceFile) => {
    try {
      console.log("🔽 Starting download process for:", file.fileName);
      console.log("   File ID:", file.id);
      
      // Download the encrypted file from server
      const downloadUrl = `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/download-file/${file.id}`;
      
      console.log("   Fetching encrypted file from server...");
      
      // Fetch the encrypted file
      const fileResponse = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!fileResponse.ok) {
        const errorData = await fileResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("Download failed:", errorData);
        
        const errorMessage = errorData.error || "Failed to download file";
        alert(`❌ Download Failed\n\n${errorMessage}\n\nFile: ${file.fileName}\nID: ${file.id}\n\nIf this file was uploaded recently, try refreshing the page. If the problem persists, the file may need to be re-uploaded.`);
        throw new Error(errorMessage);
      }

      // Get the encrypted blob
      const encryptedBlob = await fileResponse.blob();
      
      if (encryptedBlob.size === 0) {
        throw new Error("Downloaded file is empty (0 bytes)");
      }
      
      console.log("   Encrypted file downloaded, size:", encryptedBlob.size, "bytes");
      
      // Check if file is encrypted
      console.log("   Checking for encryption metadata with file ID:", file.id);
      const encryptionData = getEncryptionMetadata(file.id);
      console.log("   Encryption data found:", encryptionData ? "YES" : "NO");
      
      if (encryptionData) {
        console.log("   Metadata:", JSON.stringify(encryptionData.metadata, null, 2));
      }
      
      if (encryptionData) {
        console.log("🔓 File is encrypted, decrypting...");
        
        try {
          // Convert blob to ArrayBuffer
          const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
          
          // Decrypt the file
          const decryptedFile = await FileEncryption.decryptFile(
            encryptedArrayBuffer,
            encryptionData.metadata,
            encryptionData.key
          );
          
          console.log("✅ File decrypted successfully:", decryptedFile.name);
          console.log("   Decrypted size:", decryptedFile.size, "bytes");
          
          // Create download link for decrypted file
          const url = window.URL.createObjectURL(decryptedFile);
          const a = document.createElement("a");
          a.href = url;
          a.download = decryptedFile.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          console.log("✅ Decrypted file download initiated:", decryptedFile.name);
        } catch (decryptError) {
          console.error("❌ Decryption failed:", decryptError);
          alert(`❌ Decryption Failed\n\nCould not decrypt the file. The file may be corrupted or the encryption key is unavailable.\n\nError: ${decryptError instanceof Error ? decryptError.message : 'Unknown error'}`);
          throw decryptError;
        }
      } else {
        console.log("⚠️ No encryption metadata found, downloading as-is");
        
        // File is not encrypted (legacy file), download directly
        const url = window.URL.createObjectURL(encryptedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log("✅ File download initiated:", file.fileName);
      }

      // Track download event (don't block on this)
      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/track-download`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: file.id,
            fileName: file.fileName,
            caseNumber: file.caseNumber,
            downloadedBy: currentUser.email,
            downloaderName: currentUser.name,
            downloaderRole: currentUser.role,
          }),
        }
      ).catch(err => console.warn("Failed to track download:", err));

      console.log("✓ File downloaded successfully:", file.fileName);
    } catch (error) {
      console.error("Download error details:", error);
      // Error already shown to user in the try block
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

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      file.fileName.toLowerCase().includes(query) ||
      file.caseNumber.toLowerCase().includes(query) ||
      file.uploaderEmail?.toLowerCase().includes(query) ||
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
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-indigo-600">Loading evidence files...</p>
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
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-indigo-900">Evidence Files</h2>
              <p className="text-indigo-600 text-sm">
                View, verify, and download evidence files
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-indigo-900">{files.length}</div>
            <div className="text-indigo-600 text-sm">Total Files • {caseNumbers.length} Cases</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
          <input
            type="text"
            placeholder="Search by file name, case number, uploader, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-indigo-900 placeholder-indigo-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-indigo-600">
            Found {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} in {caseNumbers.length} case{caseNumbers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Files List Grouped by Case */}
      {files.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
          <h3 className="text-indigo-900 mb-2">No Evidence Files</h3>
          <p className="text-indigo-600">
            {currentUser.role === "Prosecutor"
              ? "No files have been shared with you yet."
              : "Upload your first evidence file to get started."}
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-12 text-center">
          <Search className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
          <h3 className="text-indigo-900 mb-2">No Results Found</h3>
          <p className="text-indigo-600">
            No files match your search query "{searchQuery}". Try different keywords.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {caseNumbers.map((caseNumber) => {
            const caseFiles = filesByCase[caseNumber];
            const isOpen = openCases.has(caseNumber);
            
            return (
              <Collapsible
                key={caseNumber}
                open={isOpen}
                onOpenChange={() => toggleCase(caseNumber)}
              >
                {/* Case Folder Header */}
                <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 cursor-pointer group">
                      <div className="flex items-center gap-3">
                        {isOpen ? (
                          <FolderOpen className="w-6 h-6 text-indigo-600" />
                        ) : (
                          <Folder className="w-6 h-6 text-indigo-600" />
                        )}
                        <div className="text-left">
                          <h3 className="text-indigo-900 font-semibold">
                            Case {caseNumber}
                          </h3>
                          <p className="text-indigo-600 text-sm">
                            {caseFiles.length} file{caseFiles.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                          {caseFiles.length} file{caseFiles.length > 1 ? 's' : ''}
                        </span>
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-indigo-600 transition-transform" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-indigo-600 transition-transform" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Case Files */}
                  <CollapsibleContent>
                    <div className="border-t border-indigo-200 p-4 space-y-4">
                      {caseFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* File Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-indigo-900">{file.fileName}</h3>
                      <p className="text-indigo-600 text-sm">
                        Case: {file.caseNumber} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <p className="text-indigo-700">{file.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-indigo-600">Uploaded by:</span>{" "}
                      <span className="text-indigo-900">{file.uploaderName}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600">Role:</span>{" "}
                      <span className="text-indigo-900">{file.uploaderRole}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600">Department:</span>{" "}
                      <span className="text-indigo-900">{file.department}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600">Date:</span>{" "}
                      <span className="text-indigo-900">
                        {new Date(file.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Blockchain Info */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-indigo-600">IPFS CID (Demo):</span>
                      <code className="text-indigo-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate">
                        {file.ipfsCid}
                      </code>
                      <span className="text-indigo-500 text-xs">Mock CID</span>
                    </div>
                    {file.merkleRoot && (
                      <div className="flex items-center gap-2 text-sm bg-purple-50 -mx-4 px-4 py-2">
                        <span className="text-purple-700">🌳 Merkle Root:</span>
                        <code className="text-purple-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate">
                          {file.merkleRoot}
                        </code>
                        <span className="text-purple-600 text-xs">
                          Batch #{file.batchIndex !== undefined ? file.batchIndex + 1 : '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-indigo-600">TX Hash (Demo):</span>
                      <code className="text-indigo-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate">
                        {file.txHash}
                      </code>
                      <a
                        href={`https://polygonscan.com/tx/${file.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Mock transaction - won't exist on Polygonscan"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {file.isDownloadable === false ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-600">File Content Issue:</span>
                          <span className="text-amber-700 text-xs">File may need to be re-uploaded</span>
                        </>
                      ) : (
                        <>
                          <span className="text-green-600">✓ Real File:</span>
                          <span className="text-green-700 text-xs">Stored in database, click Download to save locally</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ZKP Proof Badge */}
                  {file.zkpProofId && (
                    <ZKPVerificationBadge 
                      zkpProofId={file.zkpProofId}
                      fileHash={file.zkpFileHash}
                      fileName={file.fileName}
                      fileId={file.id}
                      caseNumber={file.caseNumber}
                      txHash={file.txHash}
                      merkleRoot={file.merkleRoot}
                      currentUser={{
                        email: currentUser.email,
                        name: currentUser.name,
                        role: currentUser.role,
                      }}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
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
  );
}
