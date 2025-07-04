'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUploader({
  onUpload,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/vnd.ms-powerpoint': ['.ppt', '.pptx'],
    'application/vnd.ms-excel': ['.xls', '.xlsx'],
    'text/*': ['.txt', '.csv', '.md']
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  disabled = false,
  className
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isUploading) return;

    // Create file entries
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Upload files
    for (const fileEntry of newFiles) {
      try {
        // Update status to uploading
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileEntry.id 
            ? { ...f, status: 'uploading' } 
            : f
          )
        );

        // Simulate progress (in real app, track actual upload progress)
        const progressInterval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map(f => {
              if (f.id === fileEntry.id && f.progress < 90) {
                return { ...f, progress: f.progress + 10 };
              }
              return f;
            })
          );
        }, 200);

        // Upload file
        await onUpload([fileEntry.file]);

        // Clear interval and mark as success
        clearInterval(progressInterval);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileEntry.id 
            ? { ...f, progress: 100, status: 'success' } 
            : f
          )
        );
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileEntry.id 
            ? { 
                ...f, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Upload failed' 
              } 
            : f
          )
        );
      }
    }

    setIsUploading(false);
  }, [disabled, isUploading, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: disabled || isUploading
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive && "border-blue-500 bg-blue-50",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragActive && !disabled && "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        {isDragActive ? (
          <p className="text-sm text-blue-600">Drop the files here...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </>
        )}
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map(fileEntry => (
            <div
              key={fileEntry.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {/* File icon */}
              <div className="flex-shrink-0">
                {getFileIcon(fileEntry.file)}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileEntry.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileEntry.file.size)}
                </p>
                
                {/* Progress bar */}
                {fileEntry.status === 'uploading' && (
                  <Progress value={fileEntry.progress} className="h-1 mt-1" />
                )}
                
                {/* Error message */}
                {fileEntry.error && (
                  <p className="text-xs text-red-600 mt-1">{fileEntry.error}</p>
                )}
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {fileEntry.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {fileEntry.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {fileEntry.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {fileEntry.status !== 'uploading' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-2"
                    onClick={() => removeFile(fileEntry.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple file input for single file selection
export function SimpleFileInput({
  onFileSelect,
  accept,
  disabled = false,
  className
}: {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        id="file-input"
        className="hidden"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
      />
      <label
        htmlFor="file-input"
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md",
          "bg-white text-sm font-medium text-gray-700",
          "hover:bg-gray-50 cursor-pointer transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="h-4 w-4" />
        Choose File
      </label>
    </div>
  );
}