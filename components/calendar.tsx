const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const days = [
  { number: 28, outside: true },
  { number: 29, outside: true },
  { number: 30, outside: true },
  ...Array.from({ length: 31 }, (_, index) => ({ number: index + 1, outside: false })),
  { number: 1, outside: true },
];

export function Calendar() {
  return (
    <div className="calendar">
      {weekdays.map((day) => <div className="weekday" key={day}>{day}</div>)}
      {days.map((day, index) => {
        const selected = !day.outside && (day.number === 22 || day.number === 25);
        const isGreen = !day.outside && day.number === 25;
        const className = [
          day.outside && "outside",
          selected && "selected",
          isGreen && "green-day",
        ].filter(Boolean).join(" ");

        return (
          <div className={className} key={`${day.number}-${index}`}>
            {day.number}
            {selected && <span className="tag">{isGreen ? "Reunião" : "Culto"}</span>}
          </div>
        );
      })}
    </div>
  );
}
