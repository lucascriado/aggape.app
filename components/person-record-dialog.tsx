"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, Church, LoaderCircle, MapPin, Save, Trash2, TriangleAlert, UserRound, X } from "lucide-react";

export type PersonKind = "member" | "visitor";

export type PersonRecordValues = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  civilStatus: string;
  cpf: string;
  zipCode: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  role: string;
  ministry: string;
  baptismDate: string;
  status: string;
  notes: string;
  invitedBy: string;
};

const emptyValues: PersonRecordValues = {
  name: "",
  email: "",
  phone: "",
  birthDate: "",
  gender: "",
  civilStatus: "",
  cpf: "",
  zipCode: "",
  address: "",
  neighborhood: "",
  city: "",
  state: "São Paulo",
  role: "Membro Comum",
  ministry: "Nenhum",
  baptismDate: "",
  status: "Ativo",
  notes: "",
  invitedBy: "",
};

const brazilianStates = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
];

function normalizeValues(initialValues?: Partial<PersonRecordValues>) {
  const normalized = { ...emptyValues };

  for (const key of Object.keys(emptyValues) as Array<keyof PersonRecordValues>) {
    const value = initialValues?.[key];
    if (typeof value === "string") normalized[key] = value;
  }

  normalized.cpf = maskCpf(normalized.cpf);
  normalized.phone = maskPhone(normalized.phone);
  normalized.zipCode = maskZipCode(normalized.zipCode);

  return normalized;
}

export function PersonRecordDialog({
  open,
  mode,
  kind,
  initialValues,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  kind: PersonKind;
  initialValues?: Partial<PersonRecordValues>;
  onClose: () => void;
  onSubmit: (values: PersonRecordValues) => Promise<boolean>;
}) {
  const [values, setValues] = useState<PersonRecordValues>(() => normalizeValues(initialValues));
  const [submitting, setSubmitting] = useState(false);
  const [zipCodeStatus, setZipCodeStatus] = useState<"idle" | "loading" | "found" | "not-found">("idle");

  useEffect(() => {
    if (open) {
      setValues(normalizeValues(initialValues));
      setSubmitting(false);
      setZipCodeStatus("idle");
    }
  }, [initialValues, open]);

  useEffect(() => {
    const zipCode = values.zipCode.replace(/\D/g, "");
    if (!open || zipCode.length !== 8) {
      setZipCodeStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setZipCodeStatus("loading");
      try {
        const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`, { signal: controller.signal });
        if (!response.ok) throw new Error("Falha ao consultar CEP");
        const address = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; estado?: string };
        if (address.erro) {
          setZipCodeStatus("not-found");
          return;
        }
        setValues((current) => ({
          ...current,
          address: address.logradouro || current.address,
          neighborhood: address.bairro || current.neighborhood,
          city: address.localidade || current.city,
          state: address.estado || current.state,
        }));
        setZipCodeStatus("found");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setZipCodeStatus("not-found");
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, values.zipCode]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open) return null;

  const isMember = kind === "member";
  const label = isMember ? "membro" : "visitante";

  function update(field: keyof PersonRecordValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="record-dialog-layer" role="dialog" aria-modal="true" aria-label={`${mode === "create" ? "Novo cadastro" : "Editar registro"} de ${label}`}>
      <div className="record-dialog-top">
        <div>
          <strong>{mode === "create" ? "Novo Cadastro" : "Editar Registro"}</strong>
          <span>{mode === "create" ? `Cadastre um novo ${label}` : `Atualize os dados de ${values.name}`}</span>
        </div>
        <button type="button" disabled={submitting} onClick={onClose} aria-label="Fechar formulário"><X /></button>
      </div>

      <form className="record-form" onSubmit={submit}>
        <aside className="record-photo-card">
          <span className={`record-photo-placeholder ${values.name.trim() ? "has-initials" : ""}`}>
            {values.name.trim() ? initialsFrom(values.name) : <Camera />}
          </span>
          <strong>Foto do Perfil</strong>
          <small>PNG ou JPG até 5MB</small>
          <button type="button" disabled={submitting}>Alterar Imagem</button>
        </aside>

        <FormSection title="Informações Pessoais" icon={<UserRound />} className="record-personal">
          <Field label="Nome Completo" wide required><input required value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="Ex: João da Silva Santos" /></Field>
          <Field label="Data de Nascimento"><input type="date" value={values.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></Field>
          <Field label="Sexo"><select value={values.gender} onChange={(event) => update("gender", event.target.value)}><option value="">Selecione</option><option>Feminino</option><option>Masculino</option><option>Outro</option></select></Field>
          <Field label="Estado Civil"><select value={values.civilStatus} onChange={(event) => update("civilStatus", event.target.value)}><option value="">Selecione</option><option>Solteiro(a)</option><option>Casado(a)</option><option>Viúvo(a)</option></select></Field>
          <Field label="CPF"><input inputMode="numeric" maxLength={14} value={values.cpf} onChange={(event) => update("cpf", maskCpf(event.target.value))} placeholder="000.000.000-00" /></Field>
        </FormSection>

        <FormSection title="Contato e Endereço" icon={<MapPin />} className="record-contact">
          <Field label="E-mail" wide required><input required type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="contato@exemplo.com.br" /></Field>
          <Field label="Telefone/WhatsApp"><input inputMode="tel" maxLength={16} value={values.phone} onChange={(event) => update("phone", maskPhone(event.target.value))} placeholder="(00) 0 0000-0000" /></Field>
          <Field label="CEP">
            <span className="record-input-with-status">
              <input inputMode="numeric" maxLength={9} value={values.zipCode} onChange={(event) => update("zipCode", maskZipCode(event.target.value))} placeholder="00000-000" />
              {zipCodeStatus === "loading" && <LoaderCircle className="button-spinner" aria-label="Consultando CEP" />}
            </span>
            {zipCodeStatus === "found" && <small className="record-field-success">Endereço preenchido pelo CEP.</small>}
            {zipCodeStatus === "not-found" && <small className="record-field-error">CEP não encontrado. Preencha o endereço manualmente.</small>}
          </Field>
          <Field label="Logradouro" wide><input value={values.address} onChange={(event) => update("address", event.target.value)} placeholder="Rua, Avenida, etc." /></Field>
          <Field label="Bairro"><input value={values.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} /></Field>
          <Field label="Cidade"><input value={values.city} onChange={(event) => update("city", event.target.value)} /></Field>
          <Field label="Estado"><select value={values.state} onChange={(event) => update("state", event.target.value)}>{brazilianStates.map((state) => <option key={state}>{state}</option>)}</select></Field>
        </FormSection>

        <FormSection title={isMember ? "Informações Eclesiásticas" : "Informações da Visita"} icon={<Church />} className="record-church">
          {isMember ? (
            <>
              <Field label="Cargo/Função" required><select required value={values.role} onChange={(event) => update("role", event.target.value)}><option>Membro Comum</option><option>Líder</option><option>Pastor</option></select></Field>
              <Field label="Ministério Principal" required><select required value={values.ministry} onChange={(event) => update("ministry", event.target.value)}><option>Nenhum</option><option>Louvor</option><option>Missões</option><option>Acolhimento</option><option>Infantil</option></select></Field>
              <Field label="Data de Batismo"><input type="date" value={values.baptismDate} onChange={(event) => update("baptismDate", event.target.value)} /></Field>
              <Field label="Situação" required><select required value={values.status} onChange={(event) => update("status", event.target.value)}><option>Ativo</option><option>Inativo</option></select></Field>
            </>
          ) : (
            <>
              <Field label="Quem convidou"><input value={values.invitedBy} onChange={(event) => update("invitedBy", event.target.value)} placeholder="Ex: Pr. Anderson" /></Field>
              <Field label="Status de acompanhamento" required><select required value={values.status} onChange={(event) => update("status", event.target.value)}><option>Aguardando Contato</option><option>Em Acompanhamento</option><option>Integrado</option></select></Field>
            </>
          )}
          <Field label="Observações / Histórico" wide><textarea value={values.notes} onChange={(event) => update("notes", event.target.value)} placeholder={`Algum detalhe relevante sobre ${isMember ? "o membro" : "o visitante"}...`} /></Field>
        </FormSection>

        <footer className="record-form-actions">
          <button type="button" className="record-cancel" disabled={submitting} onClick={onClose}>Cancelar</button>
          <button type="submit" className="record-save" disabled={submitting} aria-busy={submitting}>
            {submitting ? <LoaderCircle className="button-spinner" /> : <Save />}
            {submitting ? (mode === "create" ? "Salvando..." : "Alterando...") : mode === "create" ? "Salvar Registro" : "Alterar"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function FormSection({ title, icon, className, children }: { title: string; icon: React.ReactNode; className: string; children: React.ReactNode }) {
  return <section className={`record-form-section ${className}`}><h3>{icon}{title}</h3><div className="record-form-grid">{children}</div></section>;
}

function Field({ label, wide, required, children }: { label: string; wide?: boolean; required?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "record-field wide" : "record-field"}><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}</label>;
}

function initialsFrom(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function maskCpf(value: string) {
  return digitsOnly(value, 11).replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function maskPhone(value: string) {
  const digits = digitsOnly(value, 11);
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return digits.replace(/^(\d{2})(\d)(\d)/, "($1) $2 $3").replace(/(\d{4})(\d)/, "$1-$2");
}

function maskZipCode(value: string) {
  return digitsOnly(value, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

export function DeleteRecordDialog({
  open,
  name,
  kind,
  onClose,
  onConfirm,
}: {
  open: boolean;
  name: string;
  kind: PersonKind;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) setDeleting(false);
  }, [open]);

  if (!open) return null;

  async function confirm() {
    if (deleting) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="delete-dialog-layer" onPointerDown={(event) => !deleting && event.currentTarget === event.target && onClose()}>
      <section className="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="delete-dialog-body">
          <span className="delete-warning"><TriangleAlert /></span>
          <div><h2 id="delete-title">Excluir Registro <small>AÇÃO CRÍTICA</small></h2><p>Tem certeza que deseja excluir o registro de <strong>{name}</strong>? Esta ação não poderá ser desfeita e removerá permanentemente todos os dados históricos e vínculos {kind === "member" ? "ministeriais" : "de acompanhamento"}.</p></div>
        </div>
        <footer><button disabled={deleting} onClick={onClose}>Cancelar</button><button className="delete-confirm" disabled={deleting} aria-busy={deleting} onClick={confirm}>{deleting ? <LoaderCircle className="button-spinner" /> : <Trash2 />}{deleting ? "Excluindo..." : "Confirmar Exclusão"}</button></footer>
      </section>
    </div>
  );
}
