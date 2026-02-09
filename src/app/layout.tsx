import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Boublenza Dashboard",
  description: "Tableau de bord de pilotage - Boublenza SARL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Sidebar />
        <div className="ml-[260px] min-h-screen">
          <Header />
          <main className="p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
