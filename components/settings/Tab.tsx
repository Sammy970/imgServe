import React from "react";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";

interface TabProps {
  name: string;
  icon: string;
}

const Tab = ({ name, icon }: TabProps) => {
  return (
    <Card className="bg-bgLightGreen rounded-xl border-none w-full relative overflow-hidden">
      <CardContent className="p-0 flex justify-evenly items-center px-2">
        <div className="pl-2 w-[40%]">
          <p className="font-archivo text-2xl font-bold">{name}</p>
        </div>
        <Image
          src={require(`@/assets/settings/${icon}`)}
          alt={name}
          className={`relative -bottom-1`}
          width={140}
          height={140}
        />
      </CardContent>
    </Card>
  );
};

export default Tab;
