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
  // Enriched fields
  compensation?: string;
  benefits?: string;
  locations?: string[];
  roleTypes?: string[];
}

interface JsonData {
  companies: JsonCompany[];
}

interface LogoItem {
  name: string;
  logoUrl: string | null;
}

interface LogoJson {
  companies: LogoItem[];
}

interface ExcelRow {
  'Name of Company'?: string;
  'Langauges(JS, Python, C etc)'?: string;
  'Frameworks and Libraries (React, Pytorch)'?: string;
  'Personal Qualities (e.g. time management, leadership, team player, research). Seperate with comma + space'?: string;
  'Any other technical skills?'?: string;
  'What seperates you from other companies here?'?: string;
  'Anything else you look for in canidates?'?: string;
}

interface CompanyData {
  name: string;
  website: string;
  description?: string;
  lookingFor?: string;
  languages: string[];
  frameworks: string[];
  skills: string[];
  source: 'excel' | 'json' | 'both';
  compensation?: string;
  benefits?: string;
  locations?: string[];
  roleTypes?: string[];
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

const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

async function main() {
  console.log(`Start seeding...`)

  // 1. Load Excel Data
  let excelRows: ExcelRow[] = [];
  try {
    const excelPath = path.join(process.cwd(), 'Sponsor Skill Interest Survey (Responses).xlsx');
    if (fs.existsSync(excelPath)) {
      const workbook = XLSX.readFile(excelPath);
      const sheetName = workbook.SheetNames[0];
      excelRows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName]);
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

  // 2b. Load Logo JSON
  const logoMap = new Map<string, string>();
  try {
    const logoPath = path.join(process.cwd(), 'src', 'data', 'logo.json');
    if (fs.existsSync(logoPath)) {
      const raw = fs.readFileSync(logoPath, 'utf-8');
      const parsed = JSON.parse(raw) as LogoJson;
      for (const item of parsed.companies) {
        if (item.logoUrl) {
          logoMap.set(normalize(item.name), item.logoUrl);
        }
      }
      console.log(`Loaded ${logoMap.size} logos from JSON.`);
    } else {
      console.warn(`Logo file not found at ${logoPath}`);
    }
  } catch (err) {
    console.error("Error reading Logo JSON:", err);
  }

  // 3. Merge Data
  // We want to create a unified map of companies by normalized name
  const companyMap = new Map<string, CompanyData>();

  // Process Excel first (source of structured skills)
  for (const row of excelRows) {
    // Manual name corrections
    const nameMap: Record<string, string> = {
      "Taking note app for Ipad": "Goodnotes",
      "Open positions": "Jump Trading",
      "Taking note app for Ipad ": "Goodnotes",
      "Open positions ": "Jump Trading"
    };

    const websiteMap: Record<string, string> = {
      "Goodnotes": "https://www.goodnotes.com",
      "Jump Trading": "https://www.jumptrading.com"
    };

    let rawName = row['Name of Company'];
    if (!rawName) continue;

    rawName = rawName.trim();

    // Apply corrections
    if (nameMap[rawName]) {
      rawName = nameMap[rawName];
    }

    // Resume processing
    const key = normalize(rawName);

    const languages = cleanArray(row['Langauges(JS, Python, C etc)']);
    const frameworks = cleanArray(row['Frameworks and Libraries (React, Pytorch)']);
    const softSkills = cleanArray(row['Personal Qualities (e.g. time management, leadership, team player, research). Seperate with comma + space']);
    const otherTech = cleanArray(row['Any other technical skills?']);
    const allSkills = Array.from(new Set([...softSkills, ...otherTech]));

    companyMap.set(key, {
      name: rawName,
      website: websiteMap[rawName] || '',
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
    const existing = companyMap.get(key) || {} as Partial<CompanyData>;

    // If existing (from Excel), merge. If not, create new.
    // We prefer JSON website/url.
    // We prefer JSON description if Excel description is missing/short, or append? 
    // Let's use JSON description if Excel is missing.

    const merged: CompanyData = {
      name: existing.name || item.name, // Excel name preferred if exists, else JSON
      website: item.url || existing.website || '',
      description: existing.description || item.description || item.mainPageContent?.slice(0, 200) + '...',
      // Keep lists from Excel if they exist, else empty (JSON doesn't have them mapped easily)
      languages: existing.languages || [],
      frameworks: existing.frameworks || [],
      skills: existing.skills || [],
      lookingFor: existing.lookingFor || '',
      source: existing.source ? 'both' : 'json',
      // Enriched
      compensation: item.compensation || existing.compensation || '',
      benefits: item.benefits || existing.benefits || '',
      locations: item.locations || existing.locations || [],
      roleTypes: item.roleTypes || existing.roleTypes || []
    };

    companyMap.set(key, merged);
  }

  // 4. Seed Database
  console.log(`Merging complete. Found ${companyMap.size} unique companies.`);

  // Clear table
  await prisma.company.deleteMany({});

  for (const data of companyMap.values()) {
    // Basic validation
    if (!data.name) continue;

    const normalizedName = normalize(data.name);
    // Priority: logo.json > Clearbit (only if explicitly enabled/fallback) > emoji
    // User requested explicitly to ONLY use logo.json for now, ignoring Clearbit automagic if it fails.
    let logoUrl = logoMap.get(normalizedName);

    if (!logoUrl) {
      // Fallback logic or '🏢' if strictly no clearbit wanted?
      // Let's keep the URL object logic but usually utilize logoMap first.

      // If we want to strictly follow "only use logo.json", we might fallback to emoji.
      // But keeping visual fallback for others is safer.
      // For now, let's trust logoMap is the source of truth for the ones that matter.
      logoUrl = '🏢';
    }

    const companyData = {
      name: data.name,
      logo: logoUrl,
      color: stringToColor(data.name),
      industry: 'Technology', // Default, could define heuristic
      description: data.description || `A technology company.`,
      website: data.website || '',
      languages: JSON.stringify(data.languages),
      frameworks: JSON.stringify(data.frameworks),
      skills: JSON.stringify(data.skills),
      experience: 'See description',
      contributions: data.lookingFor || '',
      lookingFor: data.lookingFor || '',
      // Enriched
      compensation: data.compensation || '',
      benefits: data.benefits || '',
      locations: JSON.stringify(data.locations || []),
      roleTypes: JSON.stringify(data.roleTypes || [])
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