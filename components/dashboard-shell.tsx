"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";

const sidebarStorageKey = "sib-sidebar-collapsed";

export function DashboardShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const sidebarRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem(sidebarStorageKey) === "true");
  }, []);

  useEffect(() => {
    function closeSidebarOnOutsideClick(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;
      const target = event.target;

      if (sidebarRef.current?.contains(target) || target.closest("[data-sidebar-trigger]")) return;

      if (window.matchMedia("(max-width: 800px)").matches) {
        setMobileOpen(false);
        return;
      }

      setSidebarCollapsed(true);
    }

    function closeSidebarOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setSidebarCollapsed(true);
    }

    document.addEventListener("pointerdown", closeSidebarOnOutsideClick);
    document.addEventListener("keydown", closeSidebarOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeSidebarOnOutsideClick);
      document.removeEventListener("keydown", closeSidebarOnEscape);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(sidebarStorageKey, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <>
      <input checked={mobileOpen} className="menu-toggle" id="menu-toggle" onChange={(event) => setMobileOpen(event.target.checked)} type="checkbox" />
      <input checked={sidebarCollapsed} className="sidebar-collapse" id="sidebar-collapse" onChange={(event) => setSidebarCollapsed(event.target.checked)} type="checkbox" />
      <Sidebar sidebarRef={sidebarRef} />
      <label className="menu-overlay" htmlFor="menu-toggle" aria-label="Fechar menu" data-sidebar-trigger />
      <Header title={title} />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
