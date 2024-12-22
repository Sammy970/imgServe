"use server";

import { createClient } from "@/utils/supabase/server";

export const signOut = async () => {
  try {
    const supabase = await createClient();

    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error in SignOut:", error);
  }
};
