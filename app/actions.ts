"use server";

import { createClient } from "@/utils/supabase/server";

export const checkUser = async () => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("Supabase error:", error);
      return {
        error: error.message,
        result: "error",
      };
    }

    if (!data) {
      return {
        error: "Not authenticated",
        result: "Not authenticated",
      };
    }

    return {
      result: "success",
      data,
    };
  } catch (error) {
    console.log("Error in checkUser:", error);
  }
};
