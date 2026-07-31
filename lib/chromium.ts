
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function getBrowser() {
    let browser;

    if (process.env.NODE_ENV === 'production') {
        const chromium = require('@sparticuz/chromium');
        // Vercel / Production
        console.log('--- Vercel Chromium Setup ---');
        console.log(`@sparticuz/chromium path: ${await chromium.executablePath()}`);

        chromium.setGraphicsMode = false;

        browser = await puppeteer.launch({
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: { width: 1920, height: 1080 },
            executablePath: await chromium.executablePath(),
            headless: true, // Hardcode to true to avoid type issues
        });
    } else {
        // Local Development
        console.log('Launching Local Chrome...');
        try {
            const { executablePath } = require('puppeteer');
            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
                defaultViewport: { width: 1920, height: 1080 },
                headless: true,
                executablePath: executablePath(),
            });
        } catch (e) {
            console.warn("Could not load local puppeteer executable. Trying default lookup...");
            browser = await puppeteer.launch({
                channel: 'chrome',
                headless: true,
                args: ['--disable-web-security'],
            });
        }
    }

    return browser;
}
