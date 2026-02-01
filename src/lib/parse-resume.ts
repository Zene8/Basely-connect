// Polyfill helper for PDF parsing in Node
if (typeof global.DOMMatrix === 'undefined') {
  // @ts-expect-error polyfill
  global.DOMMatrix = class DOMMatrix {
    constructor() { }
    multiply() { return this; }
    transformPoint() { return { x: 0, y: 0 }; }
  };
}

// @ts-ignore pdf-parse lacks types
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

// Polyfill for PDF.js in Node environment
if (typeof Promise.withResolvers === 'undefined') {
  // @ts-expect-error polyfill
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Minimal DOMMatrix polyfill if missing
if (typeof global.DOMMatrix === 'undefined') {
  // @ts-expect-error polyfill
  global.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor() { }
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
  };
}

export async function parseResume(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === 'application/pdf') {
      const data = await pdf(buffer);
      return data.text;
    }

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType.includes('word')) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // Fallback for text files
    return buffer.toString('utf-8');
  } catch (error) {
    console.error("Resume Parsing Error:", error);
    throw new Error("Failed to parse resume file.");
  }
}
