export type RecordPayload = {
  name: string;
  email: string;
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
  role?: string;
  ministry?: string;
  cell?: string;
  baptismDate?: string;
  status?: string;
  notes?: string;
  invitedBy?: string;
};

export const nullable = (value?: string) => value?.trim() || null;

export function personAttributes(payload: RecordPayload) {
  return {
    fullName: payload.name.trim(),
    email: payload.email.trim(),
    phone: nullable(payload.phone),
    birthDate: nullable(payload.birthDate),
    gender: nullable(payload.gender),
    maritalStatus: nullable(payload.civilStatus),
    cpf: nullable(payload.cpf),
    zipCode: nullable(payload.zipCode),
    address: nullable(payload.address),
    neighborhood: nullable(payload.neighborhood),
    city: nullable(payload.city),
    state: nullable(payload.state),
    notes: nullable(payload.notes),
  };
}

export function validateRecordPayload(payload: RecordPayload) {
  if (!payload.name?.trim()) return "Nome completo é obrigatório.";
  if (!payload.email?.trim()) return "E-mail é obrigatório.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) return "Informe um e-mail válido.";
  return null;
}

export function apiError(error: unknown) {
  console.error(error);
  return Response.json({ error: "Não foi possível concluir a operação." }, { status: 500 });
}
