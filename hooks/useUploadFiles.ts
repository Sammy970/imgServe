import { useState } from "react";
import { useUploadThing } from "@/utils/uploadthing";

export const useUploadFiles = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { startUpload } = useUploadThing("imageUploader", {
    onUploadBegin: () => {
      setIsUploading(true);
      setUploadProgress(0);
    },
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setUploadProgress(0);
      console.log("Files uploaded successfully!", res);
    },
    onUploadError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      console.error("Error uploading files:", error);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const uploadAll = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      await startUpload(files);
    } catch (err) {
      console.error("Error uploading:", err);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadAll,
    isUploading,
    uploadProgress,
  };
};
