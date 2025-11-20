/**
 * File Encryption Utility
 * 
 * Provides client-side encryption/decryption for evidence files before IPFS storage
 * Uses AES-256-GCM for authenticated encryption
 */

export interface EncryptedFileData {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  fileName: string;
  originalSize: number;
  mimeType: string;
}

export interface EncryptionMetadata {
  iv: string; // Base64 encoded
  salt: string; // Base64 encoded
  fileName: string;
  originalSize: number;
  mimeType: string;
}

export class FileEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000;

  /**
   * Generate a cryptographic key from a password using PBKDF2
   */
  private static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES key using PBKDF2
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a secure encryption key for the user based on their credentials
   * In production, this should be derived from user authentication
   */
  static generateUserKey(userEmail: string, caseNumber: string): string {
    // In production, use a proper key management system
    // This is a simplified approach for demonstration
    return `${userEmail}-${caseNumber}-encryption-key-${Date.now()}`;
  }

  /**
   * Encrypt a file before uploading to IPFS
   */
  static async encryptFile(
    file: File,
    encryptionKey: string
  ): Promise<EncryptedFileData> {
    try {
      console.log('🔐 Starting file encryption:', file.name);

      // Generate random IV and salt
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

      // Derive encryption key from password
      const key = await this.deriveKey(encryptionKey, salt);

      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();

      // Encrypt the file
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        fileBuffer
      );

      console.log('✅ File encrypted successfully:', file.name);
      console.log('   Original size:', fileBuffer.byteLength, 'bytes');
      console.log('   Encrypted size:', encryptedData.byteLength, 'bytes');

      return {
        encryptedData,
        iv,
        salt,
        fileName: file.name,
        originalSize: file.size,
        mimeType: file.type,
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt a file after downloading from IPFS
   */
  static async decryptFile(
    encryptedData: ArrayBuffer,
    metadata: EncryptionMetadata,
    encryptionKey: string
  ): Promise<File> {
    try {
      console.log('🔓 Starting file decryption:', metadata.fileName);

      // Convert base64 strings back to Uint8Array
      const iv = this.base64ToUint8Array(metadata.iv);
      const salt = this.base64ToUint8Array(metadata.salt);

      // Derive decryption key (same process as encryption)
      const key = await this.deriveKey(encryptionKey, salt);

      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv as BufferSource,
        },
        key,
        encryptedData as BufferSource
      );

      console.log('✅ File decrypted successfully:', metadata.fileName);
      console.log('   Decrypted size:', decryptedData.byteLength, 'bytes');

      // Create a File object from decrypted data
      const decryptedFile = new File(
        [decryptedData],
        metadata.fileName,
        { type: metadata.mimeType }
      );

      return decryptedFile;
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}. The file may be corrupted or the encryption key is incorrect.`);
    }
  }

  /**
   * Create encryption metadata for storage
   */
  static createMetadata(encryptedData: EncryptedFileData): EncryptionMetadata {
    return {
      iv: this.uint8ArrayToBase64(encryptedData.iv),
      salt: this.uint8ArrayToBase64(encryptedData.salt),
      fileName: encryptedData.fileName,
      originalSize: encryptedData.originalSize,
      mimeType: encryptedData.mimeType,
    };
  }

  /**
   * Convert encrypted data to a Blob for upload
   */
  static encryptedDataToBlob(encryptedData: ArrayBuffer): Blob {
    return new Blob([encryptedData], { type: 'application/octet-stream' });
  }

  /**
   * Convert encrypted data to a File for upload
   */
  static encryptedDataToFile(
    encryptedData: EncryptedFileData,
    originalFileName: string
  ): File {
    const blob = this.encryptedDataToBlob(encryptedData.encryptedData);
    // Add .encrypted extension to indicate encrypted file
    const encryptedFileName = `${originalFileName}.encrypted`;
    return new File([blob], encryptedFileName, { type: 'application/octet-stream' });
  }

  /**
   * Utility: Convert Uint8Array to Base64
   */
  private static uint8ArrayToBase64(bytes: Uint8Array): string {
    const binString = String.fromCharCode(...bytes);
    return btoa(binString);
  }

  /**
   * Utility: Convert Base64 to Uint8Array
   */
  private static base64ToUint8Array(base64: string): Uint8Array {
    const binString = atob(base64);
    return Uint8Array.from(binString, (char) => char.charCodeAt(0));
  }

  /**
   * Generate a hash of the original file for integrity checking
   * This hash is computed BEFORE encryption for ZKP verification
   */
  static async computeFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `0x${hashHex}`;
  }

  /**
   * Compute hash of decrypted data for verification
   */
  static async computeDataHash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `0x${hashHex}`;
  }
}

/**
 * Store encryption metadata in localStorage for later decryption
 * In production, this should be stored securely in the database
 */
export function storeEncryptionMetadata(
  fileId: string,
  metadata: EncryptionMetadata,
  encryptionKey: string
): void {
  const storageKey = `encryption_${fileId}`;
  localStorage.setItem(storageKey, JSON.stringify({
    metadata,
    key: encryptionKey, // In production, NEVER store keys in localStorage
  }));
  console.log('📝 Encryption metadata stored for file:', fileId);
}

/**
 * Retrieve encryption metadata from localStorage
 */
export function getEncryptionMetadata(fileId: string): {
  metadata: EncryptionMetadata;
  key: string;
} | null {
  const storageKey = `encryption_${fileId}`;
  console.log('   Looking for encryption metadata with key:', storageKey);
  
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    console.log('   No metadata found in localStorage');
    // Debug: List all encryption keys in localStorage
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('encryption_'));
    console.log('   Available encryption keys:', allKeys);
    return null;
  }
  
  try {
    const parsed = JSON.parse(stored);
    console.log('   Metadata retrieved successfully');
    return parsed;
  } catch (error) {
    console.error('   Failed to parse metadata:', error);
    return null;
  }
}
