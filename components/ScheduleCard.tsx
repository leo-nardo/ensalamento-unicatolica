
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building, Calendar, User } from "lucide-react";
import { ClassSession } from "@/lib/schedule";

interface ScheduleCardProps {
    session: ClassSession;
}

export function ScheduleCard({ session }: ScheduleCardProps) {
    return (
        <Card className="border-border/50 border-l-4 border-l-primary/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                {session.course}
                            </span>
                        </div>
                        {session.period && (
                            <Badge
                                variant="outline"
                                className="shrink-0 px-3 py-0.5 text-xs font-semibold border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
                            >
                                {session.period}
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="text-lg font-bold leading-tight">
                        {session.subject}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">

                {/* Professor & Turma */}
                <div className="flex flex-wrap items-center gap-2 text-foreground">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-foreground" />
                        <span className="font-medium">{session.professor}</span>
                    </div>
                    {session.classGroup && (
                        <span className="text-sm bg-primary/10 px-2 py-1 rounded text-primary">
                            Turma: {session.classGroup}
                        </span>
                    )}
                </div>

                <div className="h-px bg-border/50" />

                {/* Location & Time Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">

                    {/* Time / Day */}
                    <div className="col-span-2 flex items-center gap-2 text-foreground">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="capitalize">
                            {session.day}
                            {session.frequency && <span className="text-amber-500 ml-1">({session.frequency})</span>}
                            <span className="ml-1 text-foreground">({session.shift})</span>
                        </span>
                    </div>

                    {/* Campus */}
                    <div className="flex items-center gap-2 text-foreground text-xs">
                        <Building className="w-3 h-3 text-red-500 dark:text-foreground" />
                        <span className="text-red-500 dark:text-foreground">
                            {session.campus || "Campus I"}
                        </span>
                    </div>

                    {/* Block / Room */}
                    <div className="flex items-center gap-2 text-foreground text-xs">
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
