'use strict';

const path = require('path');
const fs = require('fs');

async function main() {
  // Lazy load puppeteer to ensure dependency is present
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.error('Puppeteer is not installed. Run: npm i -D puppeteer');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const docsDir = path.join(projectRoot, 'docs');
  const htmlPath = path.join(docsDir, 'EQUIPMENT_GUIDE.html');
  const outPath = path.join(docsDir, 'EQUIPMENT_GUIDE.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('Guide HTML not found at', htmlPath);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'load' });
    await page.emulateMediaType('screen');
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '16mm', bottom: '20mm', left: '16mm' },
    });
    console.log('PDF generated at', outPath);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


