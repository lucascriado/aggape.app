import Image from "next/image";
import { Bell, Menu, Search } from "lucide-react";

export function Header() {
  return (
    <header className="topbar">
      <label className="icon-button menu-button" htmlFor="menu-toggle" aria-label="Abrir menu">
        <Menu />
      </label>
      <h1>Dashboard</h1>
      <label className="search">
        <Search />
        <input type="search" placeholder="Buscar membros..." aria-label="Buscar membros" />
      </label>
      <button className="icon-button" aria-label="Notificações"><Bell /></button>
      <span className="divider" />
      <div className="user">
        <span><strong>Pr. Renato</strong><small>Administrador</small></span>
        <Image src="/renato.png" alt="Pr. Renato" width={40} height={40} priority />
      </div>
    </header>
  );
}
