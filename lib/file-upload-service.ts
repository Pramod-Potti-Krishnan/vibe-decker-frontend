import { tokenManager } from './token-manager';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  fileId: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export class FileUploadService {
  private uploadUrl: string;

  constructor(uploadUrl: string = '/api/upload') {
    this.uploadUrl = uploadUrl;
  }

  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const token = await tokenManager.getValidToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata if provided
    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            options.onProgress!(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              fileId: response.file_id,
              filename: file.name,
              url: response.upload_url,
              size: file.size,
              mimeType: file.type
            });
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Open connection and set headers
      xhr.open('POST', this.uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      // Send the request
      xhr.send(formData);
    });
  }

  async uploadMultiple(
    files: File[], 
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    let uploadedSize = 0;

    for (const file of files) {
      const fileProgress = (progress: number) => {
        const overallProgress = Math.round(
          ((uploadedSize + (file.size * progress / 100)) / totalSize) * 100
        );
        options.onProgress?.(overallProgress);
      };

      const result = await this.uploadFile(file, {
        ...options,
        onProgress: fileProgress
      });

      results.push(result);
      uploadedSize += file.size;
    }

    return results;
  }

  // Validate file before upload
  validateFile(
    file: File, 
    allowedTypes?: string[], 
    maxSize?: number
  ): { valid: boolean; error?: string } {
    // Check file type
    if (allowedTypes && allowedTypes.length > 0) {
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Handle wildcard types like 'image/*'
          const baseType = type.slice(0, -2);
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`
      };
    }

    return { valid: true };
  }

  // Format file size for display
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  // Generate presigned URL for direct upload (if backend supports it)
  async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
    size: number
  ): Promise<{ uploadUrl: string; fileId: string }> {
    const token = await tokenManager.getValidToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename,
        mime_type: mimeType,
        size
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get presigned upload URL');
    }

    return response.json();
  }
}

// Create singleton instance
export const fileUploadService = new FileUploadService();

// React hook for file uploads
import { useState, useCallback } from 'react';

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await fileUploadService.uploadFile(file, {
        ...options,
        onProgress: (p) => {
          setProgress(p);
          options?.onProgress?.(p);
        }
      });

      setUploading(false);
      setProgress(100);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      return null;
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    options?: UploadOptions
  ): Promise<UploadResult[]> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const results = await fileUploadService.uploadMultiple(files, {
        ...options,
        onProgress: (p) => {
          setProgress(p);
          options?.onProgress?.(p);
        }
      });

      setUploading(false);
      setProgress(100);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadMultiple,
    uploading,
    progress,
    error,
    reset
  };
}