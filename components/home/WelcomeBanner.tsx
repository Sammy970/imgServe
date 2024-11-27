import React from "react";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";
const WelcomeBanner = () => {
  return (
    <Card className="w-full max-w-3xl rounded-[12px] mx-auto bg-bgLightGreen border-none">
      <CardContent className="flex items-center justify-between px-7 pl-2 py-0 relative overflow-hidden">
        <Image
          src={require("@/assets/home/Person.png")}
          alt="Welcome Person - Samyak"
          className="relative"
          width={160}
          priority
        />
        <Image
          src={require("@/assets/home/Arrow.png")}
          alt="Arrow"
          className=""
          width={80}
          priority
        />
        <div className="flex flex-col gap-2 items-end">
          <h2 className="font-archivo-black text-2xl text-right">
            Welcome to IMAGE SERVE
          </h2>
          <p className="font-archivo text-base tracking-wide text-right leading-7">
            Get Started by uploading an image or exploring your gallery.
            <br />
            Need help ? Check out our{" "}
            <span className="underline font-archivo-black">
              quick start guide
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeBanner;
