"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronRight, Clock, Edit3, LoaderCircle, MapPin, Network, Plus, Search, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { NumberSkeleton } from "@/components/skeleton";
import { AnimatedNumber } from "@/components/animated-number";
import { DeleteRecordDialog } from "@/components/person-record-dialog";

type MemberOption = { id: string; name: string; email: string; cell?: string };
type Cell = {
  id: string;
  name: string;
  address: string | null;
  meetingDay: string;
  meetingTime: string;
  color: "blue" | "green" | "gray" | "purple";
  notes: string | null;
  leaderId: string | null;
  leaderName: string | null;
  memberCount: number;
  members: MemberOption[];
};

type CellFormValues = {
  name: string;
  address: string;
  meetingDay: string;
  meetingTime: string;
  color: "blue" | "green" | "gray" | "purple";
  leaderId: string;
  notes: string;
  memberIds: string[];
};

const emptyCell: CellFormValues = {
  name: "",
  address: "",
  meetingDay: "Domingo",
  meetingTime: "19:30",
  color: "purple",
  leaderId: "",
  notes: "",
  memberIds: [],
};

export default function CellsPage() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cell | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [cellsResponse, membersResponse] = await Promise.all([
        fetch("/api/cells", { cache: "no-store" }),
        fetch("/api/members", { cache: "no-store" }),
      ]);
      if (!cellsResponse.ok || !membersResponse.ok) throw new Error("Falha ao carregar células");
      setCells(await cellsResponse.json());
      const memberRows = await membersResponse.json() as Array<MemberOption>;
      setMembers(memberRows.map((member) => ({ id: member.id, name: member.name, email: member.email, cell: member.cell })));
    } catch {
      toast.error("Não foi possível carregar células");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const filteredCells = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return cells.filter((cell) => !term || `${cell.name} ${cell.address ?? ""} ${cell.leaderName ?? ""}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [cells, search]);

  const assignedMembers = useMemo(() => cells.reduce((total, cell) => total + cell.memberCount, 0), [cells]);
  const average = cells.length ? Math.round(assignedMembers / cells.length) : 0;

  async function saveCell(values: CellFormValues) {
    const editing = mode === "edit" && selectedCell;
    const response = await fetch(editing ? `/api/cells/${selectedCell.id}` : "/api/cells", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      toast.error("Não foi possível salvar a célula");
      return false;
    }
    toast.success(editing ? "Célula atualizada com sucesso" : "Célula criada com sucesso");
    closeForm();
    await loadData();
    return true;
  }

  async function confirmDeleteCell() {
    if (!deleteTarget) return false;
    const response = await fetch(`/api/cells/${deleteTarget.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Não foi possível excluir a célula");
      return false;
    }
    toast.success("Célula excluída");
    setDeleteTarget(null);
    await loadData();
    return true;
  }

  function openForm(nextMode: "create" | "edit" | "view", cell: Cell | null = null) {
    setSelectedCell(cell);
    setMode(nextMode);
  }

  function closeForm() {
    setMode(null);
    setSelectedCell(null);
  }

  return (
    <DashboardShell title="Gestão de Células">
      <main className="cells-main">
        <section className="resource-heading">
          <div>
            <h2>Gestão de Células</h2>
            <p>Gerencie e acompanhe o crescimento dos pequenos grupos.</p>
          </div>
          {!mode && <button className="primary-action" onClick={() => openForm("create")}><Plus />Nova Célula</button>}
        </section>

        {mode ? (
          <CellForm mode={mode} cell={selectedCell} members={members} onClose={closeForm} onSubmit={saveCell} />
        ) : (
          <>
            <label className="resource-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar células..." /></label>

            <section className="cell-grid">
              {loading && Array.from({ length: 4 }).map((_, index) => <article className="resource-card loading-card" key={index}><NumberSkeleton /></article>)}
              {!loading && filteredCells.map((cell, index) => (
                <article className={`resource-card cell-card tone-${cell.color}`} key={cell.id}>
                  <header>
                    <span className="resource-icon">{cellIcon(index)}</span>
                    <em>{cell.memberCount.toString().padStart(2, "0")} pessoas</em>
                  </header>
                  <h3>{cell.name}</h3>
                  <p><MapPin />{cell.address || "Endereço não informado"}</p>
                  <p><Clock />{cell.meetingDay}, {cell.meetingTime}</p>
                  <div className="avatar-row">{cell.members.slice(0, 3).map((member) => <span key={member.id}>{initials(member.name)}</span>)}{cell.memberCount > 3 && <span>+{cell.memberCount - 3}</span>}</div>
                  <footer>
                    <button onClick={() => openForm("view", cell)}>Ver detalhes <ChevronRight /></button>
                    <button aria-label={`Editar ${cell.name}`} onClick={() => openForm("edit", cell)}><Edit3 /></button>
                    <button aria-label={`Excluir ${cell.name}`} onClick={() => setDeleteTarget(cell)}><Trash2 /></button>
                  </footer>
                </article>
              ))}
              {!loading && (
                <button className="resource-card add-resource-card" onClick={() => openForm("create")}>
                  <span><Plus /></span>
                  <strong>Nova Célula</strong>
                  <small>Expandir o ministério</small>
                </button>
              )}
              {!loading && !filteredCells.length && <p className="data-empty">Nenhuma célula encontrada.</p>}
            </section>

            <section className="resource-stats">
              <article><span><Network /></span><small>Total de células</small><strong>{loading ? <NumberSkeleton /> : <AnimatedNumber value={cells.length} />}</strong></article>
              <article><span><Users /></span><small>Membros vinculados</small><strong>{loading ? <NumberSkeleton /> : <AnimatedNumber value={assignedMembers} />}</strong></article>
              <article><span><CalendarClock /></span><small>Média por célula</small><strong>{loading ? <NumberSkeleton /> : <AnimatedNumber value={average} />}</strong></article>
            </section>
          </>
        )}
      </main>
      <DeleteRecordDialog open={deleteTarget !== null} name={deleteTarget?.name ?? ""} kind="cell" onClose={() => setDeleteTarget(null)} onConfirm={confirmDeleteCell} />
    </DashboardShell>
  );
}

