
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ClassSession } from "@/lib/schedule";
import { ScheduleCard } from "@/components/ScheduleCard";
import { Filters } from "@/components/Filters";
import { Loader2, Github, Linkedin, CalendarClock, CalendarDays } from "lucide-react";
import { LOCAL_STORAGE_KEYS } from "@/constants/localStorage";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorage";

type ScheduleFilters = {
  course: string;
  day: string;
  period: string;
  subject: string;
  shift: string;
  search: string;
  professor: string;
};

const DEFAULT_FILTERS: ScheduleFilters = {
  course: "",
  day: "",
  period: "",
  subject: "",
  shift: "",
  search: "",
  professor: "",
};

function isValidScheduleFilters(value: unknown): value is ScheduleFilters {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.course === "string" &&
    typeof candidate.day === "string" &&
    typeof candidate.period === "string" &&
    typeof candidate.subject === "string" &&
    typeof candidate.shift === "string" &&
    typeof candidate.search === "string" &&
    typeof candidate.professor === "string"
  );
}

export default function Home() {
  const [schedule, setSchedule] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [filters, setFilters] = useState<ScheduleFilters>(DEFAULT_FILTERS);
  const [isFiltersHydrated, setIsFiltersHydrated] = useState(false);

  useEffect(() => {
    const savedFilters = getLocalStorageItem<ScheduleFilters>(LOCAL_STORAGE_KEYS.SCHEDULE_FILTERS);

    if (savedFilters && isValidScheduleFilters(savedFilters)) {
      setFilters(savedFilters);
    }

    setIsFiltersHydrated(true);
  }, []);

  useEffect(() => {
    if (!isFiltersHydrated) {
      return;
    }

    setLocalStorageItem(LOCAL_STORAGE_KEYS.SCHEDULE_FILTERS, filters);
  }, [filters, isFiltersHydrated]);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/schedule');
        const data = await response.json();
        // Handle both old array format (just in case of cache weirdness) and new object format
        if (Array.isArray(data)) {
          setSchedule(data);
        } else {
          setSchedule(data.schedule || []);
          setLastUpdated(data.lastUpdated);
        }
      } catch (error) {
        console.error("Failed to load schedule", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSchedule = useMemo(() => {
    return schedule.filter(s => {
      const matchesCourse = !filters.course || s.course === filters.course;
      const matchesDay = !filters.day || s.day.includes(filters.day);
      const matchesPeriod = !filters.period || s.period === filters.period;
      const matchesSubject = !filters.subject || s.subject === filters.subject;
      const matchesShift = !filters.shift || s.shift === filters.shift;
      const matchesProfessor = !filters.professor || s.professor === filters.professor;

      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search ||
        s.subject.toLowerCase().includes(searchLower) ||
        s.professor.toLowerCase().includes(searchLower);

      return matchesCourse && matchesDay && matchesPeriod && matchesSubject && matchesShift && matchesSearch && matchesProfessor;
    });
  }, [schedule, filters]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center md:text-left border-b border-slate-900 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
            Centro Universitário Católica do Tocantins
          </h1>
          <p className="text-slate-400 text-lg">Ensalamento e Horários 2026/2</p>

          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
            <Link
              href="/meu-horario"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              <CalendarClock className="w-4 h-4" /> Montar meu horário
            </Link>
            <Link
              href="/calendario"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-medium px-4 py-2 rounded-full border border-slate-800 transition-colors"
            >
              <CalendarDays className="w-4 h-4" /> Calendário acadêmico
            </Link>
          </div>

          {lastUpdated && (
            <p className="text-xs text-blue-400 mt-2 font-mono bg-blue-950/30 inline-block px-3 py-1 rounded-full border border-blue-900/50">
              ⚡ Atualizado: {new Date(lastUpdated).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-slate-500">Carregando horários...</p>
          </div>
        ) : (
          <>
            <Filters schedule={schedule} filters={filters} setFilters={setFilters} />

            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-slate-500">
                <span className="hidden sm:inline">Exibindo </span>
                <span className="font-bold text-white">{filteredSchedule.length}</span> aulas
                {filters.course && <span className="ml-1 text-slate-600">em {filters.course}</span>}
              </p>
            </div>

            {filteredSchedule.length === 0 ? (
              <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-900 border-dashed">
                <p className="text-xl">Nenhuma aula encontrada com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSchedule.map((session) => (
                  <ScheduleCard key={session.id} session={session} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="mt-12 py-6 border-t border-slate-900 text-center text-slate-600 text-sm">
        <p className="flex items-center justify-center gap-2 mb-2">
          Desenvolvido com 💙 por <strong className="text-slate-400">Leonardo Vinicius</strong>
        </p>
        <div className="flex items-center justify-center gap-4">
          <a href="https://github.com/leo-nardo" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <a href="https://www.linkedin.com/in/leonardo-vinicius-batista-santos-396745209" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <Linkedin className="w-4 h-4" />
            <span>LinkedIn</span>
          </a>
        </div>
      </footer>
    </main>
  );
}
