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

function toLocalISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export interface ClassDayCheck {
    hasClass: boolean;
    reason: 'weekend' | 'feriado' | null;
    holiday?: AcademicEvent;
}

export function checkIsClassDay(date: Date = new Date()): ClassDayCheck {
    const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { hasClass: false, reason: 'weekend' };
    }

    const isoDate = toLocalISODate(date);
    const holiday = getAllEvents().find(e => e.date === isoDate && e.type === 'feriado');
    if (holiday) {
        return { hasClass: false, reason: 'feriado', holiday };
    }

    return { hasClass: true, reason: null };
}
