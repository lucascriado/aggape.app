"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function Calendar({ events = [] }: { events?: Array<{ id: string; title: string; startsAt: string; color: string }> }) {
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => {
    const value = index - firstWeekday + 1;
    if (value < 1) return { number: previousMonthDays + value, outside: true };
    if (value > daysInMonth) return { number: value - daysInMonth, outside: true };
    return { number: value, outside: false };
  });

  return (
    <>
      <div className="panel-header">
        <div className="calendar-title">
          <h2>{new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(visibleDate)}</h2>
          <button aria-label="Mês anterior" onClick={() => setVisibleDate(new Date(year, month - 1, 1))}><ChevronLeft /></button>
          <button aria-label="Próximo mês" onClick={() => setVisibleDate(new Date(year, month + 1, 1))}><ChevronRight /></button>
        </div>
        <button className="today" onClick={() => setVisibleDate(new Date())}>Hoje</button>
      </div>
      <div className="calendar">
        {weekdays.map((day) => <div className="weekday" key={day}>{day}</div>)}
        {days.map((day, index) => {
          const event = !day.outside ? events.find((item) => { const value = new Date(item.startsAt); return value.getFullYear() === year && value.getMonth() === month && value.getDate() === day.number; }) : undefined;
          return <div className={[day.outside && "outside", event && "selected", event?.color === "green" && "green-day"].filter(Boolean).join(" ")} key={`${day.number}-${index}`}>{day.number}{event && <span className="tag">{event.title}</span>}</div>;
        })}
      </div>
    </>
  );
}
