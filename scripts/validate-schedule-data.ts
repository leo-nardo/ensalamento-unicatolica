/**
 * Validate schedule data: compares raw Excel data against fetchSchedule() output.
 * Run: npx tsx scripts/validate-schedule-data.ts
 *
 * Downloads the spreadsheet via browser (same mechanism as production),
 * reads raw data from each sheet, calls fetchSchedule(), and cross-references
 * the first 3 valid data rows of each sheet against the parsed ClassSession objects.
 * Exits with code 1 if any divergence is found.
 */
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fetchSchedule, ClassSession } from '../lib/schedule';

// Helper to normalize text to Title Case (Portuguese) — mirrors the one in schedule.ts
function toTitleCase(str: string) {
    const lower = str.toLowerCase();
    const exceptions = ['de', 'da', 'do', 'dos', 'das', 'e', 'em', 'na', 'no', 'para', 'por'];
    return lower.split(' ').map((word, index) => {
        if (exceptions.includes(word) && index !== 0) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

// Normalize a day value like fetchSchedule does
function normalizeDay(dayRaw: string): string {
    const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    const foundDay = days.find(d => dayRaw.toLowerCase().includes(d.toLowerCase()));
    return foundDay || dayRaw;
}

interface Divergence {
    sheet: string;
    row: number;
    field: string;
    expected: string;
    found: string;
}

async function main() {
    console.log('=== Schedule Data Validation ===\n');

    // Step 1: Call fetchSchedule() to get parsed data
    console.log('Step 1: Fetching schedule via fetchSchedule()...');
    let parsedSchedule: ClassSession[];
    try {
        parsedSchedule = await fetchSchedule();
        console.log(`  ✅ fetchSchedule() returned ${parsedSchedule.length} sessions\n`);
    } catch (err) {
        console.error('  ❌ fetchSchedule() threw an error:', err);
        process.exit(1);
    }

    // Step 2: Read the downloaded spreadsheet directly
    const isProduction = process.env.NODE_ENV === 'production';
    const localFile = isProduction
        ? path.join('/tmp', 'schedule_cache.xlsx')
        : path.resolve(process.cwd(), 'schedule_cache.xlsx');

    if (!fs.existsSync(localFile)) {
        console.error(`  ❌ Schedule file not found at ${localFile} (fetchSchedule should have downloaded it)`);
        process.exit(1);
    }

    console.log(`Step 2: Reading raw spreadsheet from ${localFile}...`);
    const buffer = fs.readFileSync(localFile);
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array' });
    console.log(`  Found ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}\n`);

    // Step 3: For each sheet, extract raw data and compare with parsed sessions
    console.log('Step 3: Comparing raw data vs parsed sessions...\n');
    const divergences: Divergence[] = [];
    let totalCompared = 0;

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];

        if (!rows || rows.length < 2) {
            console.log(`  [SKIP] Sheet "${sheetName}": too few rows (${rows?.length || 0})`);
            continue;
        }

        const courseName = toTitleCase(sheetName.trim());

        // Find the sessions parsed for this course
        const courseSessions = parsedSchedule.filter(s => s.course === courseName);

        if (courseSessions.length === 0) {
            console.log(`  [WARN] Sheet "${sheetName}": No parsed sessions found for course "${courseName}"`);
            continue;
        }

        // Detect header row and column mapping (same logic as schedule.ts)
        let headerRowIndex = -1;
        let colMap: any = null;

        for (let r = 0; r < Math.min(10, rows.length); r++) {
            const rowObj = rows[r];
            if (!Array.isArray(rowObj)) continue;
            const hRow = rowObj.map((h: any) => (h || '').toString().trim().toLowerCase());

            const foundMap = {
                period: hRow.findIndex((h: string) => h.includes('período') || h.includes('periodo')),
                subject: hRow.findIndex((h: string) => h.includes('disciplina') || h.includes('matéria') || h.includes('assunto') || h.includes('estágio') || h.includes('estagio')),
                professor: hRow.findIndex((h: string) => h.includes('docente') || h.includes('professor') || h.includes('instrutor')),
                day: hRow.findIndex((h: string) => h.includes('dia') || h.includes('semana')),
                room: hRow.findIndex((h: string) => h.includes('sala') || h.includes('local')),
                block: hRow.findIndex((h: string) => h.includes('bloco')),
                time: hRow.findIndex((h: string) => h.includes('horário') || h.includes('hora')),
                classGroup: hRow.findIndex((h: string) => h.includes('turma') || h.includes('grupo')),
            };

            if (foundMap.day >= 0 && (foundMap.subject >= 0 || foundMap.professor >= 0)) {
                headerRowIndex = r;
                colMap = foundMap;
                break;
            }
        }

        // Fallback for sheets without header rows
        if (headerRowIndex === -1 || !colMap) {
            const sampleRow = rows.find(r => Array.isArray(r) && r.length >= 7 && r[0] && r[1] && r[2] && r[3]);
            if (sampleRow) {
                const numCols = sampleRow.length;
                if (numCols >= 8) {
                    colMap = { period: 0, subject: 1, professor: 2, day: 3, classGroup: 4, block: 5, time: -1, room: 7 };
                } else {
                    colMap = { period: 0, subject: 1, professor: 2, day: 3, classGroup: 4, block: 5, time: -1, room: 6 };
                }
                headerRowIndex = -1;
            } else {
                console.log(`  [SKIP] Sheet "${sheetName}": no header or valid data rows found`);
                continue;
            }
        }

        // Extract up to 3 valid data rows
        const getValue = (row: any[], idx: number) =>
            (idx >= 0 && row[idx] !== undefined && row[idx] !== null ? row[idx].toString().trim() : '');

        let samplesChecked = 0;
        let lastPeriod = "";

        for (let i = headerRowIndex + 1; i < rows.length && samplesChecked < 3; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            let rawSubject = getValue(row, colMap.subject);
            if (rawSubject.toLowerCase() === 'disciplina' || rawSubject.toLowerCase() === 'período') continue;

            let rawPeriod = getValue(row, colMap.period);
            if (rawPeriod) {
                lastPeriod = rawPeriod;
            } else if (lastPeriod) {
                rawPeriod = lastPeriod;
            }

            if (!rawSubject && colMap.subject === -1 && sheetName.includes("NPJ")) {
                rawSubject = sheetName.trim();
            }

            if (!rawSubject || rawSubject === "0" || rawSubject.toLowerCase() === "null") continue;

            const rawProfessor = getValue(row, colMap.professor) || "(Sem informação)";
            const rawDayRaw = getValue(row, colMap.day);
            const rawDay = normalizeDay(rawDayRaw);

            if (!rawDay) continue;

            let rawRoom = getValue(row, colMap.room);
            let rawBlock = getValue(row, colMap.block);
            const rawTime = getValue(row, colMap.time);
            const rawClassGroup = getValue(row, colMap.classGroup);

            if (!rawBlock) rawBlock = "-";
            if (!rawRoom) rawRoom = "(Sem sala)";

            // Find matching session in parsed data
            const match = courseSessions.find(s =>
                s.subject === rawSubject &&
                s.day === rawDay &&
                s.professor === rawProfessor
            );

            if (!match) {
                divergences.push({
                    sheet: sheetName,
                    row: i,
                    field: 'NO_MATCH',
                    expected: `subject="${rawSubject}", day="${rawDay}", professor="${rawProfessor}"`,
                    found: '(no matching ClassSession found in parsed data)',
                });
                samplesChecked++;
                totalCompared++;
                continue;
            }

            // Compare fields
            const checks: Array<{ field: string; expected: string; found: string }> = [
                { field: 'subject', expected: rawSubject, found: match.subject },
                { field: 'professor', expected: rawProfessor, found: match.professor },
                { field: 'day', expected: rawDay, found: match.day },
                { field: 'room', expected: rawRoom, found: match.room },
                { field: 'block', expected: rawBlock, found: match.block },
                { field: 'period', expected: rawPeriod, found: match.period },
                { field: 'classGroup', expected: rawClassGroup, found: match.classGroup },
                { field: 'time', expected: rawTime, found: match.time },
            ];

            for (const check of checks) {
                if (check.expected !== check.found) {
                    divergences.push({
                        sheet: sheetName,
                        row: i,
                        field: check.field,
                        expected: check.expected,
                        found: check.found,
                    });
                }
            }

            samplesChecked++;
            totalCompared++;
        }

        console.log(`  [OK] Sheet "${sheetName}": ${samplesChecked} sample rows compared, ${courseSessions.length} total sessions`);
    }

    // Summary
    console.log(`\n========================================`);
    console.log(`Total samples compared: ${totalCompared}`);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);
    console.log(`Total parsed sessions: ${parsedSchedule.length}`);

    if (divergences.length > 0) {
        console.log(`\n❌ VALIDATION FAILED: ${divergences.length} divergence(s) found:\n`);
        for (const d of divergences) {
            console.log(`  Sheet: "${d.sheet}", Row: ${d.row}, Field: ${d.field}`);
            console.log(`    Expected: ${d.expected}`);
            console.log(`    Found:    ${d.found}`);
            console.log();
        }
        process.exit(1);
    } else {
        console.log(`\n✅ VALIDATION PASSED: All ${totalCompared} sampled rows match between raw data and fetchSchedule() output.`);
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
