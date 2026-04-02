"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useRouter } from "next/navigation";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

const statusColors: Record<string, string> = {
  SCHEDULED: "#3b82f6",
  COMPLETED: "#22c55e",
  CANCELLED: "#9ca3af",
  NO_SHOW: "#f59e0b",
};

export function CalendarView({ events }: CalendarViewProps) {
  const router = useRouter();

  const parsedEvents = events.map((e) => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
  }));

  function eventStyleGetter(event: CalendarEvent) {
    return {
      style: {
        backgroundColor: statusColors[event.status] ?? "#6366f1",
        border: "none",
        borderRadius: "4px",
        color: "white",
        fontSize: "12px",
      },
    };
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4" style={{ height: "calc(100vh - 160px)" }}>
      <Calendar
        localizer={localizer}
        events={parsedEvents}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={["month", "week", "day", "agenda"]}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => router.push(`/sessions/${event.id}`)}
        style={{ height: "100%" }}
      />
    </div>
  );
}
