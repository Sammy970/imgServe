"use server";

import { createClient } from "@/utils/supabase/server";

interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
}

export const addUserProfile = async (formData: UserProfileData) => {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: "Not authenticated",
        result: "error",
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert([
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return {
        error: error.message,
        result: "error",
      };
    }

    return {
      result: "success",
      data,
    };
  } catch (error) {
    console.error("Error in addUserProfile:", error);
    return {
      error: "Failed to create profile",
      result: "error",
    };
  }
};
