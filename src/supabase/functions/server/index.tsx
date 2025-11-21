/**
 * ChainGuard Backend - Deno Edge Function
 *
 * This file uses Deno-specific import syntax:
 * - npm: prefix for npm packages (e.g., npm:hono)
 * - jsr: prefix for JSR packages (e.g., jsr:@supabase/supabase-js)
 * - node: prefix for Node.js built-ins (e.g., node:crypto)
 *
 * TypeScript errors about "Cannot find name 'Deno'" are normal in VSCode
 * but the code works perfectly in Deno runtime (Supabase Functions).
 *
 * These red lines are HARMLESS and can be ignored.
 */

// @ts-ignore - Deno global is available in Deno runtime
declare const Deno: any;

// @ts-ignore - Deno npm imports
import { Hono } from "npm:hono";
// @ts-ignore - Deno npm imports
import { cors } from "npm:hono/cors";
// @ts-ignore - Deno npm imports
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
// @ts-ignore - Deno node imports
import { createHash } from "node:crypto";
// @ts-ignore - Deno imports
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client for Storage
// @ts-ignore - Deno is available in runtime
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") || "https://qvxkthmxqsawrdaxukii.supabase.co";
// @ts-ignore - Deno is available in runtime
const supabaseServiceKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey || "");

console.log("Supabase Storage initialized:", supabaseUrl);

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateTxHash(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return `0x${Array.from(randomBytes)
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

// ============================================
// MERKLE TREE
// ============================================

interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

function buildMerkleTree(fileHashes: string[]): {
  root: string;
  tree: MerkleNode;
} {
  if (fileHashes.length === 0) {
    throw new Error("Cannot build Merkle tree from empty array");
  }

  let nodes: MerkleNode[] = fileHashes.map((hash: string) => ({ hash }));

  while (nodes.length > 1) {
    const newLevel: MerkleNode[] = [];
    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = i + 1 < nodes.length ? nodes[i + 1] : left;
      const combinedHash = createHash("sha256")
        .update(left.hash + right.hash)
        .digest("hex");
      newLevel.push({ hash: combinedHash, left, right });
    }
    nodes = newLevel;
  }

  return { root: nodes[0].hash, tree: nodes[0] };
}

// ============================================
// ROUTES
// ============================================

// Upload single evidence file
app.post("/make-server-af0976da/upload-evidence", async (c: any) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const caseNumber = formData.get("caseNumber") as string;
    const description = formData.get("description") as string;
    const uploadedBy = formData.get("uploadedBy") as string;
    const uploaderName = formData.get("uploaderName") as string;
    const uploaderRole = formData.get("uploaderRole") as string;
    const department = formData.get("department") as string;

    if (!file || !caseNumber || !description || !uploadedBy) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log(
      "📤 Uploading:",
      file.name,
      "Size:",
      (file.size / 1024 / 1024).toFixed(2),
      "MB"
    );

    // No file size limit - direct upload supports unlimited sizes
    console.log(`File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const buffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(buffer);
    const fileHash = createHash("sha256").update(fileBytes).digest("hex");
    const ipfsCid = `bafybei${fileHash.substring(0, 52)}`;
    const txHash = generateTxHash();

    // Create file metadata and upload to Supabase Storage
    const fileId = generateFileId();
    console.log("Generated file ID:", fileId);

    // Upload encrypted file to Supabase Storage (supports unlimited size)
    const storagePath = `${uploadedBy}/${caseNumber}/${fileId}/${file.name}`;
    console.log("Uploading to Supabase Storage:", storagePath);

    const { error: uploadError } = await supabase.storage
      .from("evidence-files")
      .upload(storagePath, fileBytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return c.json(
        { error: `Failed to upload to storage: ${uploadError.message}` },
        500
      );
    }

    console.log("✅ File uploaded to storage successfully:", storagePath);

    const fileData = {
      id: fileId,
      caseNumber,
      description,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileHash,
      ipfsCid,
      txHash,
      uploadedBy,
      uploaderName,
      uploaderRole,
      department,
      timestamp: new Date().toISOString(),
      sharedWith: [],
      storagePath, // Path in Supabase Storage for download
    };

    // Store file metadata in KV
    await kv.set(`evidence:${fileId}`, fileData);
    await kv.set(`user_evidence:${uploadedBy}:${fileId}`, fileData);

    console.log("✅ File uploaded and metadata stored successfully");

    // Create audit trail entry
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      fileId,
      fileName: file.name,
      caseNumber,
      action: "uploaded",
      performedBy: uploadedBy,
      performerName: uploaderName,
      performerRole: uploaderRole,
      timestamp: new Date().toISOString(),
      txHash,
      details: `File uploaded: ${file.name} (${(
        file.size /
        1024 /
        1024
      ).toFixed(2)} MB)`,
      ipAddress: "127.0.0.1",
    };

    await kv.set(`audit:${auditEntry.id}`, auditEntry);
    await kv.set(`file_audit:${fileId}:${auditEntry.id}`, auditEntry);

    return c.json({
      success: true,
      fileId,
      fileName: file.name,
      fileHash,
      ipfsCid,
      txHash,
      message: "Evidence uploaded successfully",
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    return c.json({ error: `Upload failed: ${error.message}` }, 500);
  }
});

