import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Droplet,
  MapPin,
  Network,
  PartyPopper,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import { Calendar } from "@/components/calendar";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

const stats = [
  { label: "Total de membros", value: "1.250", icon: Users, color: "purple" },
  { label: "Visitantes no mês", value: "42", icon: UserPlus, color: "blue" },
  { label: "Células ativas", value: "15", icon: Network, color: "green" },
];

const activities = [
  { title: "Novo membro cadastrado", detail: "Ana Clara Oliveira • Hoje, 10:45", icon: UserPlus, color: "purple" },
  { title: "Batismo realizado", detail: "5 novos batizados • Ontem, 19:00", icon: Droplet, color: "green" },
  { title: "Doação registrada", detail: "Dízimo Ministerial • 15/05/2024", icon: CircleDollarSign, color: "blue" },
];

export default function Dashboard() {
  return (
    <>
      <input className="menu-toggle" id="menu-toggle" type="checkbox" />
      <Sidebar />
      <label className="menu-overlay" htmlFor="menu-toggle" aria-label="Fechar menu" />
      <Header />

      <main>
        <section className="stats" aria-label="Indicadores">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <article className="stat-card" key={label}>
              <span className={`stat-icon ${color}`}><Icon /></span>
              <span className="eyebrow">{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="panel calendar-panel">
            <div className="panel-header">
              <div className="calendar-title">
                <h2>Maio 2024</h2>
                <button aria-label="Mês anterior"><ChevronLeft /></button>
                <button aria-label="Próximo mês"><ChevronRight /></button>
              </div>
              <button className="today">Hoje</button>
            </div>
            <Calendar />
          </article>

          <article className="panel activities">
            <h2>Atividades Recentes</h2>
            <div className="activity-list">
              {activities.map(({ title, detail, icon: Icon, color }) => (
                <div className="activity" key={title}>
                  <span className={`activity-icon ${color}`}><Icon /></span>
                  <span><strong>{title}</strong><small>{detail}</small></span>
                </div>
              ))}
            </div>
            <button className="text-button">Ver todo histórico</button>
          </article>

          <article className="panel events">
            <div className="panel-header">
              <h2>Próximos Eventos</h2>
              <button className="text-button">Ver agenda completa</button>
            </div>
            <div className="event-list">
              <Event date="22" title="Culto de Celebração" time="20:00" place="Templo Principal" color="purple" />
              <Event date="25" title="Reunião de Liderança" time="19:30" place="Sala 04" color="green" />
            </div>
          </article>

          <article className="panel birthdays">
            <h2>Aniversariantes</h2>
            <Birthday image="/marta.png" name="Marta Guimarães" detail="Hoje • 34 anos" action="Parabenizar Marta" icon={<PartyPopper />} />
            <Birthday image="/bruna.png" name="Bruna de Almeida" detail="20/05 • 68 anos" action="Enviar mensagem para Bruna" icon={<Send />} />
          </article>
        </section>
      </main>
    </>
  );
}

function Event({ date, title, time, place, color }: { date: string; title: string; time: string; place: string; color: "purple" | "green" }) {
  return (
    <div className={`event ${color}-border`}>
      <div className="date"><strong>{date}</strong><small>Mai</small></div>
      <div><strong>{title}</strong><small><Clock /> {time} <MapPin /> {place}</small></div>
    </div>
  );
}

function Birthday({ image, name, detail, action, icon }: { image: string; name: string; detail: string; action: string; icon: React.ReactNode }) {
  return (
    <div className="birthday">
      <Image src={image} alt={name} width={48} height={48} />
      <span><strong>{name}</strong><small>{detail}</small></span>
      <button aria-label={action}>{icon}</button>
    </div>
  );
}
