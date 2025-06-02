"use client";

import { ImagePlus, X } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";

import { cn } from "~/lib/cn";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";

interface FileUploaderProps {
  accept?: Record<string, string[]>;
  className?: string;
  disabled?: boolean;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  onUploadComplete?: (
    results: { key: string; type: string; url: string }[],
  ) => void;
  value?: File[];
}

export function FileUploader({
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
  className,
  disabled = false,
  maxFiles = 1,
  maxSize = 64 * 1024 * 1024, // 64mb
  multiple = false,
  onFilesChange,
  onUploadComplete,
  value = [],
}: FileUploaderProps) {
  const [files, setFiles] = React.useState<File[]>(value);
  const [isUploading, setIsUploading] = React.useState(false);
  const [previews, setPreviews] = React.useState<string[]>([]);

  const uploadFiles = React.useCallback(
    async (filesToUpload?: File[]) => {
      const targetFiles = filesToUpload || files;
      if (targetFiles.length === 0) return;

      setIsUploading(true);
      const results: { key: string; type: string; url: string }[] = [];

      try {
        for (const file of targetFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/s3-upload", {
            body: formData,
            method: "POST",
          });

          if (!response.ok) {
            throw new Error(`upload failed for ${file.name}`);
          }

          const result = (await response.json()) as { data: any };
          results.push(result.data);
        }

        onUploadComplete?.(results);
        // clear files after successful upload
        setFiles([]);
        setPreviews([]);
        onFilesChange?.([]);
      } catch (error) {
        console.error("upload error:", error);
        alert("上传失败");
      } finally {
        setIsUploading(false);
      }
    },
    [files, onUploadComplete, onFilesChange],
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = multiple
        ? [...files, ...acceptedFiles].slice(0, maxFiles)
        : acceptedFiles.slice(0, maxFiles);

      setFiles(newFiles);
      onFilesChange?.(newFiles);

      // generate previews for images
      const newPreviews: string[] = [];
      for (const file of newFiles) {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            newPreviews.push(reader.result as string);
            if (
              newPreviews.length ===
              newFiles.filter((f) => f.type.startsWith("image/")).length
            ) {
              setPreviews(newPreviews);
            }
          };
          reader.readAsDataURL(file);
        }
      }

      // 自动上传文件
      setTimeout(() => {
        uploadFiles(newFiles);
      }, 100);
    },
    [files, maxFiles, multiple, onFilesChange, uploadFiles],
  );

  const { fileRejections, getInputProps, getRootProps, isDragActive } =
    useDropzone({
      accept,
      disabled: disabled || isUploading,
      maxFiles,
      maxSize,
      multiple,
      onDrop,
    });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesChange?.(newFiles);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          `
            relative flex cursor-pointer flex-col items-center justify-center
            gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25
            p-8 text-center transition-colors
            hover:border-muted-foreground/50
          `,
          isDragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          files.length > 0 && "border-solid border-muted-foreground/50",
        )}
      >
        <Input {...getInputProps()} />

        {files.length > 0 ? (
          <div className="grid w-full gap-4">
            {files.map((file, index) => (
              <div
                className={`
                  flex items-center justify-between rounded-md border p-3
                `}
                key={`${file.name}-${index}`}
              >
                <div className="flex items-center gap-3">
                  {previews[index] && (
                    <img
                      alt={file.name}
                      className="size-12 rounded object-cover"
                      src={previews[index]}
                    />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <ImagePlus className="size-12 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isDragActive ? "拖放文件到这里" : "点击选择文件或拖放到这里"}
              </p>
              <p className="text-xs text-muted-foreground">
                支持 {Object.values(accept).flat().join(", ")} 格式， 最大{" "}
                {(maxSize / 1024 / 1024).toFixed(0)} MB
              </p>
            </div>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="space-y-1">
          {fileRejections.map(({ errors, file }) => (
            <p className="text-sm text-destructive" key={file.name}>
              {file.name}: {errors.map((e) => e.message).join(", ")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// hook for easier file upload management
export function useFileUpload() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = React.useState<
    { key: string; type: string; url: string }[]
  >([]);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleUploadComplete = (
    results: { key: string; type: string; url: string }[],
  ) => {
    setUploadedFiles((prev) => [...prev, ...results]);
  };

  const clearAll = () => {
    setFiles([]);
    setUploadedFiles([]);
  };

  return {
    clearAll,
    files,
    handleFilesChange,
    handleUploadComplete,
    uploadedFiles,
  };
}
