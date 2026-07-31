import { Github, Linkedin, ExternalLink } from "lucide-react";
import { SPREADSHEET_VIEW_URL } from "@/constants/urls";

export function Footer() {
    return (
        <footer className="mt-12 border-t border-[var(--uc-border)]">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col items-center gap-6">
                <a
                    href={SPREADSHEET_VIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[var(--uc-surface)] hover:bg-[var(--uc-surface2)] border border-[var(--uc-border)] hover:border-[var(--uc-border-strong)] text-[var(--uc-text-mid)] hover:text-[var(--uc-text-hi)] text-sm font-medium px-4 py-2 rounded-full transition-all duration-200"
                >
                    <ExternalLink className="w-4 h-4" /> Ver planilha original da coordenação
                </a>

                <div className="flex flex-col items-center gap-3 bg-[var(--uc-surface)] border border-[var(--uc-border-strong)] rounded-2xl px-6 py-5 shadow-lg shadow-[var(--uc-purple)]/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--uc-purple)] flex items-center justify-center text-white font-extrabold text-sm shrink-0">
                            LV
                        </div>
                        <div className="text-left">
                            <p className="text-[var(--uc-text-low)] text-xs leading-tight">Desenvolvido por</p>
                            <p className="text-[var(--uc-text-hi)] font-bold text-base leading-tight">Leonardo Vinicius</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href="https://github.com/leo-nardo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[var(--uc-surface2)] hover:bg-[var(--uc-purple)]/20 text-[var(--uc-text-mid)] hover:text-[var(--uc-purple)] text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                        >
                            <Github className="w-3.5 h-3.5" /> GitHub
                        </a>
                        <a
                            href="https://www.linkedin.com/in/leonardo-vinicius-batista-santos-396745209"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-[var(--uc-surface2)] hover:bg-[var(--uc-purple)]/20 text-[var(--uc-text-mid)] hover:text-[var(--uc-purple)] text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                        >
                            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
