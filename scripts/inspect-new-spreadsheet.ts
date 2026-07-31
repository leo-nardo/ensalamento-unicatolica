/**
 * Inspect the new semester spreadsheet downloaded via Puppeteer.
 * Run: npx tsx scripts/inspect-new-spreadsheet.ts
 */
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';

const NEW_URL = 'https://ubecedu-my.sharepoint.com/:x:/g/personal/raimara_rodrigues_catolica-to_edu_br/IQBLNfGL0WE2RbJkwjy8EcguAR9C6kMxn4aK_UiXL3kKB3k?download=1';
const OUTPUT_PATH = path.resolve(process.cwd(), 'new_schedule_inspect.xlsx');

async function launchBrowser() {
    // Local development — try puppeteer's bundled chrome first, then channel lookup
    try {
        const { executablePath } = require('puppeteer');
        return await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
            defaultViewport: { width: 1920, height: 1080 },
            headless: true,
            executablePath: executablePath(),
        });
    } catch {
        console.warn("Could not load local puppeteer executable. Trying default lookup...");
        return await puppeteer.launch({
            channel: 'chrome',
            headless: true,
            args: ['--disable-web-security'],
        });
    }
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
    console.log(`[Inspect] Downloading spreadsheet via Puppeteer to ${outputPath}...`);
    let browser = null;
    try {
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setCacheEnabled(false);
        await page.goto('about:blank');

        console.log(`Executing fetch inside page context for: ${url}`);

        const base64Data = await page.evaluate(async (targetUrl: string) => {
            const response = await fetch(targetUrl);
            if (!response.ok) {
                throw new Error(`Fetch failed with status: ${response.status}`);
            }
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }, url);

        console.log('Fetch successful. Processing data...');

        const base64Content = base64Data.split(',')[1];
        if (!base64Content) {
            throw new Error('Invalid base64 data received.');
        }

        const buffer = Buffer.from(base64Content, 'base64');

        // Verify ZIP/XLSX signature (PK = 0x50 0x4B)
        if (buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
            console.error(`ERROR: File does not have ZIP/XLSX signature (PK). First 4 bytes: ${buffer.slice(0, 4).toString('hex')}`);
            fs.writeFileSync(outputPath, buffer);
            console.error(`File saved to ${outputPath} for manual inspection (${buffer.length} bytes)`);
            // Also print first 500 chars as text for debugging
            console.error(`First 500 chars as text: ${buffer.slice(0, 500).toString('utf-8')}`);
            process.exit(1);
        }

        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Valid XLSX downloaded. Saved ${buffer.length} bytes to ${outputPath}`);

    } catch (error) {
        console.error('Download error:', error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
}

async function inspectSpreadsheet(filePath: string) {
    const buffer = fs.readFileSync(filePath);
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array' });

    console.log(`\n========================================`);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);
    console.log(`Sheet names: ${JSON.stringify(workbook.SheetNames)}`);
    console.log(`========================================\n`);

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];

        console.log(`\n--- Sheet: "${sheetName}" (${rows.length} rows total) ---`);
        const previewRows = Math.min(10, rows.length);
        for (let r = 0; r < previewRows; r++) {
            console.log(`  Row ${r}: ${JSON.stringify(rows[r])}`);
        }
    }
}

async function main() {
    await downloadFile(NEW_URL, OUTPUT_PATH);
    await inspectSpreadsheet(OUTPUT_PATH);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
