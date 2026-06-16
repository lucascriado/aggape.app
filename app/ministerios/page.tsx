"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Baby, BookOpenCheck, CalendarCheck, Edit3, HeartHandshake, LoaderCircle, Music, Plus, Search, ShieldCheck, Users, Video, X } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { NumberSkeleton } from "@/components/skeleton";
import { AnimatedNumber } from "@/components/animated-number";

type MemberOption = { id: string; name: string; email: string; ministry?: string };
type Ministry = {
  id: string;
  name: string;
  color: "blue" | "green" | "gray" | "purple";
  description: string | null;
  leaderId: string | null;
  leaderName: string | null;
  memberCount: number;
  members: MemberOption[];
};
type Summary = { totalVolunteers: number; activeMinistries: number };
type MinistryFormValues = { name: string; description: string; color: "blue" | "green" | "gray" | "purple"; leaderId: string; memberIds: string[] };
type AttendanceMember = { id: string; name: string; email: string; present: boolean; notes: string | null };

const emptyMinistry: MinistryFormValues = { name: "", description: "", color: "purple", leaderId: "", memberIds: [] };

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalVolunteers: 0, activeMinistries: 0 });
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [attendanceMinistry, setAttendanceMinistry] = useState<Ministry | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [ministriesResponse, membersResponse] = await Promise.all([
        fetch("/api/ministries", { cache: "no-store" }),
        fetch("/api/members", { cache: "no-store" }),
      ]);
      if (!ministriesResponse.ok || !membersResponse.ok) throw new Error("Falha ao carregar ministérios");
      const data = await ministriesResponse.json() as { ministries: Ministry[]; summary: Summary };
      setMinistries(data.ministries);
      setSummary(data.summary);
      const memberRows = await membersResponse.json() as Array<MemberOption>;
      setMembers(memberRows.map((member) => ({ id: member.id, name: member.name, email: member.email, ministry: member.ministry })));
    } catch {
      toast.error("Não foi possível carregar ministérios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const filteredMinistries = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return ministries.filter((ministry) => !term || `${ministry.name} ${ministry.description ?? ""} ${ministry.leaderName ?? ""}`.toLocaleLowerCase("pt-BR").includes(term));
  }, [ministries, search]);

  async function saveMinistry(values: MinistryFormValues) {
    const editing = mode === "edit" && selectedMinistry;
    const response = await fetch(editing ? `/api/ministries/${selectedMinistry.id}` : "/api/ministries", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      toast.error("Não foi possível salvar o ministério");
      return false;
    }
    toast.success(editing ? "Ministério atualizado com sucesso" : "Ministério criado com sucesso");
    closeForm();
    await loadData();
    return true;
  }

  function openForm(nextMode: "create" | "edit" | "view", ministry: Ministry | null = null) {
    setSelectedMinistry(ministry);
    setMode(nextMode);
  }

  function closeForm() {
    setMode(null);
    setSelectedMinistry(null);
  }

  return (
    <DashboardShell title="Gestão de Ministérios">
      <main className="ministries-main">
        <section className="resource-heading">
          <div>
            <h2>Gestão de Ministérios</h2>
            <p>Organize equipes, voluntários e chamadas das escolas bíblicas.</p>
          </div>
          {!mode && (
            <div className="resource-heading-actions">
              <label className="resource-search compact"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ministério..." /></label>
              <button className="primary-action" onClick={() => openForm("create")}><Plus />Novo Registro</button>
            </div>
          )}
        </section>

        {mode ? (
          <MinistryForm mode={mode} ministry={selectedMinistry} members={members} onClose={closeForm} onSubmit={saveMinistry} />
        ) : (
          <>
            <section className="resource-stats ministry-summary">
              <article><span><Users /></span><small>Total voluntários</small><strong>{loading ? <NumberSkeleton /> : <><AnimatedNumber value={summary.totalVolunteers} /> pessoas</>}</strong></article>
              <article><span><HeartHandshake /></span><small>Ministérios ativos</small><strong>{loading ? <NumberSkeleton /> : <><AnimatedNumber value={summary.activeMinistries} /> grupos</>}</strong></article>
              <article><span><CalendarCheck /></span><small>Chamadas criadas</small><strong>Domingos</strong></article>
              <article><span><BookOpenCheck /></span><small>Escola bíblica</small><strong>Por ministério</strong></article>
            </section>

            <section className="ministries-grid">
              {loading && Array.from({ length: 5 }).map((_, index) => <article className="resource-card loading-card" key={index}><NumberSkeleton /></article>)}
              {!loading && filteredMinistries.map((ministry) => (
                <article className={`resource-card ministry-card tone-${ministry.color}`} key={ministry.id}>
                  <header>
                    <span className="resource-icon">{ministryIcon(ministry.name)}</span>
                    <em>{ministry.memberCount.toString().padStart(2, "0")} pessoas</em>
                  </header>
                  <h3>{ministry.name}</h3>
                  <p>{ministry.description || "Sem descrição cadastrada para este ministério."}</p>
                  <small>Líder: {ministry.leaderName || "não definido"}</small>
                  <footer>
                    <button onClick={() => openForm("view", ministry)}>Visualizar</button>
                    <button onClick={() => openForm("edit", ministry)}><Edit3 />Editar</button>
                    <button onClick={() => setAttendanceMinistry(ministry)}><BookOpenCheck />Chamada</button>
                  </footer>
                </article>
              ))}
              {!loading && (
                <button className="resource-card add-resource-card" onClick={() => openForm("create")}>
                  <span><Plus /></span>
                  <strong>Adicionar Ministério</strong>
                  <small>Crie um novo grupo ministerial para sua igreja.</small>
                </button>
              )}
              {!loading && !filteredMinistries.length && <p className="data-empty">Nenhum ministério encontrado.</p>}
            </section>
          </>
        )}
      </main>
      <AttendanceDialog ministry={attendanceMinistry} onClose={() => setAttendanceMinistry(null)} />
    </DashboardShell>
  );
}

