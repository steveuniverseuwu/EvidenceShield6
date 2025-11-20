import { useState } from "react";
import { Upload, FileText, Clock, AlertCircle, CheckCircle2, Loader2, X, Files, GitMerge, Lock } from "lucide-react";
import { User } from "../App";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ZKPService } from "../utils/zkp/ZKPService";

type ZKPStatus =
  | { stage: "idle" }
  | { stage: "hashing"; progress: number }
  | { stage: "generating"; progress: number; message?: string }
  | { stage: "recording"; progress: number }
  | { stage: "complete"; proofId?: string; txHash?: string }
  | { stage: "error"; error: string };
import { ZKPProgress } from "./ZKPProgress";
import { FileEncryption, storeEncryptionMetadata } from "../utils/encryption/FileEncryption";

interface UploadEvidenceProps {
  currentUser: User;
}

export function UploadEvidence({ currentUser }: UploadEvidenceProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    merkleRoot?: string;
    txHash?: string;
  }>({ type: null, message: "" });
  
  // ZKP state
  const [zkpStatus, setZkpStatus] = useState<ZKPStatus>({ stage: 'idle' });
  const [zkpProofs, setZkpProofs] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Append new files to existing ones instead of replacing
      setFiles([...files, ...selectedFiles]);
      setUploadStatus({ type: null, message: "" });
      // Reset the input so the same file can be added again if needed
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0 || !caseNumber || !description) {
      setUploadStatus({
        type: "error",
        message: "Please fill in all fields and select at least one file",
      });
      return;
    }

    setUploading(true);
    setUploadStatus({ type: null, message: "" });
    setZkpStatus({ stage: 'idle' });
    setZkpProofs([]);

    try {
      // === STEP 1: COMPUTE HASHES OF ORIGINAL FILES (Before Encryption) ===
      console.log('📊 Computing file hashes before encryption...');
      const originalFileHashes: Array<{file: File; hash: string}> = [];
      
      for (const file of files) {
        const hash = await FileEncryption.computeFileHash(file);
        originalFileHashes.push({ file, hash });
        console.log(`   Hash computed for ${file.name}: ${hash.substring(0, 20)}...`);
      }

      // === STEP 2: AUTOMATIC ZKP GENERATION (Using Original File Hashes) ===
      console.log('🔐 Starting automatic ZKP generation for evidence files...');
      
      const generatedProofs: Array<{proofId: string; fileHash: string; fileName: string}> = [];
      
      // Generate ZKP for each file automatically (before encryption)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`🔐 Generating ZKP for file ${i + 1}/${files.length}: ${file.name}`);
        
        try {
          const zkpProof = await ZKPService.generateProof(
            file,
            {
              caseNumber,
              uploadedBy: currentUser.email,
              description,
            },
            (status) => {
              setZkpStatus(status);
            }
          );
          
          generatedProofs.push({
            proofId: zkpProof.proofId,
            fileHash: zkpProof.fileHash,
            fileName: file.name
          });
          console.log(`✅ ZKP generated for ${file.name}: ${zkpProof.proofId}`);
        } catch (zkpError) {
          console.error(`⚠️ ZKP generation failed for ${file.name}:`, zkpError);
          // Continue with upload even if ZKP fails (graceful degradation)
        }
      }
      
      setZkpProofs(generatedProofs.map(p => p.proofId));

      // === STEP 3: ENCRYPT FILES ===
      console.log('🔒 Starting file encryption...');
      setZkpStatus({ stage: 'generating', progress: 0, message: 'Encrypting files...' });
      
      const encryptionKey = FileEncryption.generateUserKey(currentUser.email, caseNumber);
      const encryptedFiles: Array<{
        file: File;
        metadata: any;
        originalFileName: string;
        originalHash: string;
      }> = [];
      
      for (let i = 0; i < files.length; i++) {
        const originalFile = files[i];
        const originalHash = originalFileHashes[i].hash;
        
        console.log(`🔒 Encrypting file ${i + 1}/${files.length}: ${originalFile.name}`);
        
        const encryptedData = await FileEncryption.encryptFile(originalFile, encryptionKey);
        const metadata = FileEncryption.createMetadata(encryptedData);
        const encryptedFile = FileEncryption.encryptedDataToFile(encryptedData, originalFile.name);
        
        encryptedFiles.push({
          file: encryptedFile,
          metadata,
          originalFileName: originalFile.name,
          originalHash,
        });
        
        setZkpStatus({ 
          stage: 'generating', 
          progress: ((i + 1) / files.length) * 100, 
          message: `Encrypted ${i + 1}/${files.length} files...` 
        });
      }
      
      console.log('✅ All files encrypted successfully');
      
      // === STEP 4: UPLOAD ENCRYPTED FILES ===
      console.log('📤 Uploading encrypted files...');
      const formData = new FormData();
      
      // Add all encrypted files with indexed names
      encryptedFiles.forEach((item, index) => {
        formData.append(`file${index}`, item.file);
      });
      
      formData.append("caseNumber", caseNumber);
      formData.append("description", description);
      formData.append("uploadedBy", currentUser.email);
      formData.append("uploaderName", currentUser.name);
      formData.append("uploaderRole", currentUser.role);
      formData.append("department", currentUser.department);
      
      // Add encryption metadata for each file
      formData.append("encryptionMetadata", JSON.stringify(
        encryptedFiles.map(item => ({
          originalFileName: item.originalFileName,
          metadata: item.metadata,
        }))
      ));
      
      // Add original file hashes for verification
      formData.append("originalFileHashes", JSON.stringify(
        encryptedFiles.map(item => ({
          fileName: item.originalFileName,
          hash: item.originalHash,
        }))
      ));
      
      // Add ZKP proof IDs and file hashes to metadata
      if (generatedProofs.length > 0) {
        formData.append("zkpProofs", JSON.stringify(generatedProofs));
      }

      // Use batch upload endpoint if multiple files, single upload if one file
      const endpoint = encryptedFiles.length > 1 
        ? "upload-batch-evidence"
        : "upload-evidence";

      // For single file, use the old format
      if (encryptedFiles.length === 1) {
        formData.delete("file0");
        formData.append("file", encryptedFiles[0].file);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-af0976da/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // === STEP 5: STORE ENCRYPTION METADATA ===
      console.log('💾 Storing encryption metadata locally...');
      console.log('Backend response:', JSON.stringify(data, null, 2));
      console.log('Response keys:', Object.keys(data));
      
      // Store encryption metadata for each uploaded file
      // Backend returns: { fileId: "file_xxx" } for single, { fileIds: ["file_xxx"] } for batch
      if (data.fileIds && Array.isArray(data.fileIds)) {
        // Batch upload - use fileIds array
        console.log(`Found ${data.fileIds.length} file IDs in batch response`);
        data.fileIds.forEach((fileId: string, index: number) => {
          if (encryptedFiles[index]) {
            console.log(`Storing metadata for file ID: ${fileId}, Name: ${encryptedFiles[index].originalFileName}`);
            storeEncryptionMetadata(
              fileId,
              encryptedFiles[index].metadata,
              encryptionKey
            );
            console.log(`✅ Metadata stored for: ${encryptedFiles[index].originalFileName} (ID: ${fileId})`);
          }
        });
      } else if (data.fileId) {
        // Single file upload - use fileId field
        const fileId = data.fileId;
        console.log(`Storing metadata for single file ID: ${fileId}, Name: ${encryptedFiles[0].originalFileName}`);
        storeEncryptionMetadata(
          fileId,
          encryptedFiles[0].metadata,
          encryptionKey
        );
        console.log(`✅ Metadata stored for: ${encryptedFiles[0].originalFileName} (ID: ${fileId})`);
      } else if (data.files && Array.isArray(data.files)) {
        // Fallback: array of file objects
        console.log(`Found ${data.files.length} files in response`);
        data.files.forEach((uploadedFile: any, index: number) => {
          if (encryptedFiles[index]) {
            const fileId = uploadedFile.id || uploadedFile.fileId;
            console.log(`Storing metadata for file ID: ${fileId}, Name: ${encryptedFiles[index].originalFileName}`);
            storeEncryptionMetadata(
              fileId,
              encryptedFiles[index].metadata,
              encryptionKey
            );
            console.log(`✅ Metadata stored for: ${encryptedFiles[index].originalFileName} (ID: ${fileId})`);
          }
        });
      } else if (data.file) {
        // Fallback: single file object
        const fileId = data.file.id || data.file.fileId || data.fileId;
        console.log(`Storing metadata for single file ID: ${fileId}, Name: ${encryptedFiles[0].originalFileName}`);
        storeEncryptionMetadata(
          fileId,
          encryptedFiles[0].metadata,
          encryptionKey
        );
        console.log(`✅ Metadata stored for: ${encryptedFiles[0].originalFileName} (ID: ${fileId})`);
      } else {
        console.error('⚠️ Could not find file IDs in response to store encryption metadata');
        console.error('Response data:', data);
        console.error('Expected: data.fileId or data.fileIds');
      }

      // 🔐 Store ZKP proofs in localStorage for later retrieval
      // This is temporary until backend saves them
      if (generatedProofs.length > 0 && data.fileIds) {
        // Map proofs to file IDs returned from backend
        const fileIds = Array.isArray(data.fileIds) ? data.fileIds : [data.fileIds];
        fileIds.forEach((fileId: string, index: number) => {
          if (generatedProofs[index]) {
            localStorage.setItem(`zkp_file_${fileId}`, JSON.stringify({
              proofId: generatedProofs[index].proofId,
              fileHash: generatedProofs[index].fileHash,
            }));
            console.log(`💾 Saved ZKP proof for file ${fileId}: ${generatedProofs[index].proofId}`);
          }
        });
      } else if (generatedProofs.length > 0 && data.fileId) {
        // Single file upload
        localStorage.setItem(`zkp_file_${data.fileId}`, JSON.stringify({
          proofId: generatedProofs[0].proofId,
          fileHash: generatedProofs[0].fileHash,
        }));
        console.log(`💾 Saved ZKP proof for file ${data.fileId}: ${generatedProofs[0].proofId}`);
      }

      // Handle batch upload response
      if (files.length > 1) {
        setUploadStatus({
          type: "success",
          message: `Batch upload successful! ${data.fileCount} files encrypted and uploaded with Merkle tree${generatedProofs.length > 0 ? ' and ZKP proofs' : ''}. Files are secured with AES-256-GCM encryption.`,
          merkleRoot: data.merkleRoot,
          txHash: data.txHash,
        });
      } else {
        setUploadStatus({
          type: "success",
          message: `Evidence uploaded successfully${generatedProofs.length > 0 ? ' with ZKP proof' : ''}!`,
          txHash: data.txHash,
        });
      }

      // Reset ZKP status to complete
      setZkpStatus({ stage: 'complete', proofId: undefined, txHash: undefined });

      // Reset form
      setFiles([]);
      setCaseNumber("");
      setDescription("");
      (document.getElementById("file-input") as HTMLInputElement).value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Upload failed. Please try again.",
      });
      setZkpStatus({ stage: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-indigo-900">Upload Evidence</h2>
            <p className="text-indigo-600 text-sm">
              Upload single or multiple files - Batch uploads use Merkle tree for efficient blockchain storage
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleUpload} className="space-y-6">
          {/* Case Number */}
          <div>
            <label className="block text-indigo-900 mb-2">
              Case Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g., CASE-2025-001"
              className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-indigo-900 mb-2">
              Evidence Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the evidence, context, and any relevant details..."
              rows={4}
              className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={uploading}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-indigo-900 mb-2 flex items-center gap-2">
              Evidence Files <span className="text-red-500">*</span>
              {files.length > 1 && (
                <span className="flex items-center gap-1.5 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                  <GitMerge className="w-3 h-3" />
                  Merkle Tree Batch
                </span>
              )}
            </label>
            <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 hover:border-indigo-500 transition-colors">
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
                multiple
              />
              
              {files.length === 0 ? (
                <label
                  htmlFor="file-input"
                  className="cursor-pointer flex flex-col items-center gap-3 py-4"
                >
                  <Upload className="w-12 h-12 text-indigo-400" />
                  <div className="text-indigo-900">Click to select file(s)</div>
                  <div className="text-indigo-600 text-sm text-center">
                    Select single or multiple files (Unlimited size support)
                    <br />
                    <span className="text-xs text-indigo-500 mt-1 inline-block">
                      Multiple files will be grouped with Merkle tree for blockchain efficiency
                    </span>
                  </div>
                </label>
              ) : (
                <div className="space-y-3">
                  {/* File List */}
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-indigo-900 text-sm truncate">{file.name}</div>
                            <div className="text-xs text-indigo-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1.5 hover:bg-indigo-200 rounded-md transition-colors flex-shrink-0"
                          title="Remove file"
                        >
                          <X className="w-4 h-4 text-indigo-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary & Add More */}
                  <div className="flex items-center justify-between pt-3 border-t border-indigo-200">
                    <div className="text-sm text-indigo-700 flex items-center gap-2">
                      <Files className="w-4 h-4" />
                      {files.length} file{files.length !== 1 ? 's' : ''} selected
                      {files.length > 1 && (
                        <span className="text-indigo-500">
                          ({(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB total)
                        </span>
                      )}
                    </div>
                    <label
                      htmlFor="file-input"
                      className="text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer underline"
                    >
                      Add more files
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ZKP Progress */}
          {zkpStatus.stage !== 'idle' && (
            <ZKPProgress status={zkpStatus as any} />
          )}

          {/* Status Message */}
          {uploadStatus.type && (
            <div
              className={`p-4 rounded-lg ${
                uploadStatus.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {uploadStatus.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <div
                    className={`text-sm ${
                      uploadStatus.type === "success" ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {uploadStatus.message}
                  </div>
                  
                  {/* Show ZKP proof IDs */}
                  {uploadStatus.type === "success" && zkpProofs.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-green-200">
                      <div className="text-xs text-green-700 font-semibold">🔐 Zero-Knowledge Proofs Generated:</div>
                      {zkpProofs.map((proofId, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          <code className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded">
                            {proofId}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show blockchain details */}
                  {uploadStatus.type === "success" && uploadStatus.txHash && (
                    <div className="space-y-1.5 pt-2 border-t border-green-200">
                      {uploadStatus.merkleRoot && (
                        <div className="flex items-start gap-2">
                          <GitMerge className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-green-700 mb-0.5">Merkle Root (Blockchain)</div>
                            <code className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded break-all block">
                              {uploadStatus.merkleRoot.substring(0, 66)}...
                            </code>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-green-700 mb-0.5">Transaction Hash</div>
                          <code className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded break-all block">
                            {uploadStatus.txHash}
                          </code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading to IPFS & Blockchain...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Evidence
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <h3 className="text-amber-900">AES-256 Encryption</h3>
          </div>
          <p className="text-amber-700 text-sm">
            Files encrypted before IPFS storage, auto-decrypt on download/verify
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-green-600" />
            <h3 className="text-green-900">Real File Storage</h3>
          </div>
          <p className="text-green-700 text-sm">
            ✓ Encrypted files stored securely - Download to get decrypted original
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <GitMerge className="w-5 h-5 text-purple-600" />
            <h3 className="text-purple-900">Merkle Tree Batching</h3>
          </div>
          <p className="text-purple-600 text-sm">
            Multiple files grouped with Merkle tree for efficient blockchain storage
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-indigo-900">Blockchain Record</h3>
          </div>
          <p className="text-indigo-600 text-sm">
            Mock IPFS CID and Polygon TX hash with SHA-256 file verification
          </p>
        </div>
      </div>
    </div>
  );
}
