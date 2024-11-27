"use client";

import { Navbar } from "@/components/home/Navbar";
import WelcomeBanner from "@/components/home/WelcomeBanner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const userData = await supabase.auth.getUser();
      if (!userData) {
        router.push("/login");
      } 
    };
    checkUser();
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
