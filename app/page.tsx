"use client";

import { useEffect, useState, useMemo } from "react";
import { ClassSession } from "@/lib/schedule";
import { ScheduleCard } from "@/components/ScheduleCard";
import { Filters } from "@/components/Filters";
import { NavBar } from "@/components/NavBar";
import { CreditBadge } from "@/components/CreditBadge";
import { Loader2 } from "lucide-react";
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
    <>
      <NavBar />
      <main className="min-h-screen bg-[var(--uc-bg)] text-[var(--uc-text-hi)] p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 pt-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--uc-text-hi)] mb-2">
              Horários & Ensalamento
            </h1>
            <p className="text-[var(--uc-text-mid)] text-lg">Semestre 2026/2 — Consulta rápida de todos os cursos</p>

            {lastUpdated && (
              <p className="text-xs text-[var(--uc-purple)] mt-3 font-mono bg-[var(--uc-purple)]/10 inline-block px-3 py-1 rounded-full border border-[var(--uc-purple)]/20">
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
              <Loader2 className="w-12 h-12 text-[var(--uc-purple)] animate-spin" />
              <p className="text-[var(--uc-text-low)]">Carregando horários...</p>
            </div>
          ) : (
            <>
              <Filters schedule={schedule} filters={filters} setFilters={setFilters} />

              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-[var(--uc-text-low)]">
                  <span className="hidden sm:inline">Exibindo </span>
                  <span className="font-bold text-[var(--uc-text-hi)]">{filteredSchedule.length}</span> aulas
                  {filters.course && <span className="ml-1 text-[var(--uc-text-low)]">em {filters.course}</span>}
                </p>
              </div>

              {filteredSchedule.length === 0 ? (
                <div className="text-center py-20 text-[var(--uc-text-low)] bg-[var(--uc-surface)]/50 rounded-xl border border-[var(--uc-border)] border-dashed">
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

      </main>
      <CreditBadge />
    </>
  );
}
