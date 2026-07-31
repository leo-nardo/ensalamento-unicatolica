
import { ClassSession } from '@/lib/schedule';
import { buildScheduleKey } from '@/lib/scheduleKey';
import { ScheduleCard } from '@/components/ScheduleCard';
import { Filters } from '@/components/Filters';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';

type FiltersState = {
    course: string;
    day: string;
    period: string;
    subject: string;
    shift: string;
    search: string;
    professor: string;
};

interface SubjectPickerProps {
    schedule: ClassSession[];
    filteredSchedule: ClassSession[];
    filters: FiltersState;
    setFilters: Dispatch<SetStateAction<FiltersState>>;
    selectedKeys: string[];
    onToggle: (key: string) => void;
}

export function SubjectPicker({ schedule, filteredSchedule, filters, setFilters, selectedKeys, onToggle }: SubjectPickerProps) {
    return (
        <>
            <Filters schedule={schedule} filters={filters} setFilters={setFilters} />

            {filteredSchedule.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-900 border-dashed">
                    <p className="text-xl">Nenhuma aula encontrada com os filtros selecionados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredSchedule.map((session) => {
                        const key = buildScheduleKey(session);
                        const isSelected = selectedKeys.includes(key);

                        return (
                            <div key={session.id} className="relative">
                                <ScheduleCard session={session} />
                                <Button
                                    size="sm"
                                    onClick={() => onToggle(key)}
                                    className={
                                        isSelected
                                            ? 'absolute top-3 right-3 bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white'
                                    }
                                >
                                    {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
