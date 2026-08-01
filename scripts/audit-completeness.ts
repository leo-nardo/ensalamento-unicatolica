/**
 * Full completeness audit: for EVERY row of EVERY sheet in the cached spreadsheet,
 * decide independently (mirroring lib/schedule.ts's logic) whether it should have
 * produced a class session, and compare that against what fetchSchedule() actually
 * returned. Prints every row that was dropped and why, plus per-sheet totals.
 *
 * Run: npx tsx scripts/audit-completeness.ts
 */
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fetchSchedule } from '../lib/schedule';

const CACHE_FILE = path.resolve(process.cwd(), 'schedule_cache.xlsx');

type ColMap = {
    period: number; subject: number; professor: number; day: number;
    room: number; block: number; time: number; classGroup: number;
};

function toTitleCase(str: string) {
    const lower = str.toLowerCase();
    const exceptions = ['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'na', 'no', 'para', 'por'];
    return lower.split(' ').map((word, index) => {
        if (exceptions.includes(word) && index !== 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

async function main() {
    console.log('=== Auditoria de completude — TODAS as linhas de TODAS as abas ===\n');

    if (!fs.existsSync(CACHE_FILE)) {
        console.error(`Cache não encontrado em ${CACHE_FILE}. Rode o app uma vez (npm run dev, abra /) para popular o cache.`);
        process.exit(1);
    }

    const buffer = fs.readFileSync(CACHE_FILE);
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });

    console.log(`Planilha tem ${workbook.SheetNames.length} abas: ${workbook.SheetNames.join(', ')}\n`);

    let totalCandidates = 0;
    let totalDroppedNoDay = 0;
    let totalDroppedNoHeader = 0;
    let totalSuspiciousEmptySubject = 0;
    const droppedDetails: { sheet: string; row: number; reason: string; raw: string }[] = [];
    const suspiciousDetails: { sheet: string; row: number; reason: string; raw: string }[] = [];
    const perSheetCandidateCount: Record<string, number> = {};

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as string[][];

        if (!rows || rows.length < 1) {
            console.log(`[${sheetName}] VAZIA — 0 linhas`);
            return;
        }

        // Replicate header detection from lib/schedule.ts
        let headerRowIndex = -1;
        let colMap: ColMap | null = null;

        for (let r = 0; r < Math.min(10, rows.length); r++) {
            const rowObj = rows[r];
            if (!Array.isArray(rowObj)) continue;
            const hRow = rowObj.map(h => (h || '').toString().trim().toLowerCase());
            const foundMap = {
                period: hRow.findIndex(h => h.includes('período') || h.includes('periodo')),
                subject: hRow.findIndex(h => h.includes('disciplina') || h.includes('matéria') || h.includes('assunto') || h.includes('estágio') || h.includes('estagio')),
                professor: hRow.findIndex(h => h.includes('docente') || h.includes('professor') || h.includes('instrutor')),
                day: hRow.findIndex(h => h.includes('dia') || h.includes('semana')),
                room: hRow.findIndex(h => h.includes('sala') || h.includes('local')),
                block: hRow.findIndex(h => h.includes('bloco')),
                time: hRow.findIndex(h => h.includes('horário') || h.includes('hora')),
                classGroup: hRow.findIndex(h => h.includes('turma') || h.includes('grupo')),
            };
            if (foundMap.day >= 0 && (foundMap.subject >= 0 || foundMap.professor >= 0)) {
                headerRowIndex = r;
                colMap = foundMap;
                break;
            }
        }

        // Fallback: positional mapping for sheets without a header (mirrors schedule.ts)
        let usedFallback = false;
        if (headerRowIndex === -1 || !colMap) {
            const sampleRow = rows.find(r => Array.isArray(r) && r.length >= 7 && r[0] && r[1] && r[2] && r[3]);
            if (sampleRow) {
                const numCols = sampleRow.length;
                colMap = numCols >= 8
                    ? { period: 0, subject: 1, professor: 2, day: 3, classGroup: 4, block: 5, time: -1, room: 7 }
                    : { period: 0, subject: 1, professor: 2, day: 3, classGroup: 4, block: 5, time: -1, room: 6 };
                headerRowIndex = -1;
                usedFallback = true;
            } else {
                console.log(`[${sheetName}] SEM CABEÇALHO RECONHECÍVEL E SEM FALLBACK POSSÍVEL — aba inteira pode estar sendo perdida!`);
                totalDroppedNoHeader++;
                droppedDetails.push({ sheet: sheetName, row: -1, reason: 'aba sem header nem fallback', raw: JSON.stringify(rows.slice(0, 3)) });
                return;
            }
        }

        let candidateCount = 0;
        let lastPeriod = '';

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const getValue = (idx: number) => (idx >= 0 && row[idx] !== undefined && row[idx] !== null ? row[idx].toString().trim() : '');

            let subject = getValue(colMap.subject);
            if (subject.toLowerCase() === 'disciplina' || subject.toLowerCase() === 'período') continue;

            let period = getValue(colMap.period);
            if (period) lastPeriod = period; else period = lastPeriod;

            if (!subject && colMap.subject === -1 && sheetName.includes('NPJ')) subject = sheetName.trim();

            if (!subject || subject === '0' || subject.toLowerCase() === 'null') {
                // Suspicious: row has no usable subject, but other fields ARE filled —
                // could be a real class lost to a merged-cell quirk or typo, flag it.
                const professor = getValue(colMap.professor);
                const day = getValue(colMap.day);
                const room = getValue(colMap.room);
                if (professor || day || room) {
                    totalSuspiciousEmptySubject++;
                    suspiciousDetails.push({
                        sheet: sheetName,
                        row: i,
                        reason: `disciplina vazia/inválida ("${subject}") mas professor="${professor}" dia="${day}" sala="${room}"`,
                        raw: JSON.stringify(row),
                    });
                }
                continue;
            }

            // This row has a real subject — it's a "candidate" that SHOULD become a session,
            // unless the day genuinely can't be determined.
            candidateCount++;
            totalCandidates++;

            // schedule.ts only drops a row if `day` ends up EMPTY. It does NOT require
            // the value to match one of the 7 weekday names — non-weekday values like
            // "orientação"/"online" are kept as-is (real convention for TCC/Estágio rows).
            const dayRaw = getValue(colMap.day);

            if (!dayRaw) {
                totalDroppedNoDay++;
                droppedDetails.push({
                    sheet: sheetName,
                    row: i,
                    reason: `coluna "dia" vazia`,
                    raw: JSON.stringify(row),
                });
            }
        }

        perSheetCandidateCount[sheetName] = candidateCount;
        console.log(`[${sheetName}] header=${usedFallback ? 'fallback posicional' : `linha ${headerRowIndex}`} | candidatos com disciplina válida: ${candidateCount}`);
    });

    console.log(`\n=== Total de candidatos (linhas com disciplina válida): ${totalCandidates} ===`);
    console.log(`=== Descartados por coluna "dia" vazia: ${totalDroppedNoDay} ===`);
    console.log(`=== Abas sem header nem fallback (inteiramente perdidas): ${totalDroppedNoHeader} ===\n`);

    if (droppedDetails.length > 0) {
        console.log('--- DETALHE DAS LINHAS DESCARTADAS (dia vazio) ---');
        droppedDetails.forEach(d => {
            console.log(`  [${d.sheet}] linha ${d.row}: ${d.reason}`);
            console.log(`    raw: ${d.raw}`);
        });
        console.log('');
    }

    console.log(`=== Linhas SUSPEITAS (disciplina vazia mas outros campos preenchidos): ${totalSuspiciousEmptySubject} ===`);
    if (suspiciousDetails.length > 0) {
        suspiciousDetails.forEach(d => {
            console.log(`  [${d.sheet}] linha ${d.row}: ${d.reason}`);
            console.log(`    raw: ${d.raw}`);
        });
        console.log('');
    }

    // Cross-check against what fetchSchedule() actually returns
    console.log('Rodando fetchSchedule() para comparar com os candidatos calculados...\n');
    const parsed = await fetchSchedule();
    console.log(`fetchSchedule() retornou ${parsed.length} sessões no total.\n`);

    const parsedPerCourse: Record<string, number> = {};
    parsed.forEach(s => {
        parsedPerCourse[s.course] = (parsedPerCourse[s.course] || 0) + 1;
    });

    console.log('--- COMPARAÇÃO POR ABA (candidatos calculados vs sessões parseadas) ---');
    let mismatchFound = false;
    Object.entries(perSheetCandidateCount).forEach(([sheetName, candidateCount]) => {
        const courseName = toTitleCase(sheetName.trim());
        const parsedCount = parsedPerCourse[courseName] || 0;
        const droppedForThisSheet = droppedDetails.filter(d => d.sheet === sheetName).length;
        const expectedAfterDayDrop = candidateCount - droppedForThisSheet;
        const status = parsedCount === expectedAfterDayDrop ? 'OK' : '❌ DIVERGÊNCIA';
        if (status !== 'OK') mismatchFound = true;
        console.log(`  ${status} [${sheetName}] candidatos=${candidateCount} (esperado após drops=${expectedAfterDayDrop}) | fetchSchedule()=${parsedCount}`);
    });

    console.log('\n=== RESULTADO FINAL ===');
    if (mismatchFound || totalDroppedNoHeader > 0) {
        console.log('❌ FALHOU — existem divergências ou abas inteiramente perdidas. Veja o detalhe acima.');
        process.exit(1);
    } else if (totalSuspiciousEmptySubject > 0) {
        console.log(`⚠️  Contagens batem, mas há ${totalSuspiciousEmptySubject} linha(s) suspeitas (sem disciplina, mas com outros campos preenchidos) — revise manualmente acima, podem ser aulas reais perdidas.`);
        process.exit(1);
    } else if (totalDroppedNoDay > 0) {
        console.log(`⚠️  Passou, mas ${totalDroppedNoDay} linha(s) foram legitimamente descartadas por terem a coluna "dia" vazia (revise o detalhe acima).`);
        process.exit(0);
    } else {
        console.log('✅ TUDO CONSISTENTE — toda linha com disciplina válida em toda aba virou uma sessão parseada corretamente.');
        process.exit(0);
    }
}

main();
