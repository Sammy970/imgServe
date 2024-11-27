"use client";

import { useLayoutEffect, useState } from "react";
import UploadDoc from "@/components/upload/UploadDoc";
import SelectedDoc from "@/components/upload/SelectedDoc";

const Upload = () => {
  const [selectedDocs, setSelectedDocs] = useState<File[]>([]);

  useLayoutEffect(() => {
    fetch("/api/getdata")
      .then((res) => res.json())
      .then((data) => console.log("data: ", data));
  }, []);

  return (
    <div className="pt-10">
      <UploadDoc
        selectedDocs={selectedDocs}
        setSelectedDocs={setSelectedDocs}
      />
      <div className="pt-10">
        <SelectedDoc
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
        />
      </div>
    </div>
  );
};

export default Upload;
