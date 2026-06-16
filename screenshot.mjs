import puppeteer from 'puppeteer-core';
import { exec } from 'child_process';
import fs from 'fs';

(async () => {
  console.log('Starting dev server...');
  const server = exec('bun run dev --port 5176');
  
  // Wait 4 seconds for vite to start
  await new Promise(r => setTimeout(r, 4000));

  console.log('Launching puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new"
  });
  const page = await browser.newPage();
  
  // We want a square output of 2730x2730. 
  // Mobile CSS proportions look good at 390 width. 390 * 7 = 2730.
  await page.setViewport({ width: 390, height: 390, deviceScaleFactor: 7 });
  
  console.log('Navigating to http://localhost:5176');
  await page.goto('http://localhost:5176', { waitUntil: 'networkidle0' });
  
  // Hide the loading spinner (we don't want a static spinner in the native splash)
  await page.evaluate(() => {
    const s = document.querySelector('.animate-spin');
    if (s) s.style.display = 'none';
    const text = document.querySelector('.tracking-widest');
    if (text && text.textContent.includes('CARREGANDO')) text.style.display = 'none';
  });

  // Give React 1 second to render animations (if any) to their starting state
  await new Promise(r => setTimeout(r, 1000));

  console.log('Taking screenshot...');
  await page.screenshot({ path: 'assets/splash.png' });
  
  await browser.close();
  server.kill();
  console.log('Done!');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
