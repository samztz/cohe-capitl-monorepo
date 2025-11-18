import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * SignatureStorageService
 *
 * Handles storage of handwritten signature images.
 * Default implementation stores files locally to disk.
 *
 * For production: Replace with cloud storage (S3/R2/OBS) by:
 * 1. Implementing uploadToS3() method
 * 2. Returning signed URLs instead of relative paths
 * 3. Adding S3 client configuration
 *
 * Example S3 integration:
 * ```ts
 * import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
 *
 * const s3 = new S3Client({ region: 'us-east-1' });
 * await s3.send(new PutObjectCommand({
 *   Bucket: 'signatures',
 *   Key: filename,
 *   Body: buffer,
 *   ContentType: 'image/png',
 * }));
 * ```
 */
@Injectable()
export class SignatureStorageService {
  private readonly logger = new Logger(SignatureStorageService.name);
  private readonly storageDir: string;

  constructor() {
    // Get storage directory from env, default to 'uploads/signatures'
    this.storageDir = process.env.SIGNATURE_STORAGE_DIR || 'uploads/signatures';
  }

  /**
   * Save signature image to storage and calculate hash
   *
   * @param buffer - Image buffer (PNG)
   * @param mimeType - MIME type (e.g., 'image/png')
   * @param policyId - Policy ID for filename
   * @returns Object with URL (relative path) and SHA256 hash
   */
  async saveSignatureImage(
    buffer: Buffer,
    mimeType: string,
    policyId: string,
  ): Promise<{ url: string; hash: string }> {
    try {
      // Ensure storage directory exists
      await this.ensureStorageDir();

      // Generate filename: {policyId}-{timestamp}.png
      const timestamp = Date.now();
      const extension = mimeType === 'image/png' ? 'png' : 'jpg';
      const filename = `${policyId}-${timestamp}.${extension}`;
      const filepath = path.join(this.storageDir, filename);

      // Calculate SHA256 hash
      const hash = createHash('sha256').update(buffer).digest('hex');

      // Write file to disk
      await fs.writeFile(filepath, buffer);

      this.logger.log(`Signature saved: ${filename}, hash: ${hash}`);

      // Return relative URL path (will be served by @fastify/static)
      // Format: /uploads/signatures/{filename}
      const url = `/uploads/signatures/${filename}`;

      return { url, hash };
    } catch (error: any) {
      this.logger.error(
        `Failed to save signature image: ${error?.message || 'Unknown error'}`,
      );
      throw new Error('Failed to save signature image');
    }
  }

  /**
   * Ensure storage directory exists, create if not
   */
  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.access(this.storageDir);
    } catch (error) {
      // Directory doesn't exist, create it (recursively)
      this.logger.log(`Creating signature storage directory: ${this.storageDir}`);
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  /**
   * Delete signature image (optional cleanup method)
   *
   * @param url - Relative URL path of the image
   */
  async deleteSignatureImage(url: string): Promise<void> {
    try {
      // Extract filename from URL (/uploads/signatures/{filename})
      const filename = path.basename(url);
      const filepath = path.join(this.storageDir, filename);

      await fs.unlink(filepath);
      this.logger.log(`Signature deleted: ${filename}`);
    } catch (error: any) {
      this.logger.warn(
        `Failed to delete signature image: ${error?.message || 'Unknown error'}`,
      );
      // Don't throw - deletion is optional cleanup
    }
  }

  /**
   * Get absolute file path for a signature URL
   * Useful for Admin panel protected downloads
   *
   * @param url - Relative URL path
   * @returns Absolute file path
   */
  getAbsolutePath(url: string): string {
    const filename = path.basename(url);
    return path.join(process.cwd(), this.storageDir, filename);
  }
}
