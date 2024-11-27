"use client";

import React, { useCallback, useLayoutEffect, useState } from "react";
import { Button } from "../ui/button";
import DisplayDoc from "./DisplayDoc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ImCancelCircle } from "react-icons/im";
import { useUploadFiles } from "@/hooks/useUploadFiles";

interface SelectedDocProps {
  selectedDocs: File[];
  setSelectedDocs: React.Dispatch<React.SetStateAction<File[]>>;
}

interface FilterProps {
  selectedDocs: File[];
  setFilteredDocs: React.Dispatch<React.SetStateAction<File[]>>;
  setFilterOn: React.Dispatch<React.SetStateAction<boolean>>;
  filterType: string;
  setFilterType: React.Dispatch<React.SetStateAction<string>>;
}

interface HeadLineProps {
  selectedDocs: File[];
  setSelectedDocs: React.Dispatch<React.SetStateAction<File[]>>;
  setFilterOn: React.Dispatch<React.SetStateAction<boolean>>;
  setFilterType: React.Dispatch<React.SetStateAction<string>>;
}

const HeadLine = ({
  selectedDocs,
  setSelectedDocs,
  setFilterOn,
  setFilterType,
}: HeadLineProps) => {
  const { uploadAll, isUploading, uploadProgress } = useUploadFiles();

  const handleUploadAll = () => {
    if (isUploading) return;
    uploadAll(selectedDocs).then(() => {
      setSelectedDocs([]);
      setFilterOn(false);
      setFilterType("");
    });
  };

  const onClearAll = () => {
    setSelectedDocs([]);
    setFilterOn(false);
    setFilterType("");
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl text-left text-bgBeige tracking-wider font-archivo-black font-normal selection:text-bgDarkGreen">
        Selected Images
      </h1>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleUploadAll}
          variant="ghost"
          className={`bg-bgLightGreen hover:bg-bgLightGreen/80 font-archivo font-semibold tracking-wider p-0 px-5 text-[15px] relative overflow-hidden ${
            selectedDocs.length === 0
              ? "cursor-not-allowed bg-bgLightGreen/50 hover:bg-bgLightGreen/50"
              : ""
          }`}
          disabled={selectedDocs.length === 0}
        >
          {/* Progress bar overlay */}
          {isUploading && (
            <div
              className="absolute left-0 top-0 h-full bg-[#a0c054] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          )}

          {/* Button text */}
          <span className="relative z-10">
            {isUploading
              ? `Uploading ${Math.round(uploadProgress)}%`
              : "Upload all"}
          </span>
        </Button>
        <Button
          onClick={onClearAll}
          variant="ghost"
          className={`bg-bgRed hover:bg-bgRed/80 hover:text-bgBeige text-bgBeige font-archivo font-semibold tracking-wider p-0 px-5 text-[15px] ${
            selectedDocs.length === 0
              ? "cursor-not-allowed bg-bgRed/50 hover:bg-bgRed/50 text-bgBeige/50 hover:text-bgBeige/50"
              : ""
          }`}
          disabled={selectedDocs.length === 0}
        >
          Clear all
        </Button>
      </div>
    </div>
  );
};

const FilterLine = ({
  selectedDocs,
  setFilteredDocs,
  setFilterOn,
  filterType,
  setFilterType,
}: FilterProps) => {
  const [allTypes, setAllTypes] = useState<string[]>([]);

  const getAllTypes = useCallback(() => {
    const types = selectedDocs.map((doc) => doc.type.split("/")[1]);
    const uniqueTypes = [...new Set(types)];
    return uniqueTypes;
  }, []);

  useLayoutEffect(() => {
    setAllTypes(getAllTypes());
  }, [selectedDocs]);

  const handleFilter = (value: string) => {
    setFilteredDocs(
      selectedDocs.filter((doc: File) => doc.type.split("/")[1] === value)
    );
    setFilterOn(true);
    setFilterType(value);
  };

  const onClearFilter = () => {
    setFilteredDocs([]);
    setFilterOn(false);
    setFilterType("");
  };

  return (
    <div className="flex items-center justify-between pt-5 gap-5">
      <div className="flex items-center gap-2 flex-col">
        <p className="text-bgBeige w-[200px] font-archivo font-semibold tracking-wider text-[15px]">
          Filter by type
        </p>
        <Select
          onValueChange={handleFilter}
          value={filterType}
          disabled={selectedDocs.length === 0}
        >
          <SelectTrigger className="text-bgBeige border-bgBeige">
            <SelectValue
              className="text-bgBeige font-archivo font-semibold tracking-wider"
              placeholder="Select Image type"
            />
          </SelectTrigger>
          <SelectContent className="bg-bgDarkGreen border-bgBeige">
            {allTypes.map((type) => {
              return (
                <SelectItem
                  key={type}
                  value={type}
                  className="text-bgBeige hover:cursor-pointer font-archivo font-semibold tracking-wider"
                >
                  {type}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="ghost"
        className={`bg-bgLightGreen hover:bg-bgLightGreen/80 font-archivo font-semibold tracking-wider p-0 px-5 text-[15px] ${
          filterType === ""
            ? "cursor-not-allowed bg-bgLightGreen/50 hover:bg-bgLightGreen/50 "
            : ""
        }`}
        disabled={filterType === ""}
        onClick={onClearFilter}
      >
        Clear filter
      </Button>
    </div>
  );
};

const SelectedDoc = ({ selectedDocs, setSelectedDocs }: SelectedDocProps) => {
  const [filteredDocs, setFilteredDocs] = useState<File[]>([]);
  const [filterOn, setFilterOn] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("");

  const onRemoveDoc = (name: string) => {
    const updatedDocs = selectedDocs.filter((doc) => doc.name !== name);
    setSelectedDocs(updatedDocs);
    if (filteredDocs.length > 0) {
      const updatedFilteredDocs = filteredDocs.filter(
        (doc) => doc.name !== name
      );
      setFilteredDocs(updatedFilteredDocs);
    }
  };

  return (
    <div className="w-full lg:max-w-5xl md:max-w-4xl max-w-xl justify-center mx-auto">
      <HeadLine
        selectedDocs={selectedDocs}
        setSelectedDocs={setSelectedDocs}
        setFilterOn={setFilterOn}
        setFilterType={setFilterType}
      />
      <FilterLine
        setFilteredDocs={setFilteredDocs}
        selectedDocs={selectedDocs}
        setFilterOn={setFilterOn}
        filterType={filterType}
        setFilterType={setFilterType}
      />
      <div className="grid grid-cols-2 mt-5 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filterOn
          ? filteredDocs.map((doc) => {
              return (
                <DisplayDoc
                  key={URL.createObjectURL(doc)}
                  url={URL.createObjectURL(doc)}
                  name={doc.name}
                  size={doc.size}
                  type={doc.type}
                  onRemoveDoc={onRemoveDoc}
                />
              );
            })
          : selectedDocs.map((doc) => {
              return (
                <DisplayDoc
                  key={URL.createObjectURL(doc)}
                  url={URL.createObjectURL(doc)}
                  name={doc.name}
                  size={doc.size}
                  type={doc.type}
                  onRemoveDoc={onRemoveDoc}
                />
              );
            })}
      </div>

      {selectedDocs.length === 0 && (
        <div className="flex items-center justify-center mt-5 flex-col gap-3 animate-in fade-in-50 duration-500 selection:text-bgDarkGreen">
          <ImCancelCircle className="text-bgBeige text-4xl animate-bounce" />
          <p className="text-bgBeige text-center font-archivo font-semibold tracking-wider text-[17px] animate-in slide-in-from-bottom duration-700">
            No Images uploaded! <br /> Upload some images to get started.
          </p>
        </div>
      )}

      {filterOn && filteredDocs.length === 0 && (
        <div className="flex items-center justify-center mt-5 flex-col gap-3 animate-in fade-in-50 duration-500 selection:text-bgDarkGreen">
          <ImCancelCircle className="text-bgBeige text-4xl animate-bounce" />
          <p className="text-bgBeige text-center font-archivo font-semibold tracking-wider text-[17px] animate-in slide-in-from-bottom duration-700">
            No images found!
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectedDoc;
