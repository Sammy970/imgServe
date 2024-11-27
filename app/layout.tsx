import { Archivo } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";

const archivo = Archivo({ subsets: ["latin"] });

export const metadata = {
  title: "imgServe - Serve with Style",
  description: "Way to do on the fly image transformations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${archivo.className} bg-bgDarkGreen`}>
        <UserProvider>
          <main className="min-h-screen">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
