"use client";

import { useState } from "react";

import { Button } from "~/ui/primitives/button";

interface S3UploadButtonProps {
  accept?: string;
  children?: React.ReactNode;
  className?: string;
  maxSize?: number;
  onUploadComplete?: (result: {
    key: string;
    type: string;
    url: string;
  }) => void;
  onUploadError?: (error: Error) => void;
}

export function S3UploadButton({
  accept = "image/*,video/*",
  children = "选择文件",
  className,
  maxSize = 64 * 1024 * 1024,
  onUploadComplete,
  onUploadError,
}: S3UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert("文件太大");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/s3-upload", {
        body: formData,
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = (await response.json()) as { data: any };
      onUploadComplete?.(result.data);
    } catch (error) {
      console.error("Upload error:", error);
      onUploadError?.(error as Error);
      alert("上传失败");
    } finally {
      setIsUploading(false);
      // reset input
      event.target.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        accept={accept}
        disabled={isUploading}
        id="s3-file-input"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        type="file"
      />
      <Button asChild className="cursor-pointer" disabled={isUploading}>
        <label htmlFor="s3-file-input">
          {isUploading ? "上传中..." : children}
        </label>
      </Button>
    </div>
  );
}
