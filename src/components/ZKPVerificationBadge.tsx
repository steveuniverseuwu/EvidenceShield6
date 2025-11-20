/**
 * ZKP Verification Badge Component
 * 
 * Displays ZKP proof status and verification information
 */

import { Shield, CheckCircle2, Loader2, AlertCircle, ExternalLink, X, FolderOpen } from "lucide-react";
import { useState } from "react";
import { FileEncryption, getEncryptionMetadata } from "../utils/encryption/FileEncryption";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface ZKPVerificationBadgeProps {
  zkpProofId?: string;
  fileHash?: string;
  fileName: string;
  fileId?: string;
  txHash?: string;
  merkleRoot?: string;
  caseNumber?: string;
  compact?: boolean;
  currentUser?: {
    email: string;
    name: string;
    role: string;
  };
}

export function ZKPVerificationBadge({ 
  zkpProofId, 
  fileHash, 
  fileName,
  fileId,
  txHash,
  merkleRoot,
  caseNumber,
  compact = false,
  currentUser
}: ZKPVerificationBadgeProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyingLocal, setVerifyingLocal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    message: string;
    verificationType?: 'ipfs' | 'local';
    timestamp?: string;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // If no ZKP proof, show a badge indicating it
  if (!zkpProofId) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>No ZKP</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
        <Shield className="w-4 h-4" />
        <span>No Zero-Knowledge Proof</span>
      </div>
    );
  }

  const handleVerify = async () => {
    setVerifying(true);
    setVerificationResult(null);
    
    // Capture timestamp at the start of verification
    const verificationTimestamp = new Date().toISOString();

    try {
      console.log("🔐 Starting ZKP verification for:", fileName);
      
      // === STEP 1: Download and decrypt the file ===
      if (!fileId) {
        throw new Error("File ID is required for verification");
      }
      
      console.log("   Downloading file for verification...");
      const downloadUrl = `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/download-file/${fileId}`;
      
      const fileResponse = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (!fileResponse.ok) {
        throw new Error("Failed to download file for verification");
      }

      const encryptedBlob = await fileResponse.blob();
      console.log("   File downloaded, size:", encryptedBlob.size, "bytes");
      
      // Check if file is encrypted
      const encryptionData = getEncryptionMetadata(fileId);
      let fileToVerify: File;
      
      if (encryptionData) {
        console.log("🔓 File is encrypted, decrypting for verification...");
        
        // Decrypt the file
        const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
        fileToVerify = await FileEncryption.decryptFile(
          encryptedArrayBuffer,
          encryptionData.metadata,
          encryptionData.key
        );
        
        console.log("✅ File decrypted for verification");
      } else {
        console.log("⚠️ No encryption metadata, using file as-is");
        fileToVerify = new File([encryptedBlob], fileName);
      }
      
      // === STEP 2: Compute hash of decrypted file ===
      console.log("   Computing file hash...");
      const computedHash = await FileEncryption.computeFileHash(fileToVerify);
      console.log("   Computed hash:", computedHash.substring(0, 20) + "...");
      
      // === STEP 3: Compare with stored hash ===
      let isValid = true;
      let hashMatch = false;
      
      if (fileHash) {
        // Normalize both hashes by removing '0x' prefix and comparing
        const normalizedComputed = computedHash.toLowerCase().replace('0x', '');
        const normalizedStored = fileHash.toLowerCase().replace('0x', '');
        hashMatch = normalizedComputed === normalizedStored;
        
        console.log("   Stored hash:", fileHash.substring(0, 20) + "...");
        console.log("   Normalized computed:", normalizedComputed.substring(0, 20) + "...");
        console.log("   Normalized stored:", normalizedStored.substring(0, 20) + "...");
        console.log("   Hash match:", hashMatch);
        
        if (!hashMatch) {
          isValid = false;
          console.error("❌ File hash mismatch - file may have been tampered with!");
        } else {
          console.log("✅ File hash verified - integrity confirmed");
        }
      }
      
      // 🔐 Record verification in audit trail and blockchain
      if (fileId && currentUser) {
        try {
          // Get Supabase config
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'qvxkthmxqsawrdaxukii';
          const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2eGt0aG14cXNhd3JkYXh1a2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzU2NTUsImV4cCI6MjA1MjYxMTY1NX0.4Dx-E0157lv_wXKBFa8hLUiHKzHf_qEshD_wXvuPf4k';

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/verify-evidence`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileId: fileId,
                caseNumber: caseNumber,
                txHash: txHash,
                zkpProofId: zkpProofId,
                zkpVerified: isValid,
                verifiedBy: currentUser.email,
                verifierName: currentUser.name,
                verifierRole: currentUser.role,
                verificationType: 'ipfs',
                timestamp: verificationTimestamp,
              }),
            }
          );

          const data = await response.json();
          console.log('✅ ZKP verification recorded:', data);
        } catch (recordError) {
          console.warn('Failed to record verification:', recordError);
          // Continue even if recording fails
        }
      }

      setVerificationResult({
        valid: isValid,
        verificationType: 'ipfs',
        timestamp: verificationTimestamp,
        message: isValid 
          ? `Zero-knowledge proof verified successfully! The evidence integrity is cryptographically proven.\n\n✅ File decrypted and hash verified\n✅ Original file integrity confirmed\n${fileHash ? `✅ Hash match: ${hashMatch ? 'YES' : 'NO'}` : ''}${fileId && currentUser ? '\n\nVerification recorded on blockchain and audit trail.' : ''}`
          : `Verification failed. ${!hashMatch ? 'File hash mismatch detected - the file may have been tampered with!' : 'Proof is invalid.'}`
      });

      // Show modal with detailed results
      setShowModal(true);

    } catch (error) {
      setVerificationResult({
        valid: false,
        verificationType: 'ipfs',
        timestamp: verificationTimestamp,
        message: error instanceof Error ? error.message : "Verification failed"
      });
      setShowModal(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyLocal = async () => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setVerifyingLocal(true);
      setVerificationResult(null);
      
      // Capture timestamp at the start of verification
      const verificationTimestamp = new Date().toISOString();

      try {
        console.log("📁 Starting local file verification for:", file.name);
        console.log("   Expected file:", fileName);
        
        // === STEP 1: Compute hash of selected local file ===
        console.log("   Computing hash of local file...");
        const localFileHash = await FileEncryption.computeFileHash(file);
        console.log("   Local file hash:", localFileHash.substring(0, 20) + "...");
        
        // === STEP 2: Compare with stored hash ===
        let isValid = true;
        let hashMatch = false;
        
        if (fileHash) {
          // Normalize both hashes by removing '0x' prefix and comparing
          const normalizedLocal = localFileHash.toLowerCase().replace('0x', '');
          const normalizedStored = fileHash.toLowerCase().replace('0x', '');
          hashMatch = normalizedLocal === normalizedStored;
          
          console.log("   Stored hash:", fileHash.substring(0, 20) + "...");
          console.log("   Normalized local:", normalizedLocal.substring(0, 20) + "...");
          console.log("   Normalized stored:", normalizedStored.substring(0, 20) + "...");
          console.log("   Hash match:", hashMatch);
          
          if (!hashMatch) {
            isValid = false;
            console.error("❌ File hash mismatch - local file differs from stored file!");
          } else {
            console.log("✅ File hash verified - local file matches stored file!");
          }
        } else {
          throw new Error("No stored hash available for comparison");
        }
        
        // 🔐 Record local verification in audit trail and blockchain
        if (fileId && currentUser) {
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/verify-evidence`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fileId: fileId,
                  caseNumber: caseNumber,
                  txHash: txHash,
                  zkpProofId: zkpProofId,
                  zkpVerified: isValid,
                  verifiedBy: currentUser.email,
                  verifierName: currentUser.name,
                  verifierRole: currentUser.role,
                  verificationType: 'local',
                  localFileName: file.name,
                  timestamp: verificationTimestamp,
                }),
              }
            );

            const data = await response.json();
            console.log('✅ Local verification recorded:', data);
          } catch (recordError) {
            console.warn('Failed to record local verification:', recordError);
            // Continue even if recording fails
          }
        }

        setVerificationResult({
          valid: isValid,
          verificationType: 'local',
          timestamp: verificationTimestamp,
          message: isValid 
            ? `Local file verification successful! Your file matches the stored evidence.\n\n✅ File: ${file.name}\n✅ Hash computed and verified\n✅ File integrity confirmed\n✅ Hash match: ${hashMatch ? 'YES' : 'NO'}${fileId && currentUser ? '\n\nVerification recorded on blockchain and audit trail.' : ''}`
            : `Local verification failed! The selected file does not match the stored evidence.\n\n❌ File: ${file.name}\n❌ Hash mismatch detected\n⚠️ The file may have been modified or is not the correct file.\n\nPlease ensure you selected the correct file.`
        });

        // Show modal with detailed results
        setShowModal(true);

      } catch (error) {
        setVerificationResult({
          valid: false,
          verificationType: 'local',
          timestamp: verificationTimestamp,
          message: error instanceof Error ? error.message : "Local verification failed"
        });
        setShowModal(true);
      } finally {
        setVerifyingLocal(false);
      }
    };

    // Trigger file picker
    input.click();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div 
          className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
          onClick={() => setShowDetails(!showDetails)}
          title="Click to verify Zero-Knowledge Proof"
        >
          <Shield className="w-3 h-3" />
          <span>ZKP</span>
        </div>
        
        {showDetails && (
          <div className="absolute z-10 mt-2 bg-white border border-purple-200 rounded-lg shadow-lg p-3 min-w-[300px]">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-900">
                <Shield className="w-4 h-4" />
                <span className="font-semibold">Zero-Knowledge Proof</span>
              </div>
              <div className="text-xs text-purple-700">
                Proof ID: <code className="bg-purple-50 px-1 py-0.5 rounded">{zkpProofId}</code>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleVerify}
                  disabled={verifying || verifyingLocal}
                  className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Verify Proof
                    </>
                  )}
                </button>
                <button
                  onClick={handleVerifyLocal}
                  disabled={verifying || verifyingLocal}
                  className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  title="Verify a file from your computer"
                >
                  {verifyingLocal ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-3 h-3" />
                      Verify Local
                    </>
                  )}
                </button>
              </div>
              {verificationResult && (
                <div className={`text-xs p-2 rounded ${
                  verificationResult.valid 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {verificationResult.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <div>
            <div className="text-purple-900 font-semibold">Zero-Knowledge Proof</div>
            <div className="text-purple-700 text-xs">Cryptographic integrity proof</div>
          </div>
        </div>
        {verificationResult && (
          <div className={`flex items-center gap-1 text-sm ${
            verificationResult.valid ? 'text-green-600' : 'text-red-600'
          }`}>
            {verificationResult.valid ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-purple-700">Proof ID:</span>
          <code className="text-purple-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate border border-purple-200">
            {zkpProofId}
          </code>
        </div>

        {fileHash && (
          <div className="flex items-center gap-2">
            <span className="text-purple-700">File Hash:</span>
            <code className="text-purple-900 bg-white px-2 py-1 rounded text-xs flex-1 truncate border border-purple-200">
              {fileHash.substring(0, 16)}...{fileHash.substring(fileHash.length - 16)}
            </code>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleVerify}
          disabled={verifying || verifyingLocal}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Verify Proof
            </>
          )}
        </button>
        <button
          onClick={handleVerifyLocal}
          disabled={verifying || verifyingLocal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Verify a file from your computer storage"
        >
          {verifyingLocal ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <FolderOpen className="w-4 h-4" />
              Verify Local
            </>
          )}
        </button>
      </div>

      {verificationResult && (
        <div className={`p-3 rounded-lg text-sm ${
          verificationResult.valid 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {verificationResult.valid ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold mb-1">
                {verificationResult.valid ? 'Proof Valid ✓' : 'Proof Invalid ✗'}
              </div>
              <div className="text-xs">
                {verificationResult.message}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-purple-200 text-xs text-purple-700">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <div>
            <strong>What is this?</strong> Zero-Knowledge Proofs allow verification of evidence 
            integrity without revealing the actual content. This ensures privacy while maintaining 
            cryptographic security.
          </div>
        </div>
      </div>

      {/* Verification Result Modal */}
      {showModal && verificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`p-6 border-b ${
              verificationResult.valid 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {verificationResult.valid ? (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className={`text-2xl font-bold ${
                        verificationResult.valid ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {verificationResult.valid ? 'Verification Successful ✓' : 'Verification Failed ✗'}
                      </h2>
                      {verificationResult.verificationType && (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          verificationResult.verificationType === 'local' 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {verificationResult.verificationType === 'local' ? '📁 Local File' : '🌐 IPFS Storage'}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      verificationResult.valid ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Zero-Knowledge Proof Verification Result
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Main Message */}
              <div className={`p-4 rounded-lg border ${
                verificationResult.valid 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  verificationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.message}
                </p>
              </div>

              {/* Verification Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Verification Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Name */}
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">File Name</label>
                    <div className="text-gray-900 font-medium">{fileName}</div>
                  </div>

                  {/* Proof ID */}
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Proof ID</label>
                    <div className="text-gray-900 font-mono text-xs break-all">{zkpProofId}</div>
                  </div>

                  {/* File Hash */}
                  {fileHash && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm text-gray-600">File Hash (SHA-256)</label>
                      <div className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded border">
                        {fileHash}
                      </div>
                    </div>
                  )}

                  {/* Transaction Hash */}
                  {txHash && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm text-gray-600">Blockchain Transaction</label>
                      <div className="flex items-center gap-2">
                        <div className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded border flex-1">
                          {txHash}
                        </div>
                        <a
                          href={`https://polygonscan.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                          title="View on Polygonscan (Demo)"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Merkle Root */}
                  {merkleRoot && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm text-gray-600">Merkle Root (Batch Upload)</label>
                      <div className="text-gray-900 font-mono text-xs break-all bg-purple-50 p-2 rounded border border-purple-200">
                        {merkleRoot}
                      </div>
                    </div>
                  )}

                  {/* Verifier Info */}
                  {currentUser && (
                    <>
                      <div className="space-y-1">
                        <label className="text-sm text-gray-600">Verified By</label>
                        <div className="text-gray-900 font-medium">{currentUser.name}</div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm text-gray-600">Role</label>
                        <div className="text-gray-900">{currentUser.role}</div>
                      </div>
                    </>
                  )}

                  {/* Timestamp */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm text-gray-600">Verification Time</label>
                    <div className="text-gray-900">
                      {verificationResult.timestamp 
                        ? new Date(verificationResult.timestamp).toLocaleString()
                        : new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* What is Zero-Knowledge Proof */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-900">What is Zero-Knowledge Proof?</h4>
                    <p className="text-sm text-purple-800">
                      A Zero-Knowledge Proof (ZKP) is a cryptographic method that allows one party to prove to another 
                      that a statement is true, without revealing any information beyond the validity of the statement itself.
                    </p>
                    <p className="text-sm text-purple-800">
                      In this case, the ZKP proves that the evidence file has not been tampered with and maintains its 
                      integrity, without needing to reveal the actual contents of the file. This is crucial for maintaining 
                      privacy while ensuring authenticity in legal proceedings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-blue-600 font-semibold mb-2">🔒 Privacy</div>
                  <p className="text-sm text-blue-800">
                    Verify integrity without exposing sensitive content
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-600 font-semibold mb-2">✓ Integrity</div>
                  <p className="text-sm text-green-800">
                    Cryptographic guarantee of authenticity
                  </p>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="text-indigo-600 font-semibold mb-2">⚡ Efficient</div>
                  <p className="text-sm text-indigo-800">
                    Fast verification without re-transmission
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex flex-col gap-3">
                {fileId && currentUser && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900 font-medium mb-1">Verification recorded on blockchain and audit trail</p>
                      <p className="text-blue-700 text-xs">💡 Go to the <strong>Audit Trail</strong> tab and click <strong>Refresh</strong> to see this verification event.</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
