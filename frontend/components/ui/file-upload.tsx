import React, { useState, useRef, useCallback } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Alert, AlertDescription } from "./alert";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import {
  Upload,
  File,
  X,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Camera,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  base64: string;
  uploadedAt: string;
  compressedSize?: number;
}

interface FileUploadProps {
  id?: string;
  label: string;
  accept?: string;
  maxSize?: number; // in KB
  maxFiles?: number;
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  compressImages?: boolean;
  quality?: number; // 0-1 for image compression
}

// Utility function to compress images
const compressImage = (file: File, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions to maintain aspect ratio
      const maxWidth = 1200;
      const maxHeight = 1200;
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Utility function to get file size from base64
const getBase64Size = (base64: string): number => {
  const base64Length = base64.length;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.round((base64Length * 3) / 4 - padding);
};

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Utility function to get file icon
const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
  if (type === "application/pdf") return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

export function FileUpload({
  id,
  label,
  accept = "image/*,application/pdf",
  maxSize = 300, // 300KB
  maxFiles = 5,
  value = [],
  onChange,
  disabled = false,
  className = "",
  placeholder = "Click to upload or drag and drop",
  error,
  required = false,
  compressImages = true,
  quality = 0.8,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(",").map((type) => type.trim());
    const isValidType = acceptedTypes.some((acceptedType) => {
      if (acceptedType === "image/*") return file.type.startsWith("image/");
      if (acceptedType === "application/pdf")
        return file.type === "application/pdf";
      return file.type === acceptedType;
    });

    if (!isValidType) {
      return "File type not supported. Please upload JPG, PNG, or PDF files.";
    }

    // Check file size
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > maxSize) {
      return `File size exceeds ${maxSize}KB limit. Current size: ${formatFileSize(
        file.size
      )}`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<UploadedFile> => {
    let base64: string;
    let compressedSize: number | undefined;

    if (file.type.startsWith("image/") && compressImages) {
      try {
        base64 = await compressImage(file, quality);
        compressedSize = getBase64Size(base64.split(",")[1]);

        // Check if compressed size still exceeds limit
        if (compressedSize / 1024 > maxSize) {
          // Try with lower quality
          base64 = await compressImage(file, 0.6);
          compressedSize = getBase64Size(base64.split(",")[1]);
        }
      } catch (error) {
        console.error("Image compression failed:", error);
        // Fallback to original file
        base64 = await fileToBase64(file);
      }
    } else {
      base64 = await fileToBase64(file);
    }

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      base64,
      uploadedAt: new Date().toISOString(),
      compressedSize,
    };
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      const currentFileCount = value.length;

      if (currentFileCount + fileArray.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setUploading(true);
      const newFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          continue;
        }

        try {
          const processedFile = await processFile(file);

          // Final size check after processing
          const finalSize = processedFile.compressedSize || processedFile.size;
          if (finalSize / 1024 > maxSize) {
            toast.error(`${file.name}: File still too large after compression`);
            continue;
          }

          newFiles.push(processedFile);
          toast.success(`${file.name} uploaded successfully`);
        } catch (error) {
          console.error("File processing error:", error);
          toast.error(`Failed to process ${file.name}`);
        }
      }

      if (newFiles.length > 0) {
        onChange?.([...value, ...newFiles]);
      }

      setUploading(false);
    },
    [value, maxFiles, maxSize, disabled, onChange, compressImages, quality]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = value.filter((file) => file.id !== fileId);
    onChange?.(updatedFiles);
    toast.success("File removed");
  };

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement("a");
    link.href = file.base64;
    link.download = file.name;
    link.click();
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:border-gray-400"
            }
            ${error ? "border-red-500" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <Input
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleInputChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="space-y-2">
            <div className="flex justify-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-500">
              Maximum {maxFiles} files, {maxSize}KB each. Supports JPG, PNG, PDF
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Uploaded Files List */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label>
            Uploaded Files ({value.length}/{maxFiles})
          </Label>
          <div className="space-y-2">
            {(value ?? []).map((file) => (
              <Card key={file.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        {file.compressedSize && (
                          <>
                            <span>→</span>
                            <span>{formatFileSize(file.compressedSize)}</span>
                            <Badge variant="secondary" className="text-xs">
                              Compressed
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewFile(file)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {previewFile && getFileIcon(previewFile.type)}
              <span>{previewFile?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {previewFile && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Size: {formatFileSize(previewFile.size)}</span>
                <span>
                  Uploaded: {new Date(previewFile.uploadedAt).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-center bg-gray-50 rounded-lg p-4">
                {previewFile.type.startsWith("image/") ? (
                  <img
                    src={previewFile.base64}
                    alt={previewFile.name}
                    className="max-w-full max-h-96 object-contain"
                  />
                ) : previewFile.type === "application/pdf" ? (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">PDF Preview not available</p>
                    <Button
                      onClick={() => downloadFile(previewFile)}
                      className="mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Preview not available</p>
                    <Button
                      onClick={() => downloadFile(previewFile)}
                      className="mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
