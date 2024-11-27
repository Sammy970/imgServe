"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Image from "next/image";
import { LuUpload } from "react-icons/lu";
import { Button } from "../ui/button";

interface UploadDocProps {
  selectedDocs: File[];
  setSelectedDocs: React.Dispatch<React.SetStateAction<File[]>>;
}

const UploadBox = ({ selectedDocs, setSelectedDocs }: UploadDocProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    // Convert FileList to Array for easier handling
    const fileArray = Array.from(files);

    // Validate files
    const validFiles = fileArray.filter((file) => {
      const validTypes = ["image/png", "image/jpeg", "image/webp"];
      const validSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      return validTypes.includes(file.type) && validSize;
    });

    // Check for duplicates
    const duplicateFiles = validFiles.filter((file) => {
      const isDuplicate = selectedDocs.some(
        (selectedFile) =>
          selectedFile.name === file.name &&
          selectedFile.size === file.size &&
          selectedFile.type === file.type &&
          selectedFile.lastModified === file.lastModified
      );
      return isDuplicate;
    });

    const newFiles = validFiles.filter(
      (file) => !duplicateFiles.includes(file)
    );

    setSelectedDocs([...selectedDocs, ...newFiles]);
  };

  const onUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/png, image/jpeg, image/webp";

    input.onchange = (e) => {
      handleFiles((e.target as HTMLInputElement).files);
    };

    input.click();
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  return (
    <div
      onClick={onUpload}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-[3px] border-dashed flex flex-col items-center justify-center 
        border-bgDarkGreen rounded-lg p-5 w-[50%] gap-3 mr-8 
        hover:cursor-pointer transition-all duration-200
        ${isDragging ? "border-bgBeige bg-bgDarkGreen/10" : ""}
      `}
    >
      <LuUpload
        size={28}
        className={`animate-in ${isDragging ? "text-bgBeige" : ""}`}
      />
      <p className="text-base font-archivo font-semibold text-center tracking-wider selection:bg-bgBeige">
        Drag & Drop your images here or click to upload
      </p>
      <Button className="px-10 py-3 w-[85%] font-archivo font-semibold text-black bg-bgBeige hover:bg-bgBeige/80">
        Choose Files from your computer
      </Button>
    </div>
  );
};

const UploadDoc = ({ selectedDocs, setSelectedDocs }: UploadDocProps) => {
  return (
    <Card className="w-full max-w-3xl mx-auto bg-bgLightGreen border-none overflow-hidden">
      <CardHeader className="p-3">
        <CardTitle className="text-2xl pl-3 font-archivo-black font-normal tracking-wider selection:bg-bgBeige">
          Upload Images
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-end p-0 py-3 px-10 relative">
        <Image
          src={require("@/assets/upload/uploadperson.png")}
          alt="Upload Person"
          priority={true}
          className="absolute left-[5%]"
          width={220}
        />
        <UploadBox
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
        />
      </CardContent>
    </Card>
  );
};

export default UploadDoc;
