import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Repo Racer | IntoTAO",
  description:
    "Gamified 3D racing visualization for Bittensor subnet metrics. Watch subnets race based on real TAO flow data.",
  openGraph: {
    title: "Repo Racer | IntoTAO",
    description:
      "Watch Bittensor subnets race! Speed, acceleration, and handling mapped to real TAO flow metrics.",
    siteName: "IntoTAO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${chakraPetch.variable} ${ibmPlexMono.variable} font-[family-name:var(--font-mono)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
