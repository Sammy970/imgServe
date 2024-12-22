"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const signOut = async () => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    await supabase.auth.signOut();

    // Clear any stored data
    localStorage.clear();

    revalidatePath("/", "layout");
    redirect("/login");
  } catch (error) {
    console.error("Error in SignOut:", error);
  }
};
