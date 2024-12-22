"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: supabaseData, error } = await supabase.auth.signInWithPassword(
    data
  );

  if (error) {
    // Return the error object
    return { error: error.message };
  }

  const {
    data: profileData,
    error: profileError,
    status,
  } = await supabase.from("profiles").select("*").single();

  if (profileError) {
    return { error: profileError.message };
  }

  if (profileData) {
    return {
      result: "success",
      data: {
        user: supabaseData?.user,
        profile: profileData,
      },
      redirect: "/",
    };
  } else {
    return {
      result: "success",
      data: {
        user: supabaseData?.user,
      },
      redirect: "/profile",
    };
  }
}

export async function signup(formData: FormData, website: string) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs

  const signUpData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      emailRedirectTo: website,
    },
  };

  const { data, error } = await supabase.auth.signUp(signUpData);

  if (error) {
    // Return the error object
    return { error: error.message };
  }

  if (data && data.user) {
    if (data.user.identities && data.user.identities.length > 0) {
      return {
        result: "success",
        data: data,
      };
    } else {
      const signInResponse = await supabase.auth.signInWithPassword({
        email: signUpData.email,
        password: signUpData.password,
      });

      if (signInResponse.error) {
        return { error: signInResponse.error.message };
      }

      revalidatePath("/", "layout");
      redirect("/");
    }
  }
}
