import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

(async () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
      body {
        margin: 0;
        width: 2732px;
        height: 2732px;
        background-color: hsl(142, 40%, 25%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        transform: scale(2.8); /* Escala perfeita para telas Retina/Mobile */
      }
      h1 {
        color: white;
        font-size: 36px;
        margin-top: 0;
        margin-bottom: 24px;
        font-weight: bold;
      }
      .logo {
        width: 160px;
        height: 160px;
        border-radius: 24px;
        box-shadow: 0 0 40px rgba(255,255,255,0.1);
        margin-bottom: 32px;
        object-fit: cover;
      }
      p {
        color: rgba(255,255,255,0.9);
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
        max-width: 280px;
        text-align: center;
        font-weight: 500;
        line-height: 1.5;
        margin: 0;
      }
      .circle {
        position: absolute;
        width: 340px;
        height: 340px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="circle"></div>
        <h1>Larguei Mão</h1>
        <img src="file:///Users/gui/larguei mao/public/logo_cuia.png" class="logo" />
        <p>O que não serve mais pra ti<br>pode servir pra alguém.</p>
      </div>
    </body>
    </html>
  `;
  
  const htmlPath = path.resolve('temp_splash.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new"
  });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 2732, height: 2732, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'assets/splash.png' });
  
  await browser.close();
  fs.unlinkSync(htmlPath);
  console.log('Splash Screen estático perfeitamente gerado!');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
