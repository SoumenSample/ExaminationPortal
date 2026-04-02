import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppDialogProvider } from "./component/AppDialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Divyanshi Saksharta Mission Foundation",
  description:
    "Saksharta for Every Child - merit-based scholarships and skill development for underprivileged students across Pan India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppDialogProvider>{children}</AppDialogProvider>
      </body>
    </html>
  );
}
