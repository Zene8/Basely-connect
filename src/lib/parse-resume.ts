
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import officeParser from 'officeparser';

// Set up the worker for pdfjs in Node environment
if (typeof window === 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs';
}

/**
 * Resume Specific Parser
 * Optimized for layout preservation and text cleaning.
 */
class ResumeParser {
  async parse(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.parsePDF(buffer);
      }

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType.includes('wordprocessingml') ||
        mimeType.includes('docx')) {
        const result = await mammoth.extractRawText({ buffer });
        return this.cleanText(result.value);
      }

      if (mimeType === 'application/msword' || mimeType.includes('msword') || mimeType.includes('doc')) {
        return new Promise((resolve, reject) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          officeParser.parseOffice(buffer, (data: any, err: any) => {
            if (err) return reject(err);
            resolve(this.cleanText(data));
          });
        });
      }

      if (mimeType.startsWith('text/')) {
        return this.cleanText(buffer.toString('utf-8'));
      }

      throw new Error(`Unsupported file type: ${mimeType}`);
    } catch (error) {
      console.error(`Extraction failed for ${mimeType}:`, error);
      const message = error instanceof Error ? error.message : 'Unknown Error';
      throw new Error(`Extraction failed for ${mimeType}: ${message}`);
    }
  }

  private async parsePDF(buffer: Buffer): Promise<string> {
    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      let lastY = -1;
      let pageText = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of (textContent.items as any[])) {
        if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 2) {
          pageText += '\n';
        }
        pageText += item.str + ' ';
        lastY = item.transform[5];
      }
      fullText += pageText + '\n';
    }

    return this.cleanText(fullText);
  }

  /**
   * Cleans common artifacts from extracted text
   */
  cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters (keep \r \n)
      .replace(/\t/g, ' ')               // Replace tabs with spaces
      .replace(/ +(?= )/g, '')           // Remove multiple spaces
      .trim();
  }
}

const resumeParser = new ResumeParser();

export async function parseResume(buffer: Buffer, mimeType: string): Promise<string> {
  return resumeParser.parse(buffer, mimeType);
}
