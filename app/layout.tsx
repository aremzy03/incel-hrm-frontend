import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incel HRM",
  description: "Human Resource Management Application",
  icons: {
    icon: [
      { url: "/hrm.svg", type: "image/svg+xml" },
    ],
    shortcut: [
      { url: "/hrm.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/hrm.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="font-sans"
    >
      <body className="antialiased">
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}
