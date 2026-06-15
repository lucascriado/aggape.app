"use client";

import {
  Banknote,
  ChevronLeft,
  Church,
  CircleHelp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Network,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import type { Ref } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryLinks = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Membros", icon: Users, href: "/membros" },
  { label: "Visitantes", icon: UserPlus, href: "/visitantes" },
  { label: "Atividades", icon: ListChecks, href: "/atividades" },
  { label: "Financeiro", icon: Banknote, href: "#" },
  { label: "Células", icon: Network, href: "#" },
  { label: "Configurações", icon: Settings, href: "#" },
];

export function Sidebar({ sidebarRef }: { sidebarRef?: Ref<HTMLElement> }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar" ref={sidebarRef}>
      <div className="brand">
        <Link className="brand-link" href="/" aria-label="Ir para a dashboard" title="Dashboard">
          <span className="brand-icon"><Church /></span>
          <span className="brand-text"><strong>SIB Mirassol</strong><small>Gestão ministerial</small></span>
        </Link>
        <label className="sidebar-collapse-button" htmlFor="sidebar-collapse" aria-label="Recolher menu" title="Recolher menu">
          <ChevronLeft />
        </label>
      </div>

      <nav className="nav-list" aria-label="Navegação principal">
        {primaryLinks.map(({ label, icon: Icon, href }) => (
          <Link className={pathname === href ? "active" : undefined} href={href} key={label} title={label}>
            <Icon /><span>{label}</span>
          </Link>
        ))}
      </nav>

      <nav className="nav-list nav-footer" aria-label="Navegação secundária">
        <a href="#" title="Suporte"><CircleHelp /><span>Suporte</span></a>
        <a href="#" title="Sair"><LogOut /><span>Sair</span></a>
      </nav>
    </aside>
  );
}
