import { Navbar } from "@/components/home/Navbar";

export const metadata = {
  title: "imgServe - Serve with Style",
  description: "Way to do on the fly image transformations",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pt-10">
        <Navbar />
      </div>
      {children}
    </>
  );
}
