import calendarData from '@/data/academic-calendar.json';

export type AcademicEventType = 'inicio' | 'fim' | 'feriado' | 'prova' | 'importante' | 'reposicao' | 'prazo';

export interface AcademicEvent {
    date: string; // ISO date, e.g. "2026-08-10"
    label: string;
    type: AcademicEventType;
}

export function getAllEvents(): AcademicEvent[] {
    return [...(calendarData as AcademicEvent[])].sort((a, b) => a.date.localeCompare(b.date));
}

export function getUpcomingEvents(limit = 3): AcademicEvent[] {
    const today = new Date().toISOString().slice(0, 10);
    return getAllEvents().filter(e => e.date >= today).slice(0, limit);
}
