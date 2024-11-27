import Image from "next/image";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Trash } from "lucide-react";

interface DisplayDocProps {
  url: string;
  name: string;
  size: number;
  type: string;
  onRemoveDoc: (name: string) => void;
}

const DisplayDoc = ({
  url,
  name,
  size,
  type,
  onRemoveDoc,
}: DisplayDocProps) => {
  //   show in mb and kb accordingly
  const fileSize = size / 1024 / 1024;
  const fileSizeInKB = size / 1024;
  const fileType = type.split("/")[1];
  const fileName = name.split(".")[0];

  return (
    <Card className="w-full rounded-lg shadow-xl bg-bgBeige">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-lg font-archivo font-semibold truncate text-left">
          {fileName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 px-4">
        <Image
          src={url}
          alt={name}
          className="w-full h-[150px] object-contain"
          width={150}
          height={100}
        />
      </CardContent>
      <CardFooter className="p-4 flex-col selection:text-bgDarkGreen">
        <div className="flex justify-evenly items-center w-full mx-auto">
          <Badge className="bg-bgDarkGreen hover:bg-bgDarkGreen/80 text-[16px] px-5 text-bgBeige font-archivo font-semibold">
            {fileType}
          </Badge>
          <Badge className="bg-bgDarkGreen hover:bg-bgDarkGreen/80 text-[16px] px-5 text-bgBeige font-archivo font-semibold">
            {fileSize > 1
              ? `${fileSize.toFixed(2)} MB`
              : `${fileSizeInKB.toFixed(2)} KB`}
          </Badge>
        </div>
        <Button
          onClick={() => onRemoveDoc(name)}
          variant={"ghost"}
          className="w-full mt-3 bg-bgRed hover:bg-bgRed/90 items-center justify-center text-[14px] text-bgBeige hover:text-bgBeige/90 font-archivo font-semibold"
        >
          <Trash className="mr-1" />
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DisplayDoc;
