"use client";

import { Navbar } from "@/components/home/Navbar";
import WelcomeBanner from "@/components/home/WelcomeBanner";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { checkUser } from "./actions";

export default function Home() {
  const router = useRouter();

  useLayoutEffect(() => {
    checkUser()
      .then((res) => {
        if (res?.result === "Not authenticated") {
          router.push("/login");
        }

        if (res?.result === "error") {
          console.error("Error checking user:", res.error);
        }
      })
      .catch((err) => {
        console.error("Error checking user:", err);
      });
  }, []);

  return (
    <>
      <div className="pt-10">
        <Navbar />
      </div>
      <div className="pt-10">
        <WelcomeBanner />
      </div>
    </>
  );
}
