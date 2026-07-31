
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ClassSession } from "@/lib/schedule";
import { buildScheduleKey } from "@/lib/scheduleKey";
import { encodeSelection, decodeSelection } from "@/lib/shareLink";
import { SubjectPicker } from "@/components/SubjectPicker";
import { WeeklyScheduleGrid } from "@/components/WeeklyScheduleGrid";
import { Button } from "@/components/ui/button";
import { LOCAL_STORAGE_KEYS } from "@/constants/localStorage";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorage";
import { Loader2, Link as LinkIcon, Pencil, Copy, Check, ArrowLeft } from "lucide-react";

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
        <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans pb-28">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 border-b border-slate-900 pb-6">
                    <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-400 mb-4">
                        <ArrowLeft className="w-4 h-4" /> Voltar para todos os horários
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
                        Meu Horário
                    </h1>
                    <p className="text-slate-400">
                        {mode === 'build'
                            ? "Escolha suas matérias e gere um link só seu. Sempre que abrir esse link, sala e horário aparecem atualizados."
                            : "Esse é o seu horário. Salve ou compartilhe o link — ele sempre traz os dados mais recentes."}
                    </p>
                </header>

                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 space-y-4">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-500">Carregando horários...</p>
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
                            <p className="text-sm text-slate-500">
                                <span className="font-bold text-white">{matchedSessions.length}</span> matérias no seu horário
                            </p>
                            <div className="flex gap-2">
                                <Button onClick={copyLink} variant="outline" className="border-blue-900 text-blue-200 hover:bg-blue-950">
                                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                    {copied ? "Link copiado" : "Copiar link"}
                                </Button>
                                <Button onClick={() => setMode('build')} className="bg-blue-600 hover:bg-blue-700">
                                    <Pencil className="w-4 h-4 mr-2" /> Editar minhas matérias
                                </Button>
                            </div>
                        </div>

                        {missingKeys.length > 0 && (
                            <div className="mb-6 bg-amber-950/30 border border-amber-900/50 rounded-xl p-4">
                                <p className="text-amber-300 font-semibold mb-2">Não encontramos mais estas matérias na planilha atual:</p>
                                <ul className="text-amber-200/80 text-sm space-y-1">
                                    {missingKeys.map(key => {
                                        const { course, subject, classGroup } = parseKey(key);
                                        return (
                                            <li key={key}>
                                                {subject} — {course} (Turma {classGroup})
                                            </li>
                                        );
                                    })}
                                </ul>
                                <p className="text-amber-200/60 text-xs mt-2">Pode ter sido renomeada, removida ou trocada de turma. Clique em &quot;Editar minhas matérias&quot; para ajustar.</p>
                            </div>
                        )}

                        <WeeklyScheduleGrid sessions={matchedSessions} />
                    </>
                )}
            </div>

            {mode === 'build' && !loading && (
                <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-blue-900/50 p-4 shadow-lg">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-300">
                            <span className="font-bold text-white">{selectedKeys.length}</span> matéria(s) selecionada(s)
                        </p>
                        <Button
                            onClick={generateLink}
                            disabled={selectedKeys.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <LinkIcon className="w-4 h-4 mr-2" /> Gerar meu link
                        </Button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function MeuHorarioPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        }>
            <MeuHorarioContent />
        </Suspense>
    );
}
