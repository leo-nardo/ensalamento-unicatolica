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
import { Search, X } from "lucide-react"

interface FiltersProps {
    schedule: ClassSession[];
    filters: FiltersState;
    setFilters: Dispatch<SetStateAction<FiltersState>>;
}

type FiltersState = {
    course: string;
    day: string;
    period: string;
    subject: string;
    shift: string;
    search: string;
    professor: string;
};

export function Filters({ schedule, filters, setFilters }: FiltersProps) {

    // Extract unique options from data based on current context
    const options = useMemo(() => {
        const relevantSchedule = filters.course
            ? schedule.filter(s => s.course === filters.course)
            : schedule;

        const courses = Array.from(new Set(schedule.map(s => s.course).filter(Boolean))).sort();
        const days = Array.from(new Set(relevantSchedule.map(s => s.day).filter(Boolean))).sort();
        const periods = Array.from(new Set(relevantSchedule.map(s => s.period).filter(p => p && p.toLowerCase() !== 'período'))).sort();
        const shifts = Array.from(new Set(relevantSchedule.map(s => s.shift).filter(Boolean))).sort();
        const professors = Array.from(new Set(relevantSchedule.map(s => s.professor).filter(Boolean))).sort();

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

        return { courses, days: sortedDays, periods, shifts: sortedShifts, professors };
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
                search: '',
                professor: '',
            });
        } else {
            setFilters((prev) => ({ ...prev, [key]: finalValue }));
        }
    };

    const clearFilters = () => {
        setFilters({ course: '', day: '', period: '', subject: '', shift: '', search: '', professor: '' });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    return (
        <div className="bg-[var(--uc-surface)] border border-[var(--uc-border)] rounded-xl p-6 mb-8">

            {/* Top Row: Course and Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <Label htmlFor="course-filter" className="text-[var(--uc-purple)] font-semibold">Curso</Label>
                    <Select value={filters.course} onValueChange={(v) => handleChange('course', v)}>
                        <SelectTrigger id="course-filter" className="bg-[var(--uc-bg)] border-[var(--uc-border)] text-[var(--uc-text-hi)] focus:ring-[var(--uc-purple)]">
                            <SelectValue placeholder="Selecione o Curso" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--uc-bg2)] border-[var(--uc-border)] text-[var(--uc-text-hi)]">
                            <SelectItem value="all">Todos os Cursos</SelectItem>
                            {options.courses.map(course => (
                                <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="search-filter" className="text-[var(--uc-text-mid)]">Buscar (Disciplina ou Professor)</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--uc-text-low)]" />
                        <Input
                            id="search-filter"
                            placeholder="Digite o nome..."
                            className="pl-9 bg-[var(--uc-bg)] border-[var(--uc-border)] text-[var(--uc-text-hi)] placeholder:text-[var(--uc-text-low)] focus:ring-[var(--uc-purple)] focus:border-[var(--uc-border-strong)]"
                            value={filters.search}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Secondary Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Period Filter */}
                <div className="space-y-2">
                    <Label htmlFor="period-filter" className="text-[var(--uc-text-mid)]">Período</Label>
                    <Select value={filters.period} onValueChange={(v) => handleChange('period', v)} disabled={!filters.course && options.periods.length > 20}>
                        <SelectTrigger id="period-filter" className="bg-[var(--uc-bg)] border-[var(--uc-border)] text-[var(--uc-text-hi)] focus:ring-[var(--uc-purple)]">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--uc-bg2)] border-[var(--uc-border)] text-[var(--uc-text-hi)] max-h-60">
                            <SelectItem value="all">Todos</SelectItem>
                            {options.periods.map(period => (
                                <SelectItem key={period} value={period}>{period}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Shift Filter */}
                <div className="space-y-2">
                    <Label htmlFor="shift-filter" className="text-[var(--uc-text-mid)]">Turno</Label>
                    <Select value={filters.shift} onValueChange={(v) => handleChange('shift', v)}>
                        <SelectTrigger id="shift-filter" className="bg-[var(--uc-bg)] border-[var(--uc-border)] text-[var(--uc-text-hi)] focus:ring-[var(--uc-purple)]">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--uc-bg2)] border-[var(--uc-border)] text-[var(--uc-text-hi)]">
                            <SelectItem value="all">Todos</SelectItem>
                            {options.shifts.map(shift => (
                                <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Day Filter */}
                <div className="space-y-2">
                    <Label htmlFor="day-filter" className="text-[var(--uc-text-mid)]">Dia da Semana</Label>
                    <Select value={filters.day} onValueChange={(v) => handleChange('day', v)}>
                        <SelectTrigger id="day-filter" className="bg-[var(--uc-bg)] border-[var(--uc-border)] text-[var(--uc-text-hi)] focus:ring-[var(--uc-purple)]">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--uc-bg2)] border-[var(--uc-border)] text-[var(--uc-text-hi)]">
                            <SelectItem value="all">Todos</SelectItem>
                            {options.days.map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Professor Filter */}
                <div className="space-y-2">
                    <Label htmlFor="professor-filter" className="text-[var(--uc-text-mid)]">Professor</Label>
                    <Select value={filters.professor} onValueChange={(v) => handleChange('professor', v)}>
                        <SelectTrigger id="professor-filter" className="bg-[var(--uc-bg)] border-[var(--uc-border)] text-[var(--uc-text-hi)] focus:ring-[var(--uc-purple)]">
                            <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--uc-bg2)] border-[var(--uc-border)] text-[var(--uc-text-hi)] max-h-60">
                            <SelectItem value="all">Todos</SelectItem>
                            {options.professors.map(professor => (
                                <SelectItem key={professor} value={professor}>{professor}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {hasActiveFilters && (
                <div className="mt-4 flex justify-end border-t border-[var(--uc-border)] pt-4">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[var(--uc-text-low)] hover:text-[var(--uc-text-hi)] hover:bg-[var(--uc-surface2)] gap-1.5">
                        <X className="w-3.5 h-3.5" />
                        Limpar Filtros
                    </Button>
                </div>
            )}
        </div>
    );
}
