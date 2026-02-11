"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isV2 = pathname.startsWith("/v2");

  if (isV2) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="ml-[260px] min-h-screen">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </>
  );
}
