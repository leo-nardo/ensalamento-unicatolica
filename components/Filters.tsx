
import { ClassSession } from '@/lib/schedule';
import { useMemo, type Dispatch, type SetStateAction } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface FiltersProps {
    schedule: ClassSession[];
    filters: FiltersState;
    setFilters: Dispatch<SetStateAction<FiltersState>>;
    theme?: Theme;
}

type FiltersState = {
    course: string;
    day: string;
    period: string;
    subject: string;
    shift: string;
    search: string;
};

type Theme = "light" | "dark";

type LightClearButtonProps = {
    onClick: () => void;
};

function LightClearButton({ onClick }: LightClearButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group relative w-[50px] h-[50px] rounded-full bg-[rgb(20,20,20)] border-0 font-semibold flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.164)] cursor-pointer transition-all duration-300 overflow-hidden hover:w-[140px] hover:rounded-[50px] hover:bg-[rgb(255,69,69)]"
        >
            <svg viewBox="0 0 448 512" className="w-3 transition-all duration-300 group-hover:w-[50px] group-hover:translate-y-[60%]">
                <path className="fill-white" d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
            </svg>
            <span className="absolute -top-5 text-white transition-all duration-300 text-[2px] group-hover:text-[13px] group-hover:opacity-100 group-hover:translate-y-[30px]">
                Limpar Filtros
            </span>
        </button>
    );
}

export function Filters({ schedule, filters, setFilters, theme }: FiltersProps) {

    // Extract unique options from data based on current context
    const options = useMemo(() => {
        const relevantSchedule = filters.course
            ? schedule.filter(s => s.course === filters.course)
            : schedule;

        const courses = Array.from(new Set(schedule.map(s => s.course).filter(Boolean))).sort();
        const days = Array.from(new Set(relevantSchedule.map(s => s.day).filter(Boolean))).sort();
        const periods = Array.from(new Set(relevantSchedule.map(s => s.period).filter(p => p && p.toLowerCase() !== 'período'))).sort();
        // const subjects = Array.from(new Set(relevantSchedule.map(s => s.subject).filter(s => s && s.toLowerCase() !== 'disciplina'))).sort();
        const shifts = Array.from(new Set(relevantSchedule.map(s => s.shift).filter(Boolean))).sort();

        // Custom Sort for Days
        const dayOrder = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
        const sortedDays = days.sort((a, b) => {
            const indexA = dayOrder.findIndex(d => a.includes(d));
            const indexB = dayOrder.findIndex(d => b.includes(d));
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });

        // Custom Sort for Shift
        const shiftOrder = ["Manhã", "Tarde", "Noite"];
        const sortedShifts = shifts.sort((a, b) => {
            const indexA = shiftOrder.indexOf(a);
            const indexB = shiftOrder.indexOf(b);
            return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        });

        return { courses, days: sortedDays, periods, shifts: sortedShifts };
    }, [schedule, filters.course]);

    const handleChange = (key: keyof FiltersState, value: string) => {
        const finalValue = value === "all" ? "" : value;

        if (key === 'course') {
            // Reset other filters when course changes
            setFilters({
                course: finalValue,
                day: '',
                period: '',
                subject: '',
                shift: '',
                search: ''
            });
        } else {
            setFilters((prev) => ({ ...prev, [key]: finalValue }));
        }
    };

    const clearFilters = () => {
        setFilters({ course: '', day: '', period: '', subject: '', shift: '', search: '' });
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-lg">

            {/* Top Row: Course and Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <Label htmlFor="course-filter" className="text-primary">Curso</Label>
                    <Select value={filters.course} onValueChange={(v) => handleChange('course', v)}>
                        <SelectTrigger id="course-filter" className="bg-background border-border text-foreground focus:ring-blue-500">
                            <SelectValue placeholder="Selecione o Curso" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border text-popover-foreground">
                            <SelectItem value="all">Todos os Cursos</SelectItem>
                            {options.courses.map(course => (
                                <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="search-filter" className="text-foreground">Buscar (Disciplina ou Professor)</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
                        <Input
                            id="search-filter"
                            placeholder="Digite o nome..."
                            className="pl-9 bg-background border-border text-foreground focus:ring-blue-500"
                            value={filters.search}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Secondary Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Period Filter */}
                <div className="space-y-2">
                    <Label htmlFor="period-filter" className="text-foreground">Período</Label>
                    <Select value={filters.period} onValueChange={(v) => handleChange('period', v)} disabled={!filters.course && options.periods.length > 20}>
                        <SelectTrigger id="period-filter" className="bg-background border-border text-foreground focus:ring-blue-500">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border text-popover-foreground max-h-60">
                            <SelectItem value="all">Todos</SelectItem>
                            {options.periods.map(period => (
                                <SelectItem key={period} value={period}>{period}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Shift Filter */}
                <div className="space-y-2">
                    <Label htmlFor="shift-filter" className="text-foreground">Turno</Label>
                    <Select value={filters.shift} onValueChange={(v) => handleChange('shift', v)}>
                        <SelectTrigger id="shift-filter" className="bg-background border-border text-foreground focus:ring-blue-500">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border text-popover-foreground">
                            <SelectItem value="all">Todos</SelectItem>
                            {options.shifts.map(shift => (
                                <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Day Filter */}
                <div className="space-y-2">
                    <Label htmlFor="day-filter" className="text-foreground">Dia da Semana</Label>
                    <Select value={filters.day} onValueChange={(v) => handleChange('day', v)}>
                        <SelectTrigger id="day-filter" className="bg-background border-border text-foreground focus:ring-blue-500">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border text-popover-foreground">
                            <SelectItem value="all">Todos</SelectItem>
                            {options.days.map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="mt-4 flex justify-between items-center border-t border-border pt-4">
                {theme === "light" ? (
                    <LightClearButton onClick={clearFilters} />
                ) : (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-foreground hover:bg-muted">
                        Limpar Filtros
                    </Button>
                )}
            </div>
        </div>
    );
}
