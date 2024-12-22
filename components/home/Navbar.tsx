"use client";

import React, { useLayoutEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { AiOutlineUser } from "react-icons/ai";
import { TbBell } from "react-icons/tb";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useUser } from "@/context/UserContext";
import { signOut } from "./actions";

export const UserDropDown = () => {
  const router = useRouter();

  const { setUser, setProfile, profile, loading } = useUser();

  const logout = async () => {
    try {
      await signOut()
        .then(() => {
          setUser(null);
          setProfile(null);
          router.push("/login");
        })
        .catch((error) => {
          console.error("Error logging out:", error);
        });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="lg"
          variant={"ghost"}
          className="bg-bgBeige ring-0 hover:bg-bgBeige flex items-center justify-center outline-none focus:ring-0 px-2 py-2 font-archivo text-black"
        >
          <AiOutlineUser
            className="hover:cursor-pointer"
            onClick={() => {}}
            size={20}
          />
          <span className="truncate font-semibold">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              profile?.first_name
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-32 rounded-lg bg-bgBeige"
        side={"bottom"}
        align="end"
        sideOffset={4}
      >
        <Button
          onClick={logout}
          variant={"ghost"}
          className="hover:bg-bgLightGreen/60 w-full flex items-center justify-start"
        >
          <LogOut />
          Log out
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Navbar = () => {
  const router = useRouter();

  const { fetchUserAndProfile, user, profile } = useUser();

  useLayoutEffect(() => {
    if (!user || !profile) {
      fetchUserAndProfile();
    }
  }, []);

  const currentPageName = usePathname().split("/")[1].toLowerCase();
  const currentPageNameUpper =
    currentPageName.charAt(0).toUpperCase() + currentPageName.slice(1);

  const [currentPage, setCurrentPage] = useState(currentPageNameUpper);

  const buttons = ["Home", "Upload", "Gallery", "Settings"];

  return (
    <Card className="w-full max-w-3xl rounded-[12px] mx-auto bg-bgBeige border-none">
      <CardContent className="flex items-center justify-between py-2 px-7">
        <h1 className="font-archivo-black text-[22px] leading-6 tracking-wider">
          IMAGE <br /> SERVE
        </h1>
        <div className="flex items-center gap-3">
          {buttons.map((button) => (
            <Button
              key={button}
              onClick={() => {
                setCurrentPage(button);
                if (button === "Home") {
                  router.push("/");
                } else {
                  router.push(`/${button.toLowerCase()}`);
                }
              }}
              variant="ghost"
              className={`hover:bg-bgLightGreen focus:bg-bgLightGreen font-archivo font-semibold text-base ${
                currentPage === button ? "bg-bgLightGreen" : ""
              }`}
            >
              {button}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-8">
          <TbBell className="hover:cursor-pointer" size={20} />
          <UserDropDown />
        </div>
      </CardContent>
    </Card>
  );
};
