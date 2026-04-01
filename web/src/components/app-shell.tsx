"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./layout/sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that don't use the sidebar layout
  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pt-[72px] px-4 pb-6 sm:px-6 lg:pt-8 lg:px-8 lg:pb-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
