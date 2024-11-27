import { Navbar } from "@/components/home/Navbar";

export const metadata = {
  title: "imgServe - Serve with Style",
  description: "Way to do on the fly image transformations",
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-10">
      <div className="pt-10">
        <Navbar />
      </div>
      {children}
    </div>
  );
}
