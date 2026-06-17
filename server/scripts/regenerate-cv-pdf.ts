/**
 * Regenerate Don Santos CV PDF from updated markdown
 * Run with: npx ts-node scripts/regenerate-cv-pdf.ts
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const CV_VERSIONS_DIR = process.env.CV_VERSIONS_DIR || path.join(__dirname, '../cv-versions');
const MD_FILE = path.join(CV_VERSIONS_DIR, 'CV_Master.md');

// Read markdown
const md = fs.readFileSync(MD_FILE, 'utf8');

// Convert markdown to HTML (simple parser sufficient for this structured doc)
function mdToHtml(markdown: string): string {
  let html = markdown;

  // H1
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // H2
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  // H3
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  // Bold + Italic ***text***
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links [text](url)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
  // Horizontal rules ---
  html = html.replace(/^---$/gm, '<hr>');
  // Bullet points
  html = html.replace(/^\* {3}(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\*   (.+)$/gm, '<li>$1</li>');
  // Group consecutive li items into ul
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  // Paragraphs (non-empty lines not already wrapped)
  html = html.replace(/^(?!<[hul]|<hr|<li|$)(.+)$/gm, '<p>$1</p>');

  return html;
}

const bodyHtml = mdToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 9.5pt;
      line-height: 1.45;
      color: #1a1a1a;
      background: white;
    }

    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 0.55in 0.6in;
    }

    h1 {
      font-size: 21pt;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: #111827;
      margin-bottom: 3px;
      text-align: center;
    }

    /* Subtitle line (bold paragraph after h1) */
    h1 + p {
      text-align: center;
      font-size: 10pt;
      font-weight: 600;
      color: #374151;
      margin-bottom: 3px;
    }

    /* Contact line */
    h1 + p + p {
      text-align: center;
      font-size: 8.5pt;
      color: #4b5563;
      margin-bottom: 2px;
    }

    p {
      font-size: 9.5pt;
      color: #374151;
      margin-bottom: 3px;
    }

    a { color: #2563eb; text-decoration: none; }

    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 10px 0 8px 0;
    }

    h2 {
      font-size: 9.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.9px;
      color: #111827;
      border-bottom: 1.5px solid #111827;
      padding-bottom: 2px;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    h3 {
      font-size: 9.8pt;
      font-weight: 600;
      color: #111827;
      margin-top: 7px;
      margin-bottom: 2px;
    }

    ul {
      padding-left: 14px;
      margin-bottom: 4px;
    }

    li {
      font-size: 9.2pt;
      color: #374151;
      margin-bottom: 2px;
      line-height: 1.4;
    }

    li::marker { color: #9ca3af; }

    /* Summary gets a slightly bigger feel */
    h2:first-of-type + p,
    h2 + p {
      font-size: 9.5pt;
      line-height: 1.5;
      text-align: justify;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${bodyHtml}
  </div>
</body>
</html>`;

async function generatePDF() {
  console.log('[CV Generator] Starting PDF generation...');

  if (!fs.existsSync(CV_VERSIONS_DIR)) {
    fs.mkdirSync(CV_VERSIONS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });

    const outPath = path.join(CV_VERSIONS_DIR, 'CV_Clean.pdf');
    await page.pdf({
      format: 'A4',
      path: outPath,
      margin: { top: '0.5in', right: '0.55in', bottom: '0.5in', left: '0.55in' },
      printBackground: true,
      displayHeaderFooter: false
    });

    console.log(`[CV Generator] ✅ PDF saved to: ${outPath}`);

    // Also overwrite the main v2 PDF
    const v2Path = path.join(CV_VERSIONS_DIR, 'CV_Professional.pdf');
    await page.pdf({
      path: v2Path,
      format: 'A4',
      margin: { top: '0.5in', right: '0.55in', bottom: '0.5in', left: '0.55in' },
      printBackground: true,
      displayHeaderFooter: false
    });

    console.log(`[CV Generator] ✅ Also updated: ${v2Path}`);
  } finally {
    await browser.close();
  }
}

generatePDF().catch(console.error);
