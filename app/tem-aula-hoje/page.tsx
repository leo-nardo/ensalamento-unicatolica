"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, PartyPopper, Frown } from "lucide-react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { CreditBadge } from "@/components/CreditBadge";
import { checkIsClassDay, type ClassDayCheck } from "@/lib/academicCalendar";

const MONTH_NAMES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const WEEKDAY_NAMES = [
    "domingo", "segunda-feira", "terça-feira", "quarta-feira",
    "quinta-feira", "sexta-feira", "sábado",
];

const CONFETTI_COLORS = [
    "var(--uc-purple)", "var(--uc-green)", "var(--uc-blue)",
    "var(--uc-cyan)", "var(--uc-amber)", "var(--uc-rose)",
];

function formatToday(date: Date) {
    return `${WEEKDAY_NAMES[date.getDay()]}, ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`;
}

type Status = "idle" | "loading" | "revealed";

const LOADING_MESSAGES = [
    "Consultando o calendário acadêmico...",
    "Verificando se é feriado...",
    "Perguntando pra coordenação...",
];

function Confetti() {
    const pieces = useMemo(
        () =>
            Array.from({ length: 70 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.6,
                duration: 2.4 + Math.random() * 1.6,
                color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                rotate: Math.random() * 360,
                width: 6 + Math.random() * 6,
            })),
        []
    );

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {pieces.map((p) => (
                <span
                    key={p.id}
                    className="absolute top-0 rounded-sm"
                    style={{
                        left: `${p.left}%`,
                        width: p.width,
                        height: p.width * 0.4,
                        backgroundColor: p.color,
                        transform: `rotate(${p.rotate}deg)`,
                        animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
                    }}
                />
            ))}
        </div>
    );
}

export default function TemAulaHojePage() {
    const [status, setStatus] = useState<Status>("idle");
    const [result, setResult] = useState<ClassDayCheck | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (status !== "loading") return;

        let step = 0;
        const messageInterval = setInterval(() => {
            step += 1;
            setLoadingMessage(LOADING_MESSAGES[step % LOADING_MESSAGES.length]);
        }, 550);

        const revealTimeout = setTimeout(() => {
            const check = checkIsClassDay(new Date());
            setResult(check);
            setStatus("revealed");
            if (check.hasClass) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 4000);
            }
        }, 1600);

        return () => {
            clearInterval(messageInterval);
            clearTimeout(revealTimeout);
        };
    }, [status]);

    function handleCheck() {
        setLoadingMessage(LOADING_MESSAGES[0]);
        setStatus("loading");
    }

    function handleReset() {
        setStatus("idle");
        setResult(null);
        setShowConfetti(false);
    }

    return (
        <>
            <NavBar />
            {showConfetti && <Confetti />}
            <main className="min-h-[calc(100dvh-4rem)] overflow-hidden bg-[var(--uc-bg)] text-[var(--uc-text-hi)] p-4 md:p-8 font-sans flex items-center justify-center">
                <div className="max-w-lg w-full text-center py-12">
                    {status !== "revealed" ? (
                        <>
                            <p className="text-[var(--uc-text-low)] mb-3 first-letter:uppercase">{formatToday(new Date())}</p>
                            <h1 className="text-2xl md:text-3xl font-extrabold mb-10 leading-snug">
                                Tem aula normal hoje?
                            </h1>
                            <button
                                onClick={handleCheck}
                                disabled={status === "loading"}
                                className="inline-flex flex-col items-center justify-center gap-3 min-w-[22rem] md:min-w-[30rem] px-12 py-10 md:px-16 md:py-12 rounded-full bg-[var(--uc-purple)] hover:bg-[var(--uc-purple-deep)] text-white text-3xl md:text-4xl font-extrabold shadow-[0_0_60px_-10px_var(--uc-purple)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-wait"
                            >
                                {status === "loading" ? (
                                    <>
                                        <Loader2 className="w-10 h-10 animate-spin" />
                                        <span className="text-base md:text-lg font-medium text-center leading-snug">
                                            {loadingMessage}
                                        </span>
                                    </>
                                ) : (
                                    "Descobrir"
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            {result?.hasClass ? (
                                <>
                                    <PartyPopper className="w-16 h-16 mx-auto mb-4 text-[var(--uc-green)]" />
                                    <h2 className="text-5xl md:text-6xl font-extrabold text-[var(--uc-green)] mb-4">
                                        SIM
                                    </h2>
                                    <p className="text-[var(--uc-text-mid)] text-lg mb-10">
                                        Hoje é dia de aula normal. Bora pra sala.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Frown className="w-16 h-16 mx-auto mb-4 text-[var(--uc-rose)]" />
                                    <h2 className="text-5xl md:text-6xl font-extrabold text-[var(--uc-rose)] mb-4">
                                        NÃO
                                    </h2>
                                    <p className="text-[var(--uc-text-mid)] text-lg mb-2">
                                        {result?.reason === "weekend"
                                            ? "Hoje é fim de semana. Descansa."
                                            : `Hoje é feriado: ${result?.holiday?.label ?? ""}`}
                                    </p>
                                    <p className="text-[var(--uc-text-low)] text-sm mb-10">
                                        (calma, só entra aqui feriado de verdade e fim de semana — o resto é aula sim)
                                    </p>
                                </>
                            )}

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link
                                    href="/calendario"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--uc-border)] bg-[var(--uc-surface)] hover:border-[var(--uc-border-strong)] text-[var(--uc-text-hi)] font-medium transition-all duration-200"
                                >
                                    <CalendarDays className="w-4 h-4" />
                                    Conferir calendário acadêmico
                                </Link>
                                <button
                                    onClick={handleReset}
                                    className="px-5 py-2.5 rounded-lg text-[var(--uc-text-low)] hover:text-[var(--uc-text-hi)] hover:bg-white/5 font-medium transition-all duration-200"
                                >
                                    Perguntar de novo
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
            <CreditBadge />
        </>
    );
}
