
"use client";

import { useEffect, useState, useMemo } from "react";
import { ClassSession } from "@/lib/schedule";
import { ScheduleCard } from "@/components/ScheduleCard";
import { Filters } from "@/components/Filters";
import { Loader2, Github, Linkedin, Sun, Moon } from "lucide-react";
import { LOCAL_STORAGE_KEYS } from "@/constants/localStorage";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorage";

type ScheduleFilters = {
  course: string;
  day: string;
  period: string;
  subject: string;
  shift: string;
  search: string;
};

const DEFAULT_FILTERS: ScheduleFilters = {
  course: "",
  day: "",
  period: "",
  subject: "",
  shift: "",
  search: "",
};

type Theme = "light" | "dark";

function isValidTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

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
    typeof candidate.search === "string"
  );
}

export default function Home() {
  const [schedule, setSchedule] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [filters, setFilters] = useState<ScheduleFilters>(DEFAULT_FILTERS);
  const [isFiltersHydrated, setIsFiltersHydrated] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

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
    const savedTheme = getLocalStorageItem<Theme>(LOCAL_STORAGE_KEYS.THEME);

    if (savedTheme && isValidTheme(savedTheme)) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return;
    }

    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (!theme) {
      return;
    }

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setLocalStorageItem(LOCAL_STORAGE_KEYS.THEME, theme);
  }, [theme]);

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

      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search ||
        s.subject.toLowerCase().includes(searchLower) ||
        s.professor.toLowerCase().includes(searchLower);

      return matchesCourse && matchesDay && matchesPeriod && matchesSubject && matchesShift && matchesSearch;
    });
  }, [schedule, filters]);

  return (
    <main className="min-h-screen text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b border-border pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                Centro Universitário Católica do Tocantins
              </h1>
              <p className="text-lg text-foreground">Ensalamento e Horários 2026/1</p>
              {lastUpdated && (
                <p className="mt-2 inline-block rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs md:text-sm font-mono text-primary dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-200">
                  ⚡ Atualizado:{" "}
                  {new Date(lastUpdated).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            <label className="rocker rocker-small self-center">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                aria-label="Alternar tema claro/escuro"
              />
              <span className="switch-left">
                <Moon className="h-4 w-4" />
              </span>
              <span className="switch-right">
                <Sun className="h-4 w-4" />
              </span>
            </label>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-foreground">Carregando horários...</p>
          </div>
        ) : (
          <>
            <Filters schedule={schedule} filters={filters} setFilters={setFilters} theme={theme} />

            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-foreground">
                <span className="hidden sm:inline">Exibindo </span>
                <span className="font-bold text-foreground">{filteredSchedule.length}</span> aulas
                {filters.course && (
                  <span className="ml-1 text-foreground">em {filters.course}</span>
                )}
              </p>
            </div>

            {filteredSchedule.length === 0 ? (
              <div className="text-center py-20 text-foreground bg-muted rounded-xl border border-border border-dashed">
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

      <footer className="mt-12 py-6 border-t border-border text-center text-foreground text-sm">
        <p className="flex items-center justify-center gap-2 mb-2">
          Desenvolvido com 💙 por <strong className="text-foreground">Leonardo Vinicius</strong>
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://github.com/leo-nardo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-blue-500"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/leonardo-vinicius-batista-santos-396745209"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-blue-500"
          >
            <Linkedin className="w-4 h-4" />
            <span>LinkedIn</span>
          </a>
        </div>
      </footer>
    </main>
  );
}
