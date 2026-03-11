import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts raw text from uploaded resume files (PDF or DOCX).
 */
export const extractTextFromFile = async (
  filePath: string,
  fileType: 'pdf' | 'docx'
): Promise<string> => {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  if (fileType === 'pdf') {
    const dataBuffer = fs.readFileSync(absolutePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ path: absolutePath });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${fileType}`);
};

/**
 * Parses raw resume text to extract structured information.
 * Uses NLP heuristics for skill extraction, education, and experience parsing.
 */
export const parseResumeText = (rawText: string) => {
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const education = extractEducation(text);
  const certifications = extractCertifications(text);
  const summary = extractSummary(text);

  return { skills, experience, education, certifications, summary };
};

// --- Skill Extraction ---

const SKILL_KEYWORDS: Record<string, string[]> = {
  programming: [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'golang',
    'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'matlab', 'perl', 'dart', 'lua',
    'html', 'css', 'sql', 'bash', 'shell', 'powershell',
  ],
  framework: [
    'react', 'react.js', 'reactjs', 'angular', 'vue', 'vue.js', 'vuejs', 'next.js',
    'nextjs', 'nuxt', 'svelte', 'express', 'express.js', 'fastapi', 'django', 'flask',
    'spring', 'spring boot', 'rails', 'ruby on rails', 'laravel', '.net', 'asp.net',
    'node.js', 'nodejs', 'nest.js', 'nestjs', 'gatsby', 'remix', 'tailwind',
    'tailwindcss', 'bootstrap', 'material ui', 'chakra ui',
  ],
  database: [
    'mongodb', 'postgresql', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch',
    'dynamodb', 'cassandra', 'oracle', 'sql server', 'firebase', 'firestore', 'supabase',
    'neo4j', 'couchdb', 'mariadb',
  ],
  cloud: [
    'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'heroku', 'vercel',
    'netlify', 'digitalocean', 'cloudflare', 'lambda', 's3', 'ec2', 'ecs', 'eks',
  ],
  devops: [
    'docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'github actions', 'gitlab ci',
    'terraform', 'ansible', 'nginx', 'apache', 'linux', 'git', 'github', 'gitlab',
    'bitbucket', 'prometheus', 'grafana',
  ],
  'data-science': [
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'matplotlib',
    'seaborn', 'jupyter', 'data analysis', 'data visualization', 'machine learning',
    'deep learning', 'nlp', 'natural language processing', 'computer vision',
    'statistics', 'big data', 'spark', 'hadoop', 'tableau', 'power bi',
  ],
  'ai-ml': [
    'artificial intelligence', 'neural networks', 'transformers', 'bert', 'gpt',
    'llm', 'large language models', 'reinforcement learning', 'generative ai',
    'langchain', 'hugging face', 'openai', 'chatgpt',
  ],
  testing: [
    'jest', 'mocha', 'cypress', 'selenium', 'playwright', 'junit', 'pytest',
    'unit testing', 'integration testing', 'e2e testing', 'test automation',
  ],
  mobile: [
    'react native', 'flutter', 'ios', 'android', 'swift', 'swiftui', 'xcode',
    'android studio', 'expo',
  ],
  'soft-skill': [
    'leadership', 'communication', 'teamwork', 'problem solving', 'agile',
    'scrum', 'project management', 'time management', 'critical thinking',
    'collaboration', 'mentoring',
  ],
};

const extractSkills = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  const foundSkills: Set<string> = new Set();

  for (const category of Object.values(SKILL_KEYWORDS)) {
    for (const skill of category) {
      // Use word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(lowerText)) {
        foundSkills.add(skill);
      }
    }
  }

  return Array.from(foundSkills);
};

// --- Experience Extraction ---

const extractExperience = (text: string) => {
  const experiences: { title: string; company: string; duration: string; description: string }[] = [];

  // Look for sections that typically contain experience
  const expSectionRegex = /(?:experience|work\s*history|employment|professional\s*background)[\s:]*\n([\s\S]*?)(?=\n(?:education|skills|certifications|projects|awards|references|$))/gi;
  const match = expSectionRegex.exec(text);

  if (match) {
    const expSection = match[1];
    // Split by common patterns: dates, job titles with company names
    const entryRegex = /(.+?)\s*(?:at|@|-|–|,)\s*(.+?)\s*(?:\||–|-|,)\s*(.+?)(?:\n([\s\S]*?))?(?=\n[A-Z]|\n\n|$)/g;
    let entry;
    while ((entry = entryRegex.exec(expSection)) !== null) {
      experiences.push({
        title: entry[1]?.trim() || '',
        company: entry[2]?.trim() || '',
        duration: entry[3]?.trim() || '',
        description: entry[4]?.trim() || '',
      });
    }
  }

  // Fallback: look for date patterns near capitalized words
  if (experiences.length === 0) {
    const datePattern = /(\d{4})\s*(?:-|–|to)\s*(?:(\d{4})|present|current)/gi;
    let dateMatch;
    while ((dateMatch = datePattern.exec(text)) !== null) {
      const contextStart = Math.max(0, dateMatch.index - 200);
      const context = text.substring(contextStart, dateMatch.index);
      const lines = context.split('\n').filter((l) => l.trim());
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1].trim();
        experiences.push({
          title: lastLine,
          company: '',
          duration: dateMatch[0],
          description: '',
        });
      }
    }
  }

  return experiences;
};

// --- Education Extraction ---

const extractEducation = (text: string) => {
  const education: { degree: string; field: string; institution: string; year?: number }[] = [];

  const degreePatterns = [
    /(?:bachelor|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?e\.?|b\.?sc)/i,
    /(?:master|m\.?s\.?|m\.?a\.?|m\.?tech|m\.?e\.?|m\.?sc|mba)/i,
    /(?:ph\.?d|doctorate|doctor)/i,
    /(?:diploma|associate|certificate)/i,
  ];

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of degreePatterns) {
      if (pattern.test(line)) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        education.push({
          degree: line.trim(),
          field: '',
          institution: lines[i + 1]?.trim() || '',
          year: yearMatch ? parseInt(yearMatch[0]) : undefined,
        });
        break;
      }
    }
  }

  return education;
};

// --- Certifications Extraction ---

const extractCertifications = (text: string): string[] => {
  const certs: string[] = [];
  const certKeywords = [
    'aws certified', 'google certified', 'microsoft certified', 'azure',
    'comptia', 'cisco', 'ccna', 'ccnp', 'pmp', 'scrum master', 'csm',
    'certified kubernetes', 'cka', 'ckad', 'terraform associate',
    'solutions architect', 'developer associate', 'data engineer',
    'machine learning specialty', 'oracle certified', 'itil',
    'six sigma', 'safe agilist',
  ];

  const lowerText = text.toLowerCase();
  for (const cert of certKeywords) {
    if (lowerText.includes(cert)) {
      // Try to get the full line containing the certification
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes(cert)) {
          certs.push(line.trim());
          break;
        }
      }
    }
  }

  return [...new Set(certs)];
};

// --- Summary Extraction ---

const extractSummary = (text: string): string => {
  const summaryRegex = /(?:summary|objective|about|profile|overview)[\s:]*\n([\s\S]*?)(?=\n(?:experience|education|skills|$))/i;
  const match = summaryRegex.exec(text);
  if (match) {
    return match[1].trim().substring(0, 500);
  }
  // Fallback: first paragraph
  const firstParagraph = text.split('\n\n')[0];
  if (firstParagraph && firstParagraph.length > 50) {
    return firstParagraph.trim().substring(0, 500);
  }
  return '';
};
