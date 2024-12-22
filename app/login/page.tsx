"use client";

import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function LoginPage() {
  type Mode = "login" | "signup";

  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [screenSize, setScreenSize] = useState<number>(0);

  const navigate = useRouter();

  const { setUser, setProfile } = useUser();

  useEffect(() => {
    setScreenSize(window.screen.width);

    const handleResize = () => {
      setScreenSize(window.screen.width);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const onShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      if (mode === "signup") {
        const website = window.location.origin;
        const result = await signup(formData, website);

        if (result?.error) {
          setError(result.error);
          return;
        }

        if (result?.result === "success") {
          setEmailSent(true);
        }
      } else {
        const website = window.location.origin;
        const result = await login(formData);
        if (result?.error) {
          setError(result.error);
        }

        if (result?.result === "success") {
          if (result?.data?.user) {
            setUser({
              email: result.data.user.email ?? "",
              id: result.data.user.id ?? "",
              verified: result.data.user.email_confirmed_at !== null,
            });

            if (result?.data?.profile) {
              setProfile(result.data.profile as any);
            }
          }

          if (result?.redirect) {
            navigate.push(result.redirect);
          }
        }
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px] bg-bgBeige">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">
              Verify Your Email
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              A verification link has been sent to your email. Please check your
              inbox and verify your email to complete the signup process.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      <Image
        src={require("@/assets/upload/uploadperson.png")}
        alt="Upload Person"
        priority={true}
        className="absolute bottom-0 left-0 z-10"
        width={
          screenSize <= 430
            ? 200
            : screenSize < 768
            ? 180
            : screenSize < 1024
            ? 300
            : screenSize < 1280
            ? 300
            : 400
        }
      />
      <Image
        src={require("@/assets/settings/ApiPerson.png")}
        alt="Upload Person"
        priority={true}
        className="absolute top-0 right-0 z-10 rotate-180 scale-x-[-1]"
        width={
          screenSize <= 430
            ? 200
            : screenSize < 768
            ? 180
            : screenSize < 1024
            ? 250
            : screenSize < 1280
            ? 300
            : 400
        }
      />

      {screenSize <= 430 ? (
        <div className="absolute top-5 left-5 px-5 z-0 bg-bgLightGreen rounded-md">
          <h1 className="text-4xl font-bold font-archivo-black text-bgDarkGreen">
            IMAGE <br /> SERVE
          </h1>
        </div>
      ) : screenSize <= 768 ? (
        <div className="absolute top-6 left-10 z-0 bg-bgLightGreen rounded-md">
          <h1 className="text-6xl font-bold font-archivo-black text-bgDarkGreen">
            IMAGE <br /> SERVE
          </h1>
        </div>
      ) : (
        <div className="absolute top-10 left-10 z-0 bg-bgLightGreen rounded-md px-6">
          <h1 className="text-8xl font-bold font-archivo-black text-bgDarkGreen">
            IMAGE SERVE
          </h1>
        </div>
      )}

      {screenSize <= 430 ? (
        <div className="absolute bottom-10 right-10 z-0 bg-bgLightGreen rounded-md">
          <h1 className="text-4xl py-2 px-4 font-bold font-archivo-black text-bgDarkGreen">
            {mode === "login"
              ? "Log In"
              : mode === "signup"
              ? "Sign Up"
              : "Log In"}
          </h1>
        </div>
      ) : (
        <div className="absolute bottom-10 right-10 z-0 bg-bgLightGreen rounded-md px-4">
          <h1 className="text-8xl py-2 px-4 font-bold font-archivo-black text-bgDarkGreen">
            {mode === "login"
              ? "Log In"
              : mode === "signup"
              ? "Sign Up"
              : "Log In"}
          </h1>
        </div>
      )}

      <Card className="w-[350px] z-20 bg-bgBeige">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center">
            {mode === "login" ? "Login" : "Sign Up"}
          </h2>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                className="border-bgDarkGreen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="border-bgDarkGreen pr-10"
                />
                {!showPassword ? (
                  <EyeOff
                    onClick={onShowPassword}
                    size={20}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                  />
                ) : (
                  <Eye
                    onClick={onShowPassword}
                    size={20}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Loading..."
                  : mode === "login"
                  ? "Login"
                  : "Sign Up"}
              </Button>
            </div>
            <p>
              {mode === "login"
                ? "Don't have an account?, "
                : "Already have an account?, "}
              <Button
                className="hover:bg-transparent bg-transparent text-[15px] p-0 font-bold underline underline-offset-4 decoration-bgDarkGreen decoration-2 font-archivo text-black shadow-none"
                onClick={() =>
                  setMode((prev) => (prev === "login" ? "signup" : "login"))
                }
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