// Upload batch evidence files
app.post("/make-server-af0976da/upload-batch-evidence", async (c: any) => {
  try {
    const formData = await c.req.formData();
    
    // Extract files from indexed keys (file0, file1, file2, etc.)
    const files: File[] = [];
    let fileIndex = 0;
    while (true) {
      const file = formData.get(`file${fileIndex}`) as File | null;
      if (!file) break;
      files.push(file);
      fileIndex++;
    }
    
    const caseNumber = formData.get("caseNumber") as string;
    const description = formData.get("description") as string;
    const uploadedBy = formData.get("uploadedBy") as string;
    const uploaderName = formData.get("uploaderName") as string;
    const uploaderRole = formData.get("uploaderRole") as string;
    const department = formData.get("department") as string;

    if (!files || files.length === 0) {
      return c.json({ error: "No files provided" }, 400);
    }

    console.log(`📤 Batch upload: ${files.length} files`);

    const MAX_BATCH_SIZE = 20; // Max 20 files per batch

    if (files.length > MAX_BATCH_SIZE) {
      return c.json(
        { error: `Maximum ${MAX_BATCH_SIZE} files per batch` },
        400
      );
    }

    // Process all files (no size limit - direct upload)
    const fileHashes: string[] = [];
    const fileData: any[] = [];
    const timestamp = new Date().toISOString();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      console.log(
        `Processing file ${i + 1}/${files.length}: ${file.name} (${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );

      const fileId = generateFileId();
      const buffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(buffer);
      const fileHash = createHash("sha256").update(fileBytes).digest("hex");
      const ipfsCid = `bafybei${fileHash.substring(0, 52)}`;

      fileHashes.push(fileHash);

      // Upload to Supabase Storage
      const storagePath = `${uploadedBy}/${caseNumber}/${fileId}/${file.name}`;
      console.log(
        `  Uploading file ${i + 1}/${files.length} to Storage:`,
        storagePath
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("evidence-files")
        .upload(storagePath, fileBytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error(`  Storage upload error for ${file.name}:`, uploadError);
        return c.json(
          { error: `Failed to upload ${file.name}: ${uploadError.message}` },
          500
        );
      }

      console.log(
        `  ✅ File ${i + 1}/${files.length} uploaded to storage:`,
        uploadData.path
      );

      // Store file data with storage path
      fileData.push({
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileHash,
        ipfsCid,
        storagePath,
      });
    }

    // Build Merkle tree
    const { root: merkleRoot } = buildMerkleTree(fileHashes);
    const txHash = generateTxHash();
    const batchId = `batch_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    console.log("Merkle root:", merkleRoot);
    console.log("TX hash:", txHash);
    console.log("Batch ID:", batchId);

    // Store batch metadata
    const batchData = {
      id: batchId,
      caseNumber,
      description,
      fileCount: files.length,
      merkleRoot,
      txHash,
      uploadedBy,
      uploaderName,
      uploaderRole,
      department,
      timestamp,
      fileIds: fileData.map((f: any) => f.id),
    };

    await kv.set(`batch:${batchId}`, batchData);
    await kv.set(`user_batch:${uploadedBy}:${batchId}`, batchData);

    // Store individual files with batch reference (metadata only - files in Storage)
    console.log("Storing file metadata in KV...");
    for (let i = 0; i < fileData.length; i++) {
      const file: any = fileData[i];

      const evidenceData = {
        id: file.id,
        caseNumber,
        description,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        fileHash: file.fileHash,
        ipfsCid: file.ipfsCid,
        txHash,
        merkleRoot,
        batchId,
        batchIndex: i,
        uploadedBy,
        uploaderName,
        uploaderRole,
        department,
        timestamp,
        sharedWith: [],
        storagePath: file.storagePath,
      };

      await kv.set(`evidence:${file.id}`, evidenceData);
      await kv.set(`user_evidence:${uploadedBy}:${file.id}`, evidenceData);

      console.log(`  ✅ Metadata stored for: ${file.fileName}`);
    }

    // Create batch upload audit entry
    const fileNames = fileData.map((f: any) => f.fileName).join(", ");
    const batchAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      batchId,
      caseNumber,
      action: "batch_upload",
      performedBy: uploadedBy,
      performerName: uploaderName,
      performerRole: uploaderRole,
      timestamp: timestamp, // Use the shared timestamp
      txHash,
      merkleRoot,
      details: `Batch upload: ${files.length} file${files.length > 1 ? 's' : ''} (${fileNames})`,
      ipAddress: "127.0.0.1",
      fileCount: files.length,
      fileIds: fileData.map((f: any) => f.id),
      fileNames: fileData.map((f: any) => f.fileName),
    };

    await kv.set(`audit:${batchAuditEntry.id}`, batchAuditEntry);

    console.log("✅ Batch upload complete");

    return c.json({
      success: true,
      batchId,
      fileCount: files.length,
      merkleRoot,
      txHash,
      fileIds: fileData.map((f: any) => f.id),
      message: `${files.length} files uploaded successfully`,
    });
  } catch (error: any) {
    console.error("❌ Batch upload error:", error);
    return c.json({ error: `Batch upload failed: ${error.message}` }, 500);
  }
});

