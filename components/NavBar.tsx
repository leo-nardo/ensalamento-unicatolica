"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Início", href: "/" },
    { label: "Montar Horário", href: "/meu-horario" },
    { label: "Calendário", href: "/calendario" },
];

export function NavBar() {
    const pathname = usePathname();

    // Determine which nav item is active
    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-[var(--uc-border)] bg-[rgba(10,9,24,0.92)] backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/unicatolica_footer_dark.svg" alt="UniCatólica" className="h-9 w-auto" />
                        <p className="hidden sm:block text-[var(--uc-text-low)] text-xs leading-tight">Horários & Ensalamento</p>
                    </Link>

                    {/* Navigation tabs */}
                    <div className="flex items-center gap-1">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive(item.href)
                                        ? "bg-[var(--uc-purple)]/15 text-[var(--uc-purple)] shadow-sm"
                                        : "text-[var(--uc-text-mid)] hover:text-[var(--uc-text-hi)] hover:bg-white/5"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
