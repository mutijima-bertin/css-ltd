import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creative Sound Studio Ltd | Multimedia Production Kigali",
  description:
    "Creative Sound Studio Ltd is a professional multimedia and audio-visual production house based in Nyamirambo, Kigali, Rwanda. Discover talent, record music, photography, and video production.",
  keywords: [
    "recording studio Kigali",
    "multimedia production Rwanda",
    "event photographer Kigali",
    "Nyamirambo studio",
    "music production Rwanda",
    "Creative Sound Studio",
  ],
  openGraph: {
    title: "Creative Sound Studio Ltd | Multimedia Production Kigali",
    description:
      "Professional multimedia production house in Nyamirambo, Kigali. Recording, photography, video, and talent discovery.",
    locale: "en_RW",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="scanline" />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-foreground text-background text-center py-6 text-sm">
          <p>&copy; {new Date().getFullYear()} Creative Sound Studio Ltd. All rights reserved.</p>
          <p className="text-muted mt-1">KK 780 St, Nyamirambo, Kigali, Rwanda</p>
        </footer>
      </body>
    </html>
  );
}
