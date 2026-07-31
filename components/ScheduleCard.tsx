import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Building, Calendar, User } from "lucide-react";
import { ClassSession } from "@/lib/schedule";

interface ScheduleCardProps {
    session: ClassSession;
}

/** Maps shift → left-border color */
const SHIFT_BORDER: Record<string, string> = {
    "Manhã": "border-l-[var(--uc-amber)]",
    "Tarde": "border-l-[var(--uc-orange)]",
    "Noite": "border-l-[var(--uc-purple)]",
    "Integral": "border-l-[var(--uc-cyan)]",
};

/** Maps shift → badge background */
const SHIFT_BADGE: Record<string, string> = {
    "Manhã": "bg-[var(--uc-amber)]/15 text-[var(--uc-amber)] border-[var(--uc-amber)]/30",
    "Tarde": "bg-[var(--uc-orange)]/15 text-[var(--uc-orange)] border-[var(--uc-orange)]/30",
    "Noite": "bg-[var(--uc-purple)]/15 text-[var(--uc-purple)] border-[var(--uc-purple)]/30",
    "Integral": "bg-[var(--uc-cyan)]/15 text-[var(--uc-cyan)] border-[var(--uc-cyan)]/30",
};

export function ScheduleCard({ session }: ScheduleCardProps) {
    const borderClass = SHIFT_BORDER[session.shift] || "border-l-[var(--uc-purple)]";
    const badgeClass = SHIFT_BADGE[session.shift] || "bg-[var(--uc-purple)]/15 text-[var(--uc-purple)] border-[var(--uc-purple)]/30";

    return (
        <Card className={`border-l-4 ${borderClass} bg-[var(--uc-surface)] border-[var(--uc-border)] hover:border-[var(--uc-border-strong)] transition-all duration-200 hover:shadow-lg hover:shadow-[var(--uc-purple)]/5`}>
            <CardHeader className="pb-2">
                <div className="flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-[var(--uc-purple)] uppercase tracking-wider">
                            {session.course}
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                            {session.shift && (
                                <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>
                                    {session.shift}
                                </Badge>
                            )}
                            {session.period && (
                                <Badge variant="outline" className="text-[10px] bg-[var(--uc-surface2)] text-[var(--uc-text-mid)] border-[var(--uc-border)]">
                                    {session.period}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <CardTitle className="text-base font-bold leading-tight text-[var(--uc-text-hi)]">
                        {session.subject}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">

                {/* Professor & Turma */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[var(--uc-text-mid)]">
                        <User className="w-4 h-4 text-[var(--uc-text-low)]" />
                        <span className="font-medium">{session.professor}</span>
                    </div>
                    {session.classGroup && (
                        <span className="text-[10px] bg-[var(--uc-surface2)] px-2 py-0.5 rounded text-[var(--uc-text-low)]">
                            Turma {session.classGroup}
                        </span>
                    )}
                </div>

                <div className="h-px bg-[var(--uc-border)]" />

                {/* Location & Time Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">

                    {/* Day */}
                    <div className="col-span-2 flex items-center gap-2 text-[var(--uc-text-mid)]">
                        <Calendar className="w-4 h-4 text-[var(--uc-purple)]" />
                        <span className="capitalize">
                            {session.day}
                            {session.frequency && <span className="text-[var(--uc-amber)] ml-1">({session.frequency})</span>}
                        </span>
                    </div>

                    {/* Campus */}
                    <div className="flex items-center gap-2 text-[var(--uc-text-low)] text-xs">
                        <Building className="w-3 h-3" />
                        <span>{session.campus || "Campus I"}</span>
                    </div>

                    {/* Block / Room */}
                    <div className="flex items-center gap-2 text-[var(--uc-text-low)] text-xs">
                        <MapPin className="w-3 h-3" />
                        <span>
                            {session.block && session.block !== "-" ? `Bloco ${session.block} - ` : ""}
                            Sala {session.room}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
