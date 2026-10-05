import { createRequire } from 'module';
import { AppError } from '../utils/AppError.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

export class PdfParserService {
  /**
   * Verify PDF magic byte signature (%PDF-)
   */
  static isPdfSignature(buffer) {
    if (!buffer || buffer.length < 5) return false;
    return (
      buffer[0] === 0x25 && // %
      buffer[1] === 0x50 && // P
      buffer[2] === 0x44 && // D
      buffer[3] === 0x46 && // F
      buffer[4] === 0x2d    // -
    );
  }

  /**
   * Extract plain text from PDF buffer
   */
  static async extractText(buffer) {
    if (!this.isPdfSignature(buffer)) {
      throw new AppError('Invalid PDF file signature. The file does not appear to be a valid PDF document.', 400);
    }

    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const rawText = result && typeof result.text === 'string' ? result.text.trim() : '';

      return {
        text: rawText,
        pageCount: result?.total || 1
      };
    } catch (err) {
      throw new AppError(
        `PDF text extraction failed: ${err.message || 'Corrupt or password-protected PDF document'}`,
        400
      );
    }
  }
}
