
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { getBrowser } from './chromium';

// Determine Environment
const isProduction = process.env.NODE_ENV === 'production';

// Use /tmp for Vercel, or local path for dev
const LOCAL_FILE = isProduction
    ? path.join('/tmp', 'schedule_cache.xlsx')
    : path.resolve(process.cwd(), 'schedule_cache.xlsx');

export interface ClassSession {
    id: string;
    course: string;
    period: string;
    subject: string;
    professor: string;
    day: string;
    room: string;
    time: string;
    classGroup: string;
    block: string;
    campus: string;
    shift: string;
    frequency: string;
}

const SPREADSHEET_URL = 'https://ubecedu-my.sharepoint.com/:x:/g/personal/raimara_rodrigues_catolica-to_edu_br/IQBLNfGL0WE2RbJkwjy8EcguAR9C6kMxn4aK_UiXL3kKB3k?download=1';

async function downloadFile(url: string, outputPath: string): Promise<void> {
    console.log(`[Method: Fetch-in-Page] Downloading spreadsheet to ${outputPath}...`);
    let browser = null;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        // Disable cache to ensure freshness
        await page.setCacheEnabled(false);

        console.log(`Navigating to about:blank to start context...`);
        // We go to a neutral page or the domain? 
        // Since we disabled web security in chromium.ts logic, about:blank should allow fetch to anywhere.
        await page.goto('about:blank');

        console.log(`Executing fetch inside page context for: ${url}`);

        // Fetch the file as a binary blob, convert to base64, and return
        // This leverages the browser's networking stack (and any cookies if we needed them, though this is a guest link)
        const base64Data = await page.evaluate(async (targetUrl) => {
            const response = await fetch(targetUrl);
            if (!response.ok) {
                throw new Error(`Fetch failed with status: ${response.status}`);
            }
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    // result looks like "data:application/vnd....;base64,....."
                    resolve(result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }, url);

        console.log('Fetch successful. Processing data...');

        // Remove the data URL prefix (e.g., "data:application/octet-stream;base64,")
        const base64Content = base64Data.split(',')[1];
        if (!base64Content) {
            throw new Error('Invalid base64 data received.');
        }

        const buffer = Buffer.from(base64Content, 'base64');

        // Write to file
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved ${buffer.length} bytes to ${outputPath}`);

    } catch (error) {
        console.error('Puppeteer/Fetch error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

// Helper to normalize text to Title Case (Portuguese)
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

export async function fetchSchedule(): Promise<ClassSession[]> {
    try {
        await downloadFile(SPREADSHEET_URL, LOCAL_FILE);

        if (!fs.existsSync(LOCAL_FILE)) {
            console.error(`Schedule file not found at ${LOCAL_FILE}`);
            return [];
        }

        const buffer = fs.readFileSync(LOCAL_FILE);
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const schedule: ClassSession[] = [];
        let idCounter = 0;

        console.log(`Workbook loaded with ${workbook.SheetNames.length} sheets.`);

        workbook.SheetNames.forEach(sheetName => {
            try {
                const sheet = workbook.Sheets[sheetName];
                // Use raw: false to get formatted strings (preserves 1.10 as "1.10" instead of 1.1)
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];

                if (!rows || rows.length < 2) return;

                const upperName = sheetName.toUpperCase();
                const isCampusII = ["MEDICINA VETERINÁRIA", "ZOOTECNIA", "AGRONOMIA"].some(c => upperName.includes(c));
                const campus = isCampusII ? "Campus II" : "Campus I";

                let courseShift = "Noite";
                if (upperName.includes("DIREITO MATUTINO") || upperName.includes("MATUTINO")) {
                    courseShift = "Manhã";
                } else if (upperName.includes("VESPERTINO")) {
                    courseShift = "Tarde";
                } else if (upperName.includes("INTEGRAL")) {
                    courseShift = "Integral";
                }

                let headerRowIndex = -1;
                let colMap: any = null;

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

                // Fallback for sheets without a header row (e.g., FARMÁCIA in 2026/2):
                // If no header was found in the first 10 rows, attempt a positional mapping
                // based on the standard 8-column layout: Período, Disciplina, Docente, Dia, Turma, Bloco, Andar, Sala
                // or 7-column layout: Período, Disciplina, Docente, Dia, Turma, Bloco, Sala
                if (headerRowIndex === -1 || !colMap) {
                    // Check if the first data rows look like valid schedule data
                    // (i.e., they have enough columns and the first column looks like a period marker)
                    const sampleRow = rows.find(r => Array.isArray(r) && r.length >= 7 && r[0] && r[1] && r[2] && r[3]);
                    if (sampleRow) {
                        const numCols = sampleRow.length;
                        if (numCols >= 8) {
                            // 8-column layout: Período(0), Disciplina(1), Docente(2), Dia(3), Turma(4), Bloco(5), Andar(6), Sala(7)
                            colMap = { period: 0, subject: 1, professor: 2, day: 3, classGroup: 4, block: 5, time: -1, room: 7 };
                        } else {
                            // 7-column layout: Período(0), Disciplina(1), Docente(2), Dia(3), Turma(4), Bloco(5), Sala(6)
                            colMap = { period: 0, subject: 1, professor: 2, day: 3, classGroup: 4, block: 5, time: -1, room: 6 };
                        }
                        // Find the first actual data row (skip period section headers like "2° Período - Matriz 2025")
                        headerRowIndex = -1; // will start from row 0, processing all rows as data
                        console.log(`[Fallback] Sheet "${sheetName}" has no header row. Using positional mapping (${numCols} cols).`);
                    } else {
                        return;
                    }
                }

                let lastPeriod = "";

                for (let i = headerRowIndex + 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;

                    const getValue = (idx: number) => (idx >= 0 && row[idx] !== undefined && row[idx] !== null ? row[idx].toString().trim() : '');

                    // Normalize course name (Title Case)
                    const course = toTitleCase(sheetName.trim());

                    let period = getValue(colMap.period);
                    let subject = getValue(colMap.subject);

                    if (subject.toLowerCase() === 'disciplina' || subject.toLowerCase() === 'período') continue;

                    if (period) {
                        lastPeriod = period;
                    } else if (lastPeriod) {
                        period = lastPeriod;
                    }

                    if (!subject && colMap.subject === -1 && sheetName.includes("NPJ")) {
                        subject = sheetName.trim();
                    }

                    if (!subject || subject === "0" || subject.toLowerCase() === "null") continue;

                    const professor = getValue(colMap.professor) || "(Sem informação)";

                    let dayRaw = getValue(colMap.day);
                    let day = dayRaw;
                    let shift = courseShift;
                    let frequency = "";

                    if (dayRaw.toLowerCase().includes("quinzenal")) {
                        frequency = "Quinzenal";
                        if (dayRaw.includes("01")) frequency += " (1ª Sem.)";
                        if (dayRaw.includes("02")) frequency += " (2ª Sem.)";
                    }

                    const lowerDay = dayRaw.toLowerCase();
                    if (courseShift === "Integral" || lowerDay.includes("manhã") || lowerDay.includes("tarde") || lowerDay.includes("noite")) {
                        if (lowerDay.includes("manhã") || lowerDay.includes("matutino")) {
                            shift = "Manhã";
                        } else if (lowerDay.includes("tarde") || lowerDay.includes("vespertino")) {
                            shift = "Tarde";
                        } else if (lowerDay.includes("noite") || lowerDay.includes("noturno")) {
                            shift = "Noite";
                        }
                    }

                    if (lowerDay.includes("sábado") || lowerDay.includes("sabado")) {
                        if (!lowerDay.includes("manhã") && !lowerDay.includes("tarde") && !lowerDay.includes("noite")) {
                            shift = "Manhã";
                        }
                    }

                    const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
                    const foundDay = days.find(d => dayRaw.toLowerCase().includes(d.toLowerCase()));
                    if (foundDay) day = foundDay;

                    let block = getValue(colMap.block);
                    let room = getValue(colMap.room);

                    if (!block) block = "-";
                    if (!room) room = "(Sem sala)";

                    const time = getValue(colMap.time);
                    const classGroup = getValue(colMap.classGroup);

                    if (!day) continue;

                    idCounter++;
                    schedule.push({
                        id: `${idCounter}-${course}-${subject}-${day}`.replace(/[^a-z0-9]+/gi, '-').toLowerCase(),
                        course,
                        period,
                        subject,
                        professor,
                        day,
                        room,
                        time,
                        classGroup,
                        block,
                        campus,
                        shift,
                        frequency
                    });
                }
            } catch (err) {
                console.error(`Error parsing sheet "${sheetName}":`, err);
            }
        });

        // Validation: If we parsed all sheets and got 0 classes, something is wrong with the credentials or the layout.
        if (schedule.length === 0) {
            throw new Error("No classes parsed from the spreadsheet. The file layout might have changed or the file is empty.");
        }

        return schedule;

    } catch (error) {
        console.error('Error fetching schedule:', error);
        // Rethrow the error so the API route knows it failed, instead of returning strict empty array
        throw error;
    }
}