function CellForm({ mode, cell, members, onClose, onSubmit }: { mode: "create" | "edit" | "view"; cell: Cell | null; members: MemberOption[]; onClose: () => void; onSubmit: (values: CellFormValues) => Promise<boolean> }) {
  const [values, setValues] = useState<CellFormValues>(emptyCell);
  const [saving, setSaving] = useState(false);
  const readOnly = mode === "view";

  useEffect(() => {
    setSaving(false);
    setValues(cell ? {
      name: cell.name,
      address: cell.address ?? "",
      meetingDay: cell.meetingDay,
      meetingTime: cell.meetingTime,
      color: cell.color,
      leaderId: cell.leaderId ?? "",
      notes: cell.notes ?? "",
      memberIds: cell.members.map((member) => member.id),
    } : emptyCell);
  }, [cell]);

  function update(field: keyof CellFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function toggleMember(memberId: string) {
    setValues((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId)
        ? current.memberIds.filter((id) => id !== memberId)
        : [...current.memberIds, memberId],
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving || readOnly) return;
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="resource-dialog resource-page-form cell-resource-dialog" onSubmit={submit}>
      <header>
        <div><strong>{mode === "create" ? "Nova Célula" : mode === "view" ? "Detalhes da Célula" : "Editar Célula"}</strong><span>Vincule membros já cadastrados ao pequeno grupo.</span></div>
        <button type="button" onClick={onClose} aria-label="Fechar"><X /></button>
      </header>
      <fieldset disabled={saving || readOnly}>
        <label><span>Nome *</span><input required value={values.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label><span>Líder</span><select value={values.leaderId} onChange={(event) => update("leaderId", event.target.value)}><option value="">Sem líder definido</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <label><span>Endereço</span><input value={values.address} onChange={(event) => update("address", event.target.value)} /></label>
        <label><span>Dia</span><select value={values.meetingDay} onChange={(event) => update("meetingDay", event.target.value)}>{["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"].map((day) => <option key={day}>{day}</option>)}</select></label>
        <label><span>Horário</span><input type="time" value={values.meetingTime} onChange={(event) => update("meetingTime", event.target.value)} /></label>
        <label><span>Cor</span><select value={values.color} onChange={(event) => update("color", event.target.value)}><option value="purple">Roxo</option><option value="blue">Azul</option><option value="green">Verde</option><option value="gray">Cinza</option></select></label>
        <label className="wide form-section-field"><span>Observações</span><textarea value={values.notes} onChange={(event) => update("notes", event.target.value)} /></label>
        <div className="member-picker wide">
          <span>Membros da célula</span>
          <div>{members.map((member) => <label key={member.id}><input type="checkbox" checked={values.memberIds.includes(member.id)} onChange={() => toggleMember(member.id)} /> <strong>{member.name}</strong><small>{member.email}</small></label>)}</div>
        </div>
      </fieldset>
      {!readOnly && <footer><button type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-action" disabled={saving}>{saving ? <LoaderCircle className="button-spinner" /> : <Plus />}{saving ? "Salvando..." : "Salvar Célula"}</button></footer>}
    </form>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function cellIcon(index: number) {
  const icons = [<Network key="network" />, <Users key="users" />, <MapPin key="map" />, <CalendarClock key="calendar" />];
  return icons[index % icons.length];
}
