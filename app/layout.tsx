import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incel HRM",
  description: "Human Resource Management Application",
  icons: {
    icon: [
      { url: "/incel-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/incel-icon.png", type: "image/png" },
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
