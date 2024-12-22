"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { addUserProfile } from "./actions";
import { useRouter } from "next/navigation";

const ProfilePage = () => {
  // context - useUser
  const { user, profile, setProfile, fetchUserAndProfile } = useUser();

  // navigate
  const navigate = useRouter();

  // useState
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // useEffect
  useEffect(() => {
    if (!user || !profile) {
      fetchUserAndProfile();
    }
    // Pre-populate form with existing profile data
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
      });
    }
  }, [profile, user]);

  // functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onSubmitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitLoading(true);

    const dataToSubmit = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: user?.email ?? "",
      userId: user?.id ?? "",
    };

    addUserProfile(dataToSubmit).then((result) => {
      setProfile({
        id: result.data?.id ?? "",
        first_name: result.data?.first_name ?? "",
        last_name: result.data?.last_name ?? "",
        email: result.data?.email ?? "",
      });
      navigate.push("/");
      setSubmitLoading(false);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen flex-col overflow-hidden">
      <h1 className="text-2xl text-left text-bgBeige tracking-wider font-archivo-black font-normal selection:text-bgDarkGreen">
        Create your Profile
      </h1>

      <Card className="w-full mt-10 max-w-lg mx-auto bg-bgBeige border-none overflow-hidden">
        <CardContent className="flex items-center justify-evenly p-0 gap-4">
          <Image
            src={require("@/assets/profile/ProfilePerson.png")}
            alt="Profile Person"
            priority={true}
            className="-ml-14 w-[45%]"
            width={220}
          />
          <div className="flex flex-col gap-2 items-end w-[45%]">
            <form className="space-y-4 w-full" onSubmit={onSubmitForm}>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your First Name"
                  required
                  className="border-bgDarkGreen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your Last Name"
                  required
                  className="border-bgDarkGreen"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full focus-within:ring-0 selection:text-bgDarkGreen"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <div className="w-4 h-4 border-2 border-bgBeige border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
