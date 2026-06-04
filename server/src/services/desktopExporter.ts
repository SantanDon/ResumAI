import fs from 'fs';
import path from 'path';
import os from 'os';
import { templateRenderer } from './templateRenderer';
import { JSONResume } from '../types/jsonResume';

const DESKTOP_DIR = process.env.DESKTOP_DIR || path.join(os.homedir(), 'Desktop', 'cv versions');

/**
 * Sanitizes strings to be safe for filenames
 */
function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().slice(0, 50);
}

/**
 * Exports a customized CV PDF and Cover Letter to a dedicated desktop folder
 */
export async function exportAssetsToDesktop(
  company: string,
  jobTitle: string,
  cvData: JSONResume | null,
  coverLetterContent: string | null
): Promise<string | null> {
  try {
    const cleanCompany = sanitizeFilename(company) || 'Company';
    const cleanTitle = sanitizeFilename(jobTitle) || 'Job';
    
    // Create folder: "Company - JobTitle"
    const folderName = `${cleanCompany} - ${cleanTitle}`;
    const targetFolder = path.join(DESKTOP_DIR, folderName);
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    console.log(`[DesktopExporter] Exporting assets to: ${targetFolder}`);
    
    // Write CV PDF if provided
    if (cvData) {
      const pdfBuffer = await templateRenderer.renderToPDF(cvData, { templateId: 'gold-standard' });
      const cvPath = path.join(targetFolder, `CV_${cleanCompany}_${cleanTitle}.pdf`);
      fs.writeFileSync(cvPath, pdfBuffer);
      console.log(`[DesktopExporter] Wrote CV PDF to: ${cvPath}`);
    }
    
    // Write Cover Letter if provided
    if (coverLetterContent) {
      const clPath = path.join(targetFolder, `CoverLetter_${cleanCompany}_${cleanTitle}.txt`);
      fs.writeFileSync(clPath, coverLetterContent);
      console.log(`[DesktopExporter] Wrote Cover Letter text to: ${clPath}`);
    }
    
    return targetFolder;
  } catch (error) {
    console.error('[DesktopExporter] Error exporting assets to desktop:', error);
    return null;
  }
}
