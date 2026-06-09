import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { GridBackground } from "@/components/hud/GridBackground";
import { CommandBar } from "@/components/hud/CommandBar";
import { SideNav } from "@/components/hud/SideNav";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LLM Benchmark Arena",
  description: "ローカル実行型 LLM ベンチマークアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${mono.variable} ${sans.variable}`}>
      <body>
        <GridBackground>
          <CommandBar />
          <div className="flex min-h-[calc(100vh-41px)]">
            <SideNav />
            <main className="flex-1 overflow-x-hidden p-6">{children}</main>
          </div>
        </GridBackground>
      </body>
    </html>
  );
}
