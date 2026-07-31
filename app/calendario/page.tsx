import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/NavBar";
import { getAllEvents, getUpcomingEvents, type AcademicEvent, type AcademicEventType } from "@/lib/academicCalendar";

const TYPE_LABELS: Record<AcademicEventType, string> = {
    inicio: "Início",
    fim: "Fim",
    feriado: "Feriado",
    prova: "Prova",
    importante: "Importante",
};

const TYPE_STYLES: Record<AcademicEventType, string> = {
    inicio: "bg-[var(--uc-green)]/15 text-[var(--uc-green)] border-[var(--uc-green)]/30",
    fim: "bg-[var(--uc-slate)]/15 text-[var(--uc-slate)] border-[var(--uc-slate)]/30",
    feriado: "bg-[var(--uc-amber)]/15 text-[var(--uc-amber)] border-[var(--uc-amber)]/30",
    prova: "bg-[var(--uc-rose)]/15 text-[var(--uc-rose)] border-[var(--uc-rose)]/30",
    importante: "bg-[var(--uc-blue)]/15 text-[var(--uc-blue)] border-[var(--uc-blue)]/30",
};

const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatDate(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function groupByMonth(events: AcademicEvent[]) {
    const groups = new Map<string, AcademicEvent[]>();

    events.forEach(event => {
        const [year, month] = event.date.split('-');
        const key = `${year}-${month}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(event);
    });

    return Array.from(groups.entries()).map(([key, groupEvents]) => {
        const [year, month] = key.split('-').map(Number);
        return { label: `${MONTH_NAMES[month - 1]} ${year}`, events: groupEvents };
    });
}

export default function CalendarioPage() {
    const allEvents = getAllEvents();
    const upcoming = getUpcomingEvents(3);
    const monthGroups = groupByMonth(allEvents);

    return (
        <>
            <NavBar />
            <main className="min-h-screen bg-[var(--uc-bg)] text-[var(--uc-text-hi)] p-4 md:p-8 font-sans">
                <div className="max-w-4xl mx-auto">
                    <header className="mb-8 pt-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--uc-text-hi)] mb-2">
                            Calendário Acadêmico
                        </h1>
                        <p className="text-[var(--uc-text-mid)]">Datas importantes do semestre: feriados, provas e mais.</p>
                    </header>

                    {allEvents.length === 0 ? (
                        <div className="text-center py-20 text-[var(--uc-text-low)] bg-[var(--uc-surface)]/50 rounded-xl border border-[var(--uc-border)] border-dashed">
                            <CalendarDays className="w-10 h-10 mx-auto mb-3 text-[var(--uc-text-low)]" />
                            <p className="text-xl">O calendário do semestre ainda não foi cadastrado.</p>
                            <p className="text-sm mt-1">Assim que sair o calendário oficial, essas datas aparecem aqui.</p>
                        </div>
                    ) : (
                        <>
                            {upcoming.length > 0 && (
                                <section className="mb-10">
                                    <h2 className="text-lg font-semibold text-[var(--uc-text-mid)] mb-3">Próximos eventos</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {upcoming.map(event => (
                                            <div key={`${event.date}-${event.label}`} className="bg-[var(--uc-surface)] border border-[var(--uc-border)] hover:border-[var(--uc-border-strong)] rounded-xl p-4 transition-all duration-200">
                                                <p className="text-2xl font-bold text-[var(--uc-text-hi)]">{formatDate(event.date)}</p>
                                                <p className="text-[var(--uc-text-mid)] mt-1">{event.label}</p>
                                                <Badge variant="outline" className={`mt-2 ${TYPE_STYLES[event.type]}`}>
                                                    {TYPE_LABELS[event.type]}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="space-y-8">
                                {monthGroups.map(group => (
                                    <div key={group.label}>
                                        <h2 className="text-lg font-semibold text-[var(--uc-text-mid)] mb-3">{group.label}</h2>
                                        <div className="space-y-2">
                                            {group.events.map(event => (
                                                <div
                                                    key={`${event.date}-${event.label}`}
                                                    className="flex items-center justify-between gap-4 bg-[var(--uc-surface)]/50 border border-[var(--uc-border)] rounded-lg px-4 py-3 hover:border-[var(--uc-border-strong)] transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-mono text-[var(--uc-text-low)] text-sm w-24">{formatDate(event.date)}</span>
                                                        <span className="text-[var(--uc-text-hi)]">{event.label}</span>
                                                    </div>
                                                    <Badge variant="outline" className={TYPE_STYLES[event.type]}>
                                                        {TYPE_LABELS[event.type]}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </section>
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