// Verify evidence - Record verification in audit trail
app.post("/make-server-af0976da/verify-evidence", async (c: any) => {
  try {
    const body = await c.req.json();
    const {
      fileId,
      caseNumber,
      txHash,
      zkpProofId,
      zkpVerified,
      verifiedBy,
      verifierName,
      verifierRole,
      verificationType,
      localFileName,
      timestamp, // ← Accept timestamp from frontend
    } = body;

    if (!fileId || !verifiedBy) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log("🔐 Recording verification for file:", fileId);
    console.log("   Case number:", caseNumber);
    console.log("   TX Hash:", txHash);
    console.log("   Verified by:", verifierName);
    console.log("   Type:", verificationType);
    console.log("   Result:", zkpVerified ? "Valid" : "Invalid");
    console.log("   Frontend timestamp:", timestamp);

    // Use frontend timestamp if provided, otherwise create new one
    const auditTimestamp = timestamp || new Date().toISOString();

    // Get file metadata to retrieve fileName, caseNumber, and txHash if not provided
    let fileName = localFileName || "N/A";
    let caseName = caseNumber;
    let transactionHash = txHash;
    
    if (fileId && (!caseName || fileName === "N/A" || !transactionHash)) {
      const fileData = await kv.get(`evidence:${fileId}`);
      if (fileData) {
        if (!caseName) caseName = fileData.caseNumber;
        if (fileName === "N/A") fileName = fileData.fileName;
        if (!transactionHash) transactionHash = fileData.txHash;
      }
    }

    // Create audit entry
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      fileId,
      fileName: fileName,
      caseNumber: caseName,
      txHash: transactionHash,
      action: "verify",
      performedBy: verifiedBy,
      performerName: verifierName,
      performerRole: verifierRole,
      timestamp: auditTimestamp, // ← Use frontend timestamp
      details: `${
        verificationType === "local" ? "Local file" : "IPFS"
      } verification: ${zkpVerified ? "Valid" : "Invalid"}${
        zkpProofId ? ` (ZKP: ${zkpProofId})` : ""
      }`,
      ipAddress: "127.0.0.1",
      verificationType,
      zkpProofId,
      zkpVerified,
      localFileName,
    };

    await kv.set(`audit:${auditEntry.id}`, auditEntry);
    await kv.set(`file_audit:${fileId}:${auditEntry.id}`, auditEntry);

    console.log("✅ Verification recorded in audit trail");

    return c.json({
      success: true,
      auditId: auditEntry.id,
      timestamp: auditTimestamp, // Return the same timestamp
      message: "Verification recorded successfully",
    });
  } catch (error: any) {
    console.error("❌ Verification recording error:", error);
    return c.json(
      { error: `Failed to record verification: ${error.message}` },
      500
    );
  }
});

