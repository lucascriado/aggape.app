"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Filter,
  Pencil,
  PartyPopper,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { AnimatedNumber } from "@/components/animated-number";
import { DeleteRecordDialog, PersonRecordDialog, PersonRecordValues } from "@/components/person-record-dialog";
import { toast } from "sonner";
import { NumberSkeleton, TableSkeleton } from "@/components/skeleton";
import { visiblePageNumbers } from "@/lib/pagination";

type Visitor = {
  id: string;
  initials: string;
  name: string;
  email: string;
  date: string;
  invitedBy: string;
  status: "Aguardando Contato" | "Em Acompanhamento" | "Integrado";
  recent?: boolean;
  phone?: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  cpf?: string;
  zipCode?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  notes?: string;
};

const pageSize = 4;
const tabs = ["Todos", "Recentes", "Pendentes"] as const;
type Tab = typeof tabs[number];

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("Todos");
  const [status, setStatus] = useState("all");
  const [invitedBy, setInvitedBy] = useState("all");
  const [page, setPage] = useState(1);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Visitor | null>(null);

  async function loadVisitors() {
    setLoading(true);
    try {
      const response = await fetch("/api/visitors", { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao carregar visitantes");
      const records = await response.json() as Array<Omit<Visitor, "initials" | "status" | "date"> & { status: string; date: string }>;
      setVisitors(records.map((visitor) => ({ ...visitor, initials: initialsFrom(visitor.name), status: visitorStatusFromDb(visitor.status), date: formatDate(visitor.date) })));
    } catch {
      toast.error("Não foi possível carregar os visitantes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadVisitors(); }, []);

  const inviters = [...new Set(visitors.map((visitor) => visitor.invitedBy))];
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return visitors.filter((visitor) => {
      const matchesSearch = !term || `${visitor.name} ${visitor.email} ${visitor.invitedBy}`.toLocaleLowerCase("pt-BR").includes(term);
      const matchesTab = tab === "Todos" || (tab === "Recentes" ? visitor.recent : visitor.status === "Aguardando Contato");
      return matchesSearch
        && matchesTab
        && (status === "all" || visitor.status === status)
        && (invitedBy === "all" || visitor.invitedBy === invitedBy);
    });
  }, [invitedBy, search, status, tab, visitors]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const start = filtered.length ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, filtered.length);

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setInvitedBy("all");
    setTab("Todos");
    setPage(1);
  }

  async function saveVisitor(values: PersonRecordValues) {
    const editing = dialogMode === "edit" && selectedVisitor;
    const response = await fetch(editing ? `/api/visitors/${selectedVisitor.id}` : "/api/visitors", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      toast.error("Não foi possível salvar o visitante");
      return false;
    }
    toast.success(editing ? "Visitante alterado com sucesso" : "Visitante cadastrado com sucesso");
    setDialogMode(null); setSelectedVisitor(null); setPage(1);
    await loadVisitors();
    return true;
  }

  async function confirmDelete() {
    if (!deleteTarget) return false;
    const response = await fetch(`/api/visitors/${deleteTarget.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Não foi possível excluir o visitante");
      return false;
    }
    toast.error("Visitante excluído com sucesso");
    setDeleteTarget(null);
    await loadVisitors();
    return true;
  }

  return (
    <DashboardShell title="Visitantes" searchPlaceholder="Buscar visitantes..." searchValue={search} onSearchChange={(value) => { setSearch(value); setPage(1); }}>
      <main className="visitors-main">
        <section className="visitors-heading">
          <div><h2>Gestão de Visitantes</h2><p>Acompanhe e integre novas pessoas à nossa comunidade.</p></div>
          <button className="primary-action visitor-action" onClick={() => { setSelectedVisitor(null); setDialogMode("create"); }}><UserPlus />Novo Visitante</button>
        </section>

        <section className="visitor-stats" aria-label="Indicadores de visitantes">
          <VisitorStat loading={loading} label="Total de visitantes" value={visitors.length} color="default" />
          <VisitorStat loading={loading} label="Aguardando contato" value={visitors.filter((item) => item.status === "Aguardando Contato").length} detail="Urgente" color="danger" />
          <VisitorStat loading={loading} label="Em acompanhamento" value={visitors.filter((item) => item.status === "Em Acompanhamento").length} icon={<Users />} color="tracking" />
          <VisitorStat loading={loading} label="Integrados" value={visitors.filter((item) => item.status === "Integrado").length} icon={<PartyPopper />} color="success" />
        </section>

        <div className="member-filters visitor-filters">
          <span className="filter-label"><Filter />Filtros Avançados</span>
          <select aria-label="Filtrar por status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">Status: Todos</option>
            <option>Aguardando Contato</option><option>Em Acompanhamento</option><option>Integrado</option>
          </select>
          <select aria-label="Filtrar por responsável pelo convite" value={invitedBy} onChange={(event) => { setInvitedBy(event.target.value); setPage(1); }}>
            <option value="all">Quem convidou: Todos</option>
            {inviters.map((item) => <option key={item}>{item}</option>)}
          </select>
          <label className="member-filter-search"><Search /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Filtrar visitante..." /></label>
          <button className="clear-filters" onClick={clearFilters}>Limpar Filtros</button>
        </div>

        <section className="visitors-table-card">
          <div className="visitor-table-toolbar">
            <div className="visitor-tabs">
              {tabs.map((item) => <button className={tab === item ? "active" : undefined} key={item} onClick={() => changeTab(item)}>{item}</button>)}
            </div>
            <div className="visitor-tools"><button aria-label="Filtrar"><Filter /></button><button aria-label="Exportar"><Download /></button></div>
          </div>
          <div className="visitors-table-scroll">
            <table className="visitors-table">
              <colgroup><col className="visitor-col-name" /><col className="visitor-col-date" /><col className="visitor-col-invited" /><col className="visitor-col-status" /><col className="visitor-col-actions" /></colgroup>
              <thead><tr><th>Nome do Visitante</th><th>Data da Visita</th><th>Quem Convidou</th><th>Status de Acompanhamento</th><th>Ações</th></tr></thead>
              <tbody>
                {visible.map((visitor, index) => (
                  <tr key={visitor.email}>
                    <td data-label="Visitante"><div className="visitor-identity"><span className={`visitor-avatar avatar-${index % 4}`}>{visitor.initials}</span><span><strong>{visitor.name}</strong><small>{visitor.email}</small></span></div></td>
                    <td data-label="Data">{visitor.date}</td>
                    <td data-label="Quem convidou"><span className="invited-by"><Users />{visitor.invitedBy}</span></td>
                    <td data-label="Status"><span className={`visitor-status ${statusClass(visitor.status)}`}><i />{visitor.status}</span></td>
                    <td data-label="Ações">
                      <div className="member-actions">
                        <button aria-label={`Visualizar ${visitor.name}`} onClick={() => toast.info(`${visitor.name}: ${visitor.status}.`)}><Eye /></button>
                        <button aria-label={`Editar ${visitor.name}`} onClick={() => { setSelectedVisitor(visitor); setDialogMode("edit"); }}><Pencil /></button>
                        <button aria-label={`Excluir ${visitor.name}`} onClick={() => setDeleteTarget(visitor)}><Trash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !visible.length && <div className="members-empty">Nenhum visitante encontrado com esses filtros.</div>}
          </div>
          {loading && <TableSkeleton rows={4} columns={5} />}
          <div className="visitor-pagination">
            <span>Mostrando {start}-{end} de {filtered.length} visitantes</span>
            <div><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></button>{visiblePageNumbers(currentPage, pageCount).map((number) => <button className={number === currentPage ? "current" : undefined} key={number} onClick={() => setPage(number)}>{number}</button>)}<button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight /></button></div>
          </div>
        </section>

        <section className="visitor-followup">
          <article className="integration-guide"><h3>Próximos Passos na Integração</h3><p>Lembre-se que o primeiro contato deve ser feito em até 48h após a visita para garantir uma maior taxa de retenção.</p><button><ClipboardList />Ver Manual de Integração</button></article>
          <article className="reminders-card">
            <h3>Lembretes</h3>
            {visitors.filter((visitor) => visitor.status === "Aguardando Contato").slice(0, 2).map((visitor, index) => <Reminder key={visitor.id} urgent={index === 0} title={`Entrar em contato com ${visitor.name}`} detail={`Visitou em ${visitor.date}`} />)}
            {!visitors.some((visitor) => visitor.status === "Aguardando Contato") && <p className="data-empty">Nenhum contato pendente.</p>}
            <button>Ver todos os lembretes</button>
          </article>
        </section>
      </main>
      <PersonRecordDialog open={dialogMode !== null} mode={dialogMode ?? "create"} kind="visitor" initialValues={selectedVisitor ? visitorValues(selectedVisitor) : { status: "Aguardando Contato" }} onClose={() => { setDialogMode(null); setSelectedVisitor(null); }} onSubmit={saveVisitor} />
      <DeleteRecordDialog open={deleteTarget !== null} name={deleteTarget?.name ?? ""} kind="visitor" onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </DashboardShell>
  );
}

function initialsFrom(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function visitorStatus(status: string): Visitor["status"] {
  return status === "Integrado" || status === "Em Acompanhamento" ? status : "Aguardando Contato";
}

function visitorStatusFromDb(status: string): Visitor["status"] {
  if (status === "integrated") return "Integrado";
  if (status === "following_up") return "Em Acompanhamento";
  return "Aguardando Contato";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value)).replace(".", "");
}

function visitorValues(visitor: Visitor): Partial<PersonRecordValues> {
  return { name: visitor.name, email: visitor.email, phone: visitor.phone, birthDate: visitor.birthDate?.slice(0, 10), gender: visitor.gender, civilStatus: visitor.civilStatus, cpf: visitor.cpf, zipCode: visitor.zipCode, address: visitor.address, neighborhood: visitor.neighborhood, city: visitor.city, state: visitor.state, notes: visitor.notes, invitedBy: visitor.invitedBy, status: visitor.status };
}

function statusClass(status: Visitor["status"]) {
  return status === "Aguardando Contato" ? "waiting" : status === "Em Acompanhamento" ? "tracking" : "integrated";
}

function VisitorStat({ label, value, detail, icon, color, loading }: { label: string; value: number; detail?: React.ReactNode; icon?: React.ReactNode; color: string; loading: boolean }) {
  return <article className={`visitor-stat ${color}`}><small>{label}</small><div><strong>{loading ? <NumberSkeleton /> : <AnimatedNumber value={value} />}</strong>{!loading && detail && <span>{detail}</span>}{icon && <i>{icon}</i>}</div></article>;
}

function Reminder({ title, detail, urgent }: { title: string; detail: string; urgent?: boolean }) {
  return <div className="visitor-reminder"><i className={urgent ? "urgent" : undefined} /><span><strong>{title}</strong><small>{detail}</small></span></div>;
}
