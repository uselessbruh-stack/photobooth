import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Little Moments — a lavender photobooth", description: "Step inside, strike a pose, and take a little memory home. A playful lavender photobooth with film looks and keepsake strips." };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