function MinistryForm({ mode, ministry, members, onClose, onSubmit }: { mode: "create" | "edit" | "view"; ministry: Ministry | null; members: MemberOption[]; onClose: () => void; onSubmit: (values: MinistryFormValues) => Promise<boolean> }) {
  const [values, setValues] = useState<MinistryFormValues>(emptyMinistry);
  const [saving, setSaving] = useState(false);
  const readOnly = mode === "view";

  useEffect(() => {
    setSaving(false);
    setValues(ministry ? {
      name: ministry.name,
      description: ministry.description ?? "",
      color: ministry.color,
      leaderId: ministry.leaderId ?? "",
      memberIds: ministry.members.map((member) => member.id),
    } : emptyMinistry);
  }, [ministry]);

  function toggleMember(memberId: string) {
    setValues((current) => ({
      ...current,
      memberIds: current.memberIds.includes(memberId) ? current.memberIds.filter((id) => id !== memberId) : [...current.memberIds, memberId],
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
    <form className="resource-dialog resource-page-form ministry-resource-dialog" onSubmit={submit}>
      <header><div><strong>{mode === "create" ? "Novo Ministério" : mode === "view" ? "Visualizar Ministério" : "Editar Ministério"}</strong><span>Vincule membros existentes ao ministério.</span></div><button type="button" onClick={onClose} aria-label="Fechar"><X /></button></header>
      <fieldset disabled={saving || readOnly}>
        <label><span>Nome *</span><input required value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></label>
        <label><span>Líder</span><select value={values.leaderId} onChange={(event) => setValues((current) => ({ ...current, leaderId: event.target.value }))}><option value="">Sem líder definido</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <label><span>Cor</span><select value={values.color} onChange={(event) => setValues((current) => ({ ...current, color: event.target.value as MinistryFormValues["color"] }))}><option value="purple">Roxo</option><option value="blue">Azul</option><option value="green">Verde</option><option value="gray">Cinza</option></select></label>
        <label className="wide form-section-field"><span>Descrição</span><textarea value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} /></label>
        <div className="member-picker wide">
          <span>Membros do ministério</span>
          <div>{members.map((member) => <label key={member.id}><input type="checkbox" checked={values.memberIds.includes(member.id)} onChange={() => toggleMember(member.id)} /> <strong>{member.name}</strong><small>{member.email}</small></label>)}</div>
        </div>
      </fieldset>
      {!readOnly && <footer><button type="button" onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-action" disabled={saving}>{saving ? <LoaderCircle className="button-spinner" /> : <Plus />}{saving ? "Salvando..." : "Salvar Ministério"}</button></footer>}
    </form>
  );
}

function AttendanceDialog({ ministry, onClose }: { ministry: Ministry | null; onClose: () => void }) {
  const [date, setDate] = useState(nextSunday());
  const [members, setMembers] = useState<AttendanceMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ministry) return;
    setDate(nextSunday());
  }, [ministry]);

  useEffect(() => {
    if (!ministry) return;
    const controller = new AbortController();
    const ministryId = ministry.id;
    async function loadAttendance() {
      setLoading(true);
      try {
        const response = await fetch(`/api/ministries/${ministryId}/attendance?date=${date}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Falha ao carregar chamada");
        const data = await response.json() as { members: AttendanceMember[] };
        setMembers(data.members);
      } catch (error) {
        if ((error as Error).name !== "AbortError") toast.error("Não foi possível carregar a chamada");
      } finally {
        setLoading(false);
      }
    }
    void loadAttendance();
    return () => controller.abort();
  }, [date, ministry]);

  if (!ministry) return null;
  const currentMinistry = ministry;

  async function saveAttendance() {
    setSaving(true);
    try {
      const response = await fetch(`/api/ministries/${currentMinistry.id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records: members.map((member) => ({ memberId: member.id, present: member.present, notes: member.notes ?? "" })) }),
      });
      if (!response.ok) throw new Error("Falha ao salvar chamada");
      toast.success("Chamada salva com sucesso");
      onClose();
    } catch {
      toast.error("Não foi possível salvar a chamada");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="record-dialog-layer" role="dialog" aria-modal="true">
      <section className="resource-dialog attendance-dialog">
        <header><div><strong>Chamada da Escola Bíblica</strong><span>{ministry.name}</span></div><button type="button" onClick={onClose} aria-label="Fechar"><X /></button></header>
        <div className="attendance-toolbar"><label><span>Data</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button onClick={() => setMembers((current) => current.map((member) => ({ ...member, present: true })))}>Marcar todos</button></div>
        <div className="attendance-list">
          {loading && <p className="data-empty">Carregando chamada...</p>}
          {!loading && members.map((member) => (
            <label key={member.id} className={member.present ? "present" : ""}>
              <input type="checkbox" checked={member.present} onChange={(event) => setMembers((current) => current.map((item) => item.id === member.id ? { ...item, present: event.target.checked } : item))} />
              <span><strong>{member.name}</strong><small>{member.email}</small></span>
            </label>
          ))}
          {!loading && !members.length && <p className="data-empty">Este ministério ainda não tem membros vinculados.</p>}
        </div>
        <footer><button onClick={onClose} disabled={saving}>Cancelar</button><button className="primary-action" onClick={saveAttendance} disabled={saving || loading}>{saving ? <LoaderCircle className="button-spinner" /> : <BookOpenCheck />}{saving ? "Salvando..." : "Salvar Chamada"}</button></footer>
      </section>
    </div>
  );
}

function ministryIcon(name: string) {
  const normalized = name.toLocaleLowerCase("pt-BR");
  if (normalized.includes("acolhimento")) return <HeartHandshake />;
  if (normalized.includes("infantil") || normalized.includes("crian")) return <Baby />;
  if (normalized.includes("louvor")) return <Music />;
  if (normalized.includes("mídia") || normalized.includes("midia")) return <Video />;
  if (normalized.includes("recepção") || normalized.includes("recepcao")) return <HeartHandshake />;
  if (normalized.includes("segurança") || normalized.includes("seguranca")) return <ShieldCheck />;
  return <Users />;
}

function nextSunday() {
  const date = new Date();
  const day = date.getDay();
  const offset = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}
