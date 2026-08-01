"use client";

import { useEffect, useState } from "react";
import { Github, Linkedin, X } from "lucide-react";
import { LOCAL_STORAGE_KEYS } from "@/constants/localStorage";
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/localStorage";

export function CreditBadge() {
    const [visible, setVisible] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        const dismissed = getLocalStorageItem<boolean>(LOCAL_STORAGE_KEYS.CREDIT_BADGE_DISMISSED);
        if (dismissed) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration read from localStorage, unavoidable to prevent SSR/client mismatch
            setVisible(false);
        }
        setHydrated(true);
    }, []);

    function dismiss() {
        setVisible(false);
        setLocalStorageItem(LOCAL_STORAGE_KEYS.CREDIT_BADGE_DISMISSED, true);
    }

    if (!hydrated || !visible) return null;

    return (
        <div className="fixed bottom-3 left-3 z-40 flex items-center gap-2 bg-[var(--uc-surface)]/90 backdrop-blur border border-[var(--uc-border)] rounded-full pl-3 pr-1.5 py-1.5 text-xs text-[var(--uc-text-low)] shadow-lg">
            <span>
                Desenvolvido com 💜 por <strong className="text-[var(--uc-text-mid)] font-semibold">Leonardo Vinicius</strong>
            </span>
            <a
                href="https://github.com/leo-nardo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="hover:text-[var(--uc-purple)] transition-colors"
            >
                <Github className="w-3.5 h-3.5" />
            </a>
            <a
                href="https://www.linkedin.com/in/leonardo-vinicius-batista-santos-396745209"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-[var(--uc-purple)] transition-colors"
            >
                <Linkedin className="w-3.5 h-3.5" />
            </a>
            <button
                onClick={dismiss}
                aria-label="Ocultar"
                className="hover:text-[var(--uc-text-hi)] hover:bg-white/10 rounded-full p-1 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
