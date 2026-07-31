import { ClassSession } from '@/lib/schedule';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Building, User } from 'lucide-react';

const DAY_ORDER = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Maps shift → left-border color */
const SHIFT_BORDER: Record<string, string> = {
    "Manhã": "border-l-[var(--uc-amber)]",
    "Tarde": "border-l-[var(--uc-orange)]",
    "Noite": "border-l-[var(--uc-purple)]",
    "Integral": "border-l-[var(--uc-cyan)]",
};

interface WeeklyScheduleGridProps {
    sessions: ClassSession[];
}

export function WeeklyScheduleGrid({ sessions }: WeeklyScheduleGridProps) {
    // Always show all 6 days (Mon-Sat), even if empty
    const byDay = DAY_ORDER.map(day => ({
        day,
        sessions: sessions
            .filter(s => s.day === day)
            .sort((a, b) => a.time.localeCompare(b.time)),
    }));

    if (sessions.length === 0) {
        return (
            <div className="text-center py-20 text-[var(--uc-text-low)] bg-[var(--uc-surface)]/50 rounded-xl border border-[var(--uc-border)] border-dashed">
                <p className="text-xl">Nenhuma matéria encontrada.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {byDay.map(({ day, sessions: daySessions }) => (
                <div key={day} className="flex flex-col">
                    <h3 className="text-[var(--uc-purple)] font-bold uppercase tracking-wide text-xs mb-4 pb-2 border-b border-[var(--uc-border)]">{day}</h3>
                    {daySessions.length === 0 ? (
                        <p className="text-[var(--uc-text-low)] text-xs italic">Sem aulas</p>
                    ) : (
                        <div className="space-y-4">
                            {daySessions.map(session => {
                                const borderClass = SHIFT_BORDER[session.shift] || "border-l-[var(--uc-purple)]";
                                return (
                                    <div key={session.id} className={`border-l-4 ${borderClass} bg-[var(--uc-bg2)] rounded-lg p-3 space-y-1.5`}>
                                        <p className="font-semibold text-[var(--uc-text-hi)] leading-tight text-sm">{session.subject}</p>
                                        <p className="text-[10px] text-[var(--uc-purple)] uppercase tracking-wide">{session.course}</p>

                                        <div className="flex items-center gap-2 text-[var(--uc-text-mid)] text-xs pt-1">
                                            <Clock className="w-3.5 h-3.5 text-[var(--uc-text-low)] shrink-0" />
                                            <span>{session.time || session.shift}</span>
                                            {session.frequency && <span className="text-[var(--uc-amber)]">({session.frequency})</span>}
                                        </div>

                                        <div className="flex items-center gap-2 text-[var(--uc-text-mid)] text-xs">
                                            <User className="w-3.5 h-3.5 text-[var(--uc-text-low)] shrink-0" />
                                            <span>{session.professor}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-[var(--uc-text-mid)] text-xs">
                                            <Building className="w-3.5 h-3.5 text-[var(--uc-text-low)] shrink-0" />
                                            <span>{session.campus || "Campus I"}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-[var(--uc-text-mid)] text-xs">
                                            <MapPin className="w-3.5 h-3.5 text-[var(--uc-text-low)] shrink-0" />
                                            <span>
                                                {session.block && session.block !== "-" ? `Bloco ${session.block} - ` : ""}
                                                Sala {session.room}
                                            </span>
                                        </div>

                                        {session.classGroup && (
                                            <Badge variant="outline" className="mt-1 text-[10px] bg-[var(--uc-surface2)] text-[var(--uc-text-low)] border-[var(--uc-border)]">
                                                Turma {session.classGroup}
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