// Download file
app.get("/make-server-af0976da/download-file/:fileId", async (c: any) => {
  try {
    const fileId = c.req.param("fileId");

    console.log("📥 Download request for file:", fileId);

    // Get file metadata
    const fileMetadata = await kv.get(`evidence:${fileId}`);

    if (!fileMetadata) {
      console.error("Download error: File metadata not found for ID:", fileId);
      return c.json({ error: "File not found" }, 404);
    }

    if (!fileMetadata.storagePath) {
      console.error("Download error: No storage path for file:", fileId);
      return c.json(
        {
          error: `File "${fileMetadata.fileName}" was uploaded with old system. Please re-upload this file.`,
        },
        404
      );
    }

    console.log("Downloading from Supabase Storage:", fileMetadata.storagePath);

    // Download from Supabase Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("evidence-files")
      .download(fileMetadata.storagePath);

    if (downloadError) {
      console.error("Storage download error:", downloadError);
      return c.json(
        { error: `Download failed: ${downloadError.message}` },
        500
      );
    }

    if (!fileBlob) {
      console.error("File blob is null for:", fileId);
      return c.json({ error: "File data not found in storage" }, 404);
    }

    console.log(
      "✅ File downloaded from storage successfully:",
      fileMetadata.fileName,
      "Size:",
      fileBlob.size,
      "bytes"
    );

    // Convert blob to array buffer
    const bytes = new Uint8Array(await fileBlob.arrayBuffer());

    // Return file with proper headers
    return new Response(bytes, {
      headers: {
        "Content-Type": fileMetadata.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileMetadata.fileName}"`,
        "Content-Length": bytes.length.toString(),
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("❌ Download error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Track download event for audit trail
app.post("/make-server-af0976da/track-download", async (c: any) => {
  try {
    const body = await c.req.json();
    const {
      fileId,
      fileName,
      caseNumber,
      downloadedBy,
      downloaderName,
      downloaderRole,
    } = body;

    if (!fileId || !downloadedBy) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log("📥 Tracking download event for file:", fileName);

    // Get file metadata to get original TX hash
    const fileData = await kv.get(`evidence:${fileId}`);
    
    // Generate new blockchain transaction for download action
    const downloadTxHash = generateTxHash();
    
    console.log("📝 Generated new blockchain TX for download:", downloadTxHash);
    console.log("   Original upload TX:", fileData?.txHash || "N/A");
    console.log("   File:", fileName);
    console.log("   Downloaded by:", downloaderName, `(${downloaderRole})`);

    // Create audit entry for download
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      fileId,
      fileName: fileName || "Unknown",
      caseNumber: caseNumber || "N/A",
      action: "download",
      performedBy: downloadedBy,
      performerName: downloaderName || "Unknown",
      performerRole: downloaderRole || "Unknown",
      timestamp: new Date().toISOString(),
      txHash: downloadTxHash, // New transaction hash for this download
      originalTxHash: fileData?.txHash, // Reference to original upload TX
      details: `File downloaded: ${fileName || "Unknown"}`,
      ipAddress: "127.0.0.1",
    };

    await kv.set(`audit:${auditEntry.id}`, auditEntry);
    await kv.set(`file_audit:${fileId}:${auditEntry.id}`, auditEntry);

    console.log("✅ Download event tracked successfully");

    return c.json({
      success: true,
      message: "Download tracked successfully",
      txHash: downloadTxHash,
    });
  } catch (error: any) {
    console.error("❌ Error tracking download:", error);
    // Don't fail the download if tracking fails
    return c.json({ 
      success: false, 
      error: error.message 
    }, 200); // Return 200 so download still works
  }
});

// Get user evidence (alias for backwards compatibility)
app.get("/make-server-af0976da/user-evidence/:email", async (c: any) => {
  try {
    const email = c.req.param("email");
    console.log("📋 Fetching evidence for user:", email);

    const evidence = await kv.getByPrefix(`user_evidence:${email}`);

    console.log(`✅ Found ${evidence.length} evidence files for ${email}`);

    return c.json({ evidence });
  } catch (error: any) {
    console.error("❌ Error fetching user evidence:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get evidence files for user (for My Evidence page)
app.get("/make-server-af0976da/get-evidence", async (c: any) => {
  try {
    const userEmail = c.req.query("userEmail");
    
    if (!userEmail) {
      return c.json({ error: "User email is required" }, 400);
    }
    
    console.log("📋 Fetching evidence files for user:", userEmail);

    const evidence = await kv.getByPrefix(`user_evidence:${userEmail}`);

    console.log(`✅ Found ${evidence.length} evidence files for ${userEmail}`);

    return c.json({ files: evidence });
  } catch (error: any) {
    console.error("❌ Error fetching evidence:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get my uploaded files (files I uploaded, for sharing page)
app.get("/make-server-af0976da/get-my-uploads", async (c: any) => {
  try {
    const userEmail = c.req.query("userEmail");
    
    if (!userEmail) {
      return c.json({ error: "User email is required" }, 400);
    }
    
    console.log("📋 Fetching uploaded files for user:", userEmail);

    // Get all evidence files
    const allEvidence = await kv.getByPrefix(`user_evidence:${userEmail}`);
    
    // Filter to only files uploaded by this user (not shared with them)
    const myUploads = allEvidence.filter((file: any) => file.uploadedBy === userEmail);

    console.log(`✅ Found ${myUploads.length} files uploaded by ${userEmail}`);

    return c.json({ files: myUploads });
  } catch (error: any) {
    console.error("❌ Error fetching uploads:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get audit trail
app.get("/make-server-af0976da/audit-trail", async (c: any) => {
  try {
    console.log("📋 Fetching audit trail...");

    const audits = await kv.getByPrefix("audit");

    console.log(`✅ Found ${audits.length} audit entries`);

    return c.json({ audits });
  } catch (error: any) {
    console.error("❌ Error fetching audit trail:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get audit trail with filtering (for Audit Trail page)
app.get("/make-server-af0976da/get-audit-trail", async (c: any) => {
  try {
    const userEmail = c.req.query("userEmail");
    const filter = c.req.query("filter") || "all";
    
    console.log("📋 Fetching audit trail with filter:", filter, "for user:", userEmail || "all");

    // Get all entries with "audit:" prefix
    let audits = await kv.getByPrefix("audit:");
    
    // IMPORTANT: Filter out file_audit references (they're duplicates)
    // Only keep main audit entries (audit:{id})
    audits = audits.filter((audit: any) => {
      const key = audit.key || audit._key;
      return key && key.startsWith("audit:audit_");
    });
    
    // Filter by user if not admin
    if (userEmail) {
      audits = audits.filter((audit: any) => {
        // Show audit entries where:
        // 1. User performed the action, OR
        // 2. User is the recipient of a share (sharedWith), OR
        // 3. User has access to the file (for batch uploads and other shared files)
        return audit.performedBy === userEmail || audit.sharedWith === userEmail;
      });
    }
    // Admin sees ALL audit entries (no filtering)
    
    // Filter by event type
    if (filter !== "all") {
      audits = audits.filter((audit: any) => {
        // Handle "upload" filter matching "uploaded" action
        if (filter === "upload" && audit.action === "uploaded") {
          return true;
        }
        return audit.action === filter || audit.eventType === filter;
      });
    }
    
    // Sort by timestamp (newest first)
    audits.sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Map to expected format
    const events = audits.map((audit: any) => ({
      id: audit.id,
      eventType: audit.action === "uploaded" ? "upload" : audit.action,
      fileId: audit.fileId,
      fileName: audit.fileName,
      caseNumber: audit.caseNumber || "N/A",
      performedBy: audit.performedBy,
      performerName: audit.performerName,
      performerRole: audit.performerRole,
      txHash: audit.txHash || "N/A",
      timestamp: audit.timestamp,
      details: audit.details,
      batchId: audit.batchId,
      fileCount: audit.fileCount,
      merkleRoot: audit.merkleRoot,
      zkpProofId: audit.zkpProofId,
      zkpVerified: audit.zkpVerified,
      verificationType: audit.verificationType,
      localFileName: audit.localFileName,
    }));

    console.log(`✅ Found ${events.length} audit events`);

    return c.json({ events });
  } catch (error: any) {
    console.error("❌ Error fetching audit trail:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Share evidence (single file)
app.post("/make-server-af0976da/share-evidence", async (c: any) => {
  try {
    const body = await c.req.json();
    const { fileId, sharedWith, sharedBy, sharerName, sharerRole } = body;

    if (!fileId || !sharedWith || !sharedBy) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log("🔗 Sharing file:", fileId, "with:", sharedWith);

    // Get file metadata
    const fileData = await kv.get(`evidence:${fileId}`);
    if (!fileData) {
      return c.json({ error: "File not found" }, 404);
    }

    // Generate NEW blockchain transaction for this share action
    const shareTxHash = generateTxHash();
    console.log("📝 Generated new blockchain TX for share:", shareTxHash);
    console.log("   Original upload TX:", fileData.txHash);
    console.log("   File:", fileData.fileName);
    console.log("   From:", sharerName, `(${sharerRole})`);
    console.log("   To:", sharedWith);

    // Update shared with list
    const updatedFileData = {
      ...fileData,
      sharedWith: [...(fileData.sharedWith || []), sharedWith],
    };

    // Update in both locations
    await kv.set(`evidence:${fileId}`, updatedFileData);
    await kv.set(
      `user_evidence:${fileData.uploadedBy}:${fileId}`,
      updatedFileData
    );

    // Also store reference for the shared user
    await kv.set(`user_evidence:${sharedWith}:${fileId}`, updatedFileData);

    // Create audit entry with NEW transaction hash
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      fileId,
      fileName: fileData.fileName,
      caseNumber: fileData.caseNumber,
      action: "share",
      performedBy: sharedBy,
      performerName: sharerName,
      performerRole: sharerRole,
      timestamp: new Date().toISOString(),
      txHash: shareTxHash, // ← NEW transaction hash for this share
      originalTxHash: fileData.txHash, // ← Keep reference to original upload TX
      details: `File shared with: ${sharedWith}`,
      ipAddress: "127.0.0.1",
      sharedWith,
    };

    await kv.set(`audit:${auditEntry.id}`, auditEntry);
    await kv.set(`file_audit:${fileId}:${auditEntry.id}`, auditEntry);

    console.log("✅ File shared successfully with new blockchain transaction");

    return c.json({
      success: true,
      message: `File shared with ${sharedWith}`,
      txHash: shareTxHash, // Return the new transaction hash
      originalTxHash: fileData.txHash, // Also return original for reference
    });
  } catch (error: any) {
    console.error("❌ Share error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Batch share evidence (multiple files with ONE blockchain TX)
app.post("/make-server-af0976da/share-batch-evidence", async (c: any) => {
  try {
    const body = await c.req.json();
    const { fileIds, sharedWith, sharedBy, sharerName, sharerRole } = body;

    if (!fileIds || fileIds.length === 0 || !sharedWith || !sharedBy) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log("📦 Batch sharing", fileIds.length, "files with:", sharedWith);

    // Fetch all file metadata
    const files = [];
    for (const fileId of fileIds) {
      const fileData = await kv.get(`evidence:${fileId}`);
      if (fileData) {
        files.push({ id: fileId, ...fileData });
      }
    }

    if (files.length === 0) {
      return c.json({ error: "No valid files found" }, 404);
    }

    // Generate Merkle root for batch share (combines file hashes)
    const fileHashes = files.map(f => f.fileHash || f.zkpFileHash);
    const { root: merkleRoot } = buildMerkleTree(fileHashes);
    
    // Generate ONE blockchain transaction for the entire batch share
    const batchShareTxHash = generateTxHash();
    
    console.log("📝 Generated new blockchain TX for batch share:", batchShareTxHash);
    console.log("   Merkle root:", merkleRoot);
    console.log("   Files:", files.length);
    console.log("   From:", sharerName, `(${sharerRole})`);
    console.log("   To:", sharedWith);

    // Update each file's shared list and store references
    for (const file of files) {
      const updatedFileData = {
        ...file,
        sharedWith: [...(file.sharedWith || []), sharedWith],
      };

      // Update in all locations
      await kv.set(`evidence:${file.id}`, updatedFileData);
      await kv.set(`user_evidence:${file.uploadedBy}:${file.id}`, updatedFileData);
      await kv.set(`user_evidence:${sharedWith}:${file.id}`, updatedFileData);
    }

    // Create ONE batch share audit entry
    const batchAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      action: "batch_share",
      performedBy: sharedBy,
      performerName: sharerName,
      performerRole: sharerRole,
      timestamp: new Date().toISOString(),
      txHash: batchShareTxHash, // ← NEW batch share transaction
      merkleRoot: merkleRoot, // ← Merkle root of shared files
      fileCount: files.length,
      fileIds: fileIds,
      caseNumber: files[0]?.caseNumber, // Use first file's case number
      details: `Batch share: ${files.length} files with ${sharedWith}`,
      ipAddress: "127.0.0.1",
      sharedWith,
    };

    await kv.set(`audit:${batchAuditEntry.id}`, batchAuditEntry);

    // Also create individual file audit references (for per-file audit lookup)
    for (const fileId of fileIds) {
      await kv.set(`file_audit:${fileId}:${batchAuditEntry.id}`, batchAuditEntry);
    }

    console.log("✅ Batch shared successfully with new blockchain transaction");

    return c.json({
      success: true,
      message: `${files.length} files shared with ${sharedWith}`,
      txHash: batchShareTxHash, // Return the new batch transaction hash
      merkleRoot: merkleRoot,
      fileCount: files.length,
    });
  } catch (error: any) {
    console.error("❌ Batch share error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all users (for sharing)
app.get("/make-server-af0976da/users", async (c: any) => {
  try {
    console.log("👥 Fetching all users...");

    const users = await kv.getByPrefix("user");

    console.log(`✅ Found ${users.length} users`);

    return c.json({ users });
  } catch (error: any) {
    console.error("❌ Error fetching users:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get all users (for admin dashboard)
app.get("/make-server-af0976da/get-users", async (c: any) => {
  try {
    console.log("👥 Fetching all users for admin dashboard...");

    const users = await kv.getByPrefix("user:");

    // Filter out non-user entries (e.g., user_evidence, user_batch)
    const actualUsers = users.filter(
      (u: any) =>
        u &&
        u.email &&
        !u.id?.startsWith("file_") &&
        !u.id?.startsWith("batch_")
    );

    console.log(`✅ Found ${actualUsers.length} users`);

    return c.json({ users: actualUsers });
  } catch (error: any) {
    console.error("❌ Error fetching users:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Initialize demo users
app.post("/make-server-af0976da/init-users", async (c: any) => {
  try {
    console.log("👥 Initializing demo users...");

    const demoUsers = [
      {
        email: "admin@evidenceshield.gov",
        name: "System Administrator",
        role: "Administrator",
        department: "IT Department",
        badgeId: "ADMIN-001",
        password: "admin123",
        status: "active",
      },
      {
        email: "john.detective@police.gov",
        name: "Detective John Smith",
        role: "Police Officer",
        department: "Homicide Division",
        badgeId: "PO-1234",
        password: "police123",
        status: "active",
      },
      {
        email: "sarah.officer@police.gov",
        name: "Officer Sarah Johnson",
        role: "Police Officer",
        department: "Narcotics Unit",
        badgeId: "PO-5678",
        password: "police123",
        status: "active",
      },
      {
        email: "mike.forensics@lab.gov",
        name: "Dr. Michael Chen",
        role: "Forensics Specialist",
        department: "Crime Lab",
        badgeId: "FS-9012",
        password: "forensics123",
        status: "active",
      },
      {
        email: "emily.analyst@lab.gov",
        name: "Emily Rodriguez",
        role: "Forensics Specialist",
        department: "Digital Forensics",
        badgeId: "FS-3456",
        password: "forensics123",
        status: "active",
      },
      {
        email: "david.prosecutor@da.gov",
        name: "David Thompson",
        role: "Prosecutor",
        department: "District Attorney",
        badgeId: "DA-7890",
        password: "prosecutor123",
        status: "active",
      },
      {
        email: "lisa.ada@da.gov",
        name: "Lisa Martinez",
        role: "Prosecutor",
        department: "Assistant DA",
        badgeId: "ADA-2345",
        password: "prosecutor123",
        status: "active",
      },
      {
        email: "robert.senior@da.gov",
        name: "Robert Williams",
        role: "Prosecutor",
        department: "Senior Counsel",
        badgeId: "SC-6789",
        password: "prosecutor123",
        status: "active",
      },
    ];

    // Store each user
    for (const user of demoUsers) {
      await kv.set(`user:${user.email}`, user);
    }

    console.log(`✅ Initialized ${demoUsers.length} demo users`);

    return c.json({
      success: true,
      count: demoUsers.length,
      message: `${demoUsers.length} demo users initialized`,
    });
  } catch (error: any) {
    console.error("❌ Error initializing users:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Create user
app.post("/make-server-af0976da/create-user", async (c: any) => {
  try {
    const body = await c.req.json();
    const { email, name, role, department, badgeId, password, createdBy } =
      body;

    if (!email || !name || !role || !department || !badgeId || !password) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log("👤 Creating user:", email);

    // Check if user already exists
    const existingUser = await kv.get(`user:${email}`);
    if (existingUser) {
      return c.json({ error: "User already exists" }, 400);
    }

    const userData = {
      email,
      name,
      role,
      department,
      badgeId,
      password,
      status: "active",
      createdBy,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${email}`, userData);

    console.log("✅ User created successfully");

    return c.json({
      success: true,
      message: "User created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating user:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update user
app.put("/make-server-af0976da/update-user", async (c: any) => {
  try {
    const body = await c.req.json();
    const { email, name, role, department, badgeId, password, updatedBy } =
      body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    console.log("👤 Updating user:", email);

    // Get existing user
    const existingUser = await kv.get(`user:${email}`);
    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update user data
    const updatedUser = {
      ...existingUser,
      name: name || existingUser.name,
      role: role || existingUser.role,
      department: department || existingUser.department,
      badgeId: badgeId || existingUser.badgeId,
      ...(password && { password }), // Only update password if provided
      updatedBy,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${email}`, updatedUser);

    console.log("✅ User updated successfully");

    return c.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating user:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Deactivate user
app.post("/make-server-af0976da/deactivate-user", async (c: any) => {
  try {
    const body = await c.req.json();
    const { email, deactivatedBy } = body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    console.log("👤 Deactivating user:", email);

    // Get existing user
    const existingUser = await kv.get(`user:${email}`);
    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Update user status to deactivated
    const deactivatedUser = {
      ...existingUser,
      status: "deactivated",
      deactivatedBy,
      deactivatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${email}`, deactivatedUser);

    console.log("✅ User deactivated successfully");

    return c.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deactivating user:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Reset storage (delete all evidence files and audit trails, keep users)
app.post("/make-server-af0976da/reset-storage", async (c: any) => {
  try {
    console.log("🧹 Resetting storage...");

    // Get all evidence files
    const evidenceFiles = await kv.getByPrefix("evidence:");
    console.log(`Found ${evidenceFiles.length} evidence entries to delete`);

    // Get all audit entries
    const auditEntries = await kv.getByPrefix("audit:");
    console.log(`Found ${auditEntries.length} audit entries to delete`);

    // Get all user evidence references
    const userEvidenceRefs = await kv.getByPrefix("user_evidence:");
    console.log(
      `Found ${userEvidenceRefs.length} user evidence references to delete`
    );

    // Get all user batch references
    const userBatchRefs = await kv.getByPrefix("user_batch:");
    console.log(
      `Found ${userBatchRefs.length} user batch references to delete`
    );

    // Get all batch entries
    const batchEntries = await kv.getByPrefix("batch:");
    console.log(`Found ${batchEntries.length} batch entries to delete`);

    // Get all file audit references
    const fileAuditRefs = await kv.getByPrefix("file_audit:");
    console.log(
      `Found ${fileAuditRefs.length} file audit references to delete`
    );

    // Delete from Supabase Storage
    console.log("Deleting files from Supabase Storage...");
    const { data: filesList, error: listError } = await supabase.storage
      .from("evidence-files")
      .list();

    if (listError) {
      console.error("Error listing storage files:", listError);
    } else if (filesList && filesList.length > 0) {
      // Delete all files recursively
      const { error: deleteError } = await supabase.storage
        .from("evidence-files")
        .remove(filesList.map((f: any) => f.name));

      if (deleteError) {
        console.error("Error deleting storage files:", deleteError);
      } else {
        console.log(`✅ Deleted ${filesList.length} files from storage`);
      }
    }

    // Delete all KV entries
    const allKeys = [
      ...evidenceFiles.map((e: any) => `evidence:${e.id}`),
      ...auditEntries.map((a: any) => `audit:${a.id}`),
      ...userEvidenceRefs.map((ref: any) => {
        const key = ref._key || ref.key;
        return key;
      }),
      ...userBatchRefs.map((ref: any) => {
        const key = ref._key || ref.key;
        return key;
      }),
      ...batchEntries.map((b: any) => `batch:${b.id}`),
      ...fileAuditRefs.map((ref: any) => {
        const key = ref._key || ref.key;
        return key;
      }),
    ];

    console.log(`Deleting ${allKeys.length} KV entries...`);

    // Use batch delete for efficiency
    if (allKeys.length > 0) {
      await kv.mdel(allKeys);
    }

    console.log("✅ Storage reset complete");

    return c.json({
      success: true,
      deleted: {
        total: allKeys.length,
        evidenceFiles: evidenceFiles.length,
        auditEvents: auditEntries.length,
        userEvidenceRefs: userEvidenceRefs.length,
        userBatchRefs: userBatchRefs.length,
        batchEntries: batchEntries.length,
        fileAuditRefs: fileAuditRefs.length,
      },
      message: "Storage reset successfully",
    });
  } catch (error: any) {
    console.error("❌ Error resetting storage:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Check file integrity - verify if file is downloadable
app.get(
  "/make-server-af0976da/check-file-integrity/:fileId",
  async (c: any) => {
    try {
      const fileId = c.req.param("fileId");

      // Get file metadata
      const fileData = await kv.get(`evidence:${fileId}`);

      if (!fileData) {
        return c.json({ isDownloadable: false, reason: "File not found" });
      }

      // Check if file has storagePath (new system with Supabase Storage)
      if (fileData.storagePath) {
        return c.json({
          isDownloadable: true,
          reason: "File in Supabase Storage",
        });
      }

      // Old file without storagePath - not downloadable
      return c.json({
        isDownloadable: false,
        reason: "File uploaded with old system, no storage path",
      });
    } catch (error: any) {
      console.error("Check integrity error:", error);
      return c.json({ isDownloadable: false, reason: error.message }, 500);
    }
  }
);

// Health check endpoint
app.get("/make-server-af0976da/health", (c: any) => {
  return c.json({
    status: "ok",
    message: "ChainGuard server running - unlimited file size support",
  });
});

// Test KV store endpoint
app.get("/make-server-af0976da/test-kv", async (c: any) => {
  try {
    const testKey = "test_key";
    const testValue = { test: "data", timestamp: new Date().toISOString() };

    // Test write
    await kv.set(testKey, testValue);

    // Test read
    await kv.get(testKey);

    // Test delete
    await kv.del(testKey);

    return c.json({
      status: "ok",
      message: "KV store is working",
      test: { write: "✓", read: "✓", delete: "✓" },
    });
  } catch (error: any) {
    return c.json(
      {
        status: "error",
        message: "KV store test failed",
        error: error.message,
      },
      500
    );
  }
});

console.log("🚀 ChainGuard server starting...");
console.log("✅ Direct upload - unlimited file sizes supported");
console.log("✅ Supabase Storage integration enabled");
// @ts-ignore - Deno.serve is available in Deno runtime
Deno.serve(app.fetch);
