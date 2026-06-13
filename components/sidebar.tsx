import {
  Banknote,
  Church,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

const primaryLinks = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Membros", icon: Users },
  { label: "Visitantes", icon: UserPlus },
  { label: "Financeiro", icon: Banknote },
  { label: "Células", icon: Network },
  { label: "Configurações", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon"><Church /></span>
        <span><strong>SIB Mirassol</strong><small>Gestão ministerial</small></span>
      </div>

      <nav className="nav-list" aria-label="Navegação principal">
        {primaryLinks.map(({ label, icon: Icon, active }) => (
          <a className={active ? "active" : undefined} href="#" key={label}>
            <Icon />{label}
          </a>
        ))}
      </nav>

      <nav className="nav-list nav-footer" aria-label="Navegação secundária">
        <a href="#"><CircleHelp />Suporte</a>
        <a href="#"><LogOut />Sair</a>
      </nav>
    </aside>
  );
}
