import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { runPythonAiTask } from './pythonAiBridge';

interface ParsedResumePayload {
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    field: string;
    institution: string;
    year?: number | null;
  }[];
  certifications: string[];
  summary?: string;
}

/**
 * Extracts raw text from uploaded resume files (PDF or DOCX).
 */
export const extractTextFromFile = async (
  fileBuffer: Buffer,
  fileType: 'pdf' | 'docx'
): Promise<string> => {
  if (fileType === 'pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text;
  }

  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${fileType}`);
};

/**
 * Parses raw resume text to extract structured information.
 * Delegates NLP-style parsing to the Python engine so the AI layer can use
 * Python text processing without changing the API contract.
 */
export const parseResumeText = async (rawText: string): Promise<ParsedResumePayload> => {
  return runPythonAiTask<ParsedResumePayload>('parse_resume', { rawText });
};
