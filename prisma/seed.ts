import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient()

// Types for our data sources
interface JsonCompany {
  id: string;
  name: string;
  url: string;
  description: string;
  mainPageContent?: string;
}

interface JsonData {
  companies: JsonCompany[];
}

// Helper to clean string arrays from Excel
const cleanArray = (str: string | undefined): string[] => {
  if (!str) return [];
  return str.split(/,\s*|\s+and\s+|\s*\n\s*/).map(s => s.trim()).filter(Boolean);
};

// Helper to generate a consistent color from string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

async function main() {
  console.log(`Start seeding...`)

  // 1. Load Excel Data
  let excelRows: any[] = [];
  try {
    const excelPath = path.join(process.cwd(), 'Sponsor Skill Interest Survey (Responses).xlsx');
    if (fs.existsSync(excelPath)) {
      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      console.log(`Loaded ${excelRows.length} rows from Excel.`);
    } else {
      console.warn(`Excel file not found at ${excelPath}`);
    }
  } catch (err) {
    console.error("Error reading Excel:", err);
  }

  // 2. Load JSON Data
  let jsonData: JsonCompany[] = [];
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'companies.json');
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const parsed = JSON.parse(raw) as JsonData;
      jsonData = parsed.companies || [];
      console.log(`Loaded ${jsonData.length} companies from JSON.`);
    } else {
      console.warn(`JSON file not found at ${jsonPath}`);
    }
  } catch (err) {
    console.error("Error reading JSON:", err);
  }

  // 3. Merge Data
  // We want to create a unified map of companies by normalized name
  const companyMap = new Map<string, any>();

  const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // Process Excel first (source of structured skills)
  for (const row of excelRows) {
    const rawName = row['Name of Company'];
    if (!rawName) continue;

    const key = normalize(rawName);

    const languages = cleanArray(row['Langauges(JS, Python, C etc)']);
    const frameworks = cleanArray(row['Frameworks and Libraries (React, Pytorch)']);
    const softSkills = cleanArray(row['Personal Qualities (e.g. time management, leadership, team player, research). Seperate with comma + space']);
    const otherTech = cleanArray(row['Any other technical skills?']);
    const allSkills = Array.from(new Set([...softSkills, ...otherTech]));

    companyMap.set(key, {
      name: rawName.trim(), // Keep original casing from Excel as base
      description: row['What seperates you from other companies here?'],
      lookingFor: row['Anything else you look for in canidates?'],
      languages,
      frameworks,
      skills: allSkills,
      source: 'excel'
    });
  }

  // Process JSON (source of URLs and long descriptions)
  for (const item of jsonData) {
    const key = normalize(item.name);
    const existing = companyMap.get(key) || {};

    // If existing (from Excel), merge. If not, create new.
    // We prefer JSON website/url.
    // We prefer JSON description if Excel description is missing/short, or append? 
    // Let's use JSON description if Excel is missing.

    const merged = {
      ...existing,
      name: existing.name || item.name, // Excel name preferred if exists, else JSON
      website: item.url || existing.website,
      description: existing.description || item.description || item.mainPageContent?.slice(0, 200) + '...',
      // Keep lists from Excel if they exist, else empty (JSON doesn't have them mapped easily)
      languages: existing.languages || [],
      frameworks: existing.frameworks || [],
      skills: existing.skills || [],
      lookingFor: existing.lookingFor || '',
      source: existing.source ? 'both' : 'json'
    };

    companyMap.set(key, merged);
  }

  // 4. Seed Database
  console.log(`Merging complete. Found ${companyMap.size} unique companies.`);

  // Clear table
  await prisma.company.deleteMany({});

  for (const [_key, data] of companyMap) {
    // Basic validation
    if (!data.name) continue;

    const companyData = {
      name: data.name,
      logo: '🏢',
      color: stringToColor(data.name),
      industry: 'Technology', // Default, could define heuristic
      description: data.description || `A technology company.`,
      website: data.website || '',
      languages: JSON.stringify(data.languages),
      frameworks: JSON.stringify(data.frameworks),
      skills: JSON.stringify(data.skills),
      experience: 'See description',
      contributions: data.lookingFor || '',
      lookingFor: data.lookingFor || ''
    };

    try {
      await prisma.company.create({
        data: companyData
      });
      console.log(`Created: ${data.name}`);
    } catch (e) {
      console.error(`Failed to create ${data.name}:`, e);
    }
  }

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })