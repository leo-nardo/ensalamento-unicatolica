"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClassSession } from "@/lib/schedule";
import { buildScheduleKey } from "@/lib/scheduleKey";
import { encodeSelection, decodeSelection } from "@/lib/shareLink";
import { SubjectPicker } from "@/components/SubjectPicker";
import { WeeklyScheduleGrid } from "@/components/WeeklyScheduleGrid";
import { NavBar } from "@/components/NavBar";
import { CreditBadge } from "@/components/CreditBadge";
import { Button } from "@/components/ui/button";
import { LOCAL_STORAGE_KEYS } from "@/constants/localStorage";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorage";
import { Loader2, Link as LinkIcon, Pencil, Copy, Check } from "lucide-react";

type FiltersState = {
    course: string;
    day: string;
    period: string;
    subject: string;
    shift: string;
    search: string;
    professor: string;
};

const DEFAULT_FILTERS: FiltersState = {
    course: "", day: "", period: "", subject: "", shift: "", search: "", professor: "",
};

function parseKey(key: string) {
    const [course, subject, classGroup] = key.split('::');
    return { course, subject, classGroup };
}

function MeuHorarioContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [schedule, setSchedule] = useState<ClassSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [mode, setMode] = useState<'build' | 'view'>('build');
    const [hydrated, setHydrated] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch('/api/schedule');
                const data = await response.json();
                setSchedule(Array.isArray(data) ? data : (data.schedule || []));
            } catch (error) {
                console.error("Failed to load schedule", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        const fromUrl = searchParams.get('m');

        if (fromUrl) {
            setSelectedKeys(decodeSelection(fromUrl));
            setMode('view');
        } else {
            const draft = getLocalStorageItem<string[]>(LOCAL_STORAGE_KEYS.MY_SCHEDULE_DRAFT);
            setSelectedKeys(draft || []);
            setMode('build');
        }
        setHydrated(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!hydrated || mode !== 'build') return;
        setLocalStorageItem(LOCAL_STORAGE_KEYS.MY_SCHEDULE_DRAFT, selectedKeys);
    }, [selectedKeys, mode, hydrated]);

    const filteredSchedule = useMemo(() => {
        return schedule.filter(s => {
            const matchesCourse = !filters.course || s.course === filters.course;
            const matchesDay = !filters.day || s.day.includes(filters.day);
            const matchesPeriod = !filters.period || s.period === filters.period;
            const matchesShift = !filters.shift || s.shift === filters.shift;
            const matchesProfessor = !filters.professor || s.professor === filters.professor;

            const searchLower = filters.search.toLowerCase();
            const matchesSearch = !filters.search ||
                s.subject.toLowerCase().includes(searchLower) ||
                s.professor.toLowerCase().includes(searchLower);

            return matchesCourse && matchesDay && matchesPeriod && matchesShift && matchesSearch && matchesProfessor;
        });
    }, [schedule, filters]);

    const { matchedSessions, missingKeys } = useMemo(() => {
        const matched: ClassSession[] = [];
        const missing: string[] = [];

        selectedKeys.forEach(key => {
            const found = schedule.find(s => buildScheduleKey(s) === key);
            if (found) matched.push(found);
            else missing.push(key);
        });

        return { matchedSessions: matched, missingKeys: missing };
    }, [selectedKeys, schedule]);

    function toggleKey(key: string) {
        setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }

    function generateLink() {
        const encoded = encodeSelection(selectedKeys);
        router.replace(`/meu-horario?m=${encoded}`);
        setMode('view');
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy link", error);
        }
    }

    return (
        <>
            <NavBar />
            <main className="min-h-screen bg-[var(--uc-bg)] text-[var(--uc-text-hi)] p-4 md:p-8 font-sans pb-28">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8 pt-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--uc-text-hi)] mb-2">
                            {mode === 'build' ? 'Montar Horário' : 'Meu Horário'}
                        </h1>
                        <p className="text-[var(--uc-text-mid)]">
                            {mode === 'build'
                                ? "Escolha suas matérias e gere um link só seu. Sempre que abrir esse link, sala e horário aparecem atualizados."
                                : "Esse é o seu horário. Salve ou compartilhe o link — ele sempre traz os dados mais recentes."}
                        </p>
                    </header>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 space-y-4">
                            <Loader2 className="w-12 h-12 text-[var(--uc-purple)] animate-spin" />
                            <p className="text-[var(--uc-text-low)]">Carregando horários...</p>
                        </div>
                    ) : mode === 'build' ? (
                        <SubjectPicker
                            schedule={schedule}
                            filteredSchedule={filteredSchedule}
                            filters={filters}
                            setFilters={setFilters}
                            selectedKeys={selectedKeys}
                            onToggle={toggleKey}
                        />
                    ) : (
                        <>
                            <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                <p className="text-sm text-[var(--uc-text-mid)]">
                                    <span className="font-bold text-[var(--uc-text-hi)]">{matchedSessions.length}</span> matérias no seu horário
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={copyLink} variant="outline" className="border-[var(--uc-border-strong)] text-[var(--uc-purple)] hover:bg-[var(--uc-purple)]/10">
                                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                        {copied ? "Link copiado" : "Copiar link"}
                                    </Button>
                                    <Button onClick={() => setMode('build')} className="bg-[var(--uc-purple)] hover:bg-[var(--uc-purple-deep)] text-white">
                                        <Pencil className="w-4 h-4 mr-2" /> Editar minhas matérias
                                    </Button>
                                </div>
                            </div>

                            {missingKeys.length > 0 && (
                                <div className="mb-6 bg-[var(--uc-amber)]/10 border border-[var(--uc-amber)]/30 rounded-xl p-4">
                                    <p className="text-[var(--uc-amber)] font-semibold mb-2">Não encontramos mais estas matérias na planilha atual:</p>
                                    <ul className="text-[var(--uc-amber)]/80 text-sm space-y-1">
                                        {missingKeys.map(key => {
                                            const { course, subject, classGroup } = parseKey(key);
                                            return (
                                                <li key={key}>
                                                    {subject} — {course} (Turma {classGroup})
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <p className="text-[var(--uc-amber)]/60 text-xs mt-2">Pode ter sido renomeada, removida ou trocada de turma. Clique em &quot;Editar minhas matérias&quot; para ajustar.</p>
                                </div>
                            )}

                            <WeeklyScheduleGrid sessions={matchedSessions} />
                        </>
                    )}
                </div>

                {mode === 'build' && !loading && (
                    <div className="fixed bottom-0 left-0 right-0 bg-[var(--uc-surface)] border-t border-[var(--uc-border-strong)] p-4 shadow-lg backdrop-blur-xl">
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                            <p className="text-sm text-[var(--uc-text-mid)]">
                                <span className="font-bold text-[var(--uc-text-hi)]">{selectedKeys.length}</span> matéria(s) selecionada(s)
                            </p>
                            <Button
                                onClick={generateLink}
                                disabled={selectedKeys.length === 0}
                                className="bg-[var(--uc-green)] hover:bg-[var(--uc-green)]/80 text-[var(--uc-bg)] font-semibold disabled:opacity-50"
                            >
                                <LinkIcon className="w-4 h-4 mr-2" /> Gerar meu link
                            </Button>
                        </div>
                    </div>
                )}
            </main>
            <CreditBadge />
        </>
    );
}

export default function MeuHorarioPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--uc-bg)] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[var(--uc-purple)] animate-spin" />
            </div>
        }>
            <MeuHorarioContent />
        </Suspense>
    );
}
