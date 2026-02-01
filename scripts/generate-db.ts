import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Interfaces matching our sources
interface LocalLogoItem {
    name: string;
    logoUrl?: string; // e.g., "src/data/MW.png"
    careersUrl?: string; // Some have this instead
}

interface LocalLogoJson {
    companies: LocalLogoItem[];
}

interface JsonCompany {
    id: string; // usually UUID from original file, we might generate new IDs or keep them
    name: string;
    url: string;
    description: string;
    mainPageContent?: string;
    compensation?: string;
    benefits?: string;
    locations?: string[];
    roleTypes?: string[];
}

interface JsonData {
    companies: JsonCompany[];
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

// Final DB Interface
interface DBCompany {
    id: number;
    name: string;
    logo: string; // URL path e.g., "/logos/MW.png"
    industry: string;
    description: string;
    color: string;
    website: string;
    languages: string[];
    frameworks: string[];
    skills: string[];
    experience: string;
    contributions: string;
    lookingFor: string;
    // Enriched
    compensation: string;
    benefits: string;
    locations: string[];
    roleTypes: string[];
}

const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const cleanArray = (str: string | undefined): string[] => {
    if (!str) return [];
    return str.split(/,\s*|\s+and\s+|\s*\n\s*/).map(s => s.trim()).filter(Boolean);
};

// Map manual corrections for names
const nameCorrections: Record<string, string> = {
    "Taking note app for Ipad": "Goodnotes",
    "Open positions": "Jump Trading",
    "Taking note app for Ipad ": "Goodnotes",
    "Open positions ": "Jump Trading",
    "Balyasny": "Balyasny Asset Management",
    "Qube Research and Technologies": "Qube Research & Technologies (QRT)",
    "QRT": "Qube Research & Technologies (QRT)"
};
const websiteMap: Record<string, string> = {
    "Goodnotes": "https://www.goodnotes.com",
    "Jump Trading": "https://www.jumptrading.com"
};

async function main() {
    console.log("Starting DB Generation...");

    // 1. Load Local Logos (src/data/.json)
    const logoJsonPath = path.join(process.cwd(), 'src', 'data', '.json');
    const logoRaw = fs.readFileSync(logoJsonPath, 'utf-8');
    const logoData = JSON.parse(logoRaw) as LocalLogoJson;

    // Map normalized name -> public URL
    const logoMap = new Map<string, string>();
    for (const item of logoData.companies) {
        const key = normalize(item.name);
        // Correct the path: src/data/X.png -> /logos/X.png
        // The user provided paths like "src/data/MW.png"
        const assetPath = item.logoUrl || item.careersUrl;
        if (assetPath) {
            const filename = path.basename(assetPath);
            const publicPath = `/logos/${filename}`;
            logoMap.set(key, publicPath);
        }
    }
    console.log(`Loaded ${logoMap.size} logos.`);

    // 2. Load Base Company Data (src/data/companies.json)
    const baseJsonPath = path.join(process.cwd(), 'src', 'data', 'companies.json');
    const baseRaw = fs.readFileSync(baseJsonPath, 'utf-8');
    const baseData = JSON.parse(baseRaw) as JsonData;
    console.log(`Loaded ${baseData.companies.length} base company profiles.`);

    // 3. Load Excel Data
    const excelPath = path.join(process.cwd(), 'Sponsor Skill Interest Survey (Responses).xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const excelRows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName]);
    console.log(`Loaded ${excelRows.length} rows from Excel.`);

    // 4. Merge Data
    const mergedMap = new Map<string, Partial<DBCompany>>();

    // Helper to get or create entry
    const getEntry = (name: string) => {
        let correctedName = name.trim();
        if (nameCorrections[correctedName]) correctedName = nameCorrections[correctedName];

        const key = normalize(correctedName);
        if (!mergedMap.has(key)) {
            mergedMap.set(key, {
                name: correctedName,
                website: websiteMap[correctedName] || '',
                id: Math.floor(Math.random() * 1000000) // Temporary ID
            });
        }
        return mergedMap.get(key)!;
    };

    // Process Base JSON first (rich text)
    for (const comp of baseData.companies) {
        const entry = getEntry(comp.name);
        entry.website = comp.url || entry.website;
        entry.description = comp.description || comp.mainPageContent?.slice(0, 300) + '...';
        entry.compensation = comp.compensation;
        entry.benefits = comp.benefits;
        entry.locations = comp.locations;
        entry.roleTypes = comp.roleTypes;

        // Base arrays can be init here but Excel usually better for skills
        if (!entry.languages) entry.languages = [];
        if (!entry.frameworks) entry.frameworks = [];
        if (!entry.skills) entry.skills = [];
    }

    // Process Excel (skills authority)
    for (const row of excelRows) {
        const rawName = row['Name of Company'];
        if (!rawName) continue;

        const entry = getEntry(rawName);

        // Overwrite description if present in Excel? Or append? 
        // Excel "What seperates you..." is usually good context.
        if (row['What seperates you from other companies here?']) {
            entry.description = row['What seperates you from other companies here?'];
        }
        if (row['Anything else you look for in canidates?']) {
            entry.lookingFor = row['Anything else you look for in canidates?'];
        }

        const langs = cleanArray(row['Langauges(JS, Python, C etc)']);
        const frams = cleanArray(row['Frameworks and Libraries (React, Pytorch)']);
        const soft = cleanArray(row['Personal Qualities (e.g. time management, leadership, team player, research). Seperate with comma + space']);
        const other = cleanArray(row['Any other technical skills?']);

        // Merge unique
        entry.languages = Array.from(new Set([...(entry.languages || []), ...langs]));
        entry.frameworks = Array.from(new Set([...(entry.frameworks || []), ...frams]));
        entry.skills = Array.from(new Set([...(entry.skills || []), ...soft, ...other]));
    }

    // 5. Finalize and Attach Logos
    const finalCompanies: DBCompany[] = [];
    let idCounter = 1;

    for (const [key, data] of mergedMap) {
        if (!data.name) continue;

        // Attach Logo
        const logoUrl = logoMap.get(key) || '🏢'; // Fallback to emoji if no logo found? 
        // Or if the user really wants a "photo", maybe a default placeholder image path?

        finalCompanies.push({
            id: idCounter++,
            name: data.name,
            logo: logoUrl,
            industry: 'Technology', // Default
            description: data.description || 'A technology company.',
            color: stringToColor(data.name),
            website: data.website || '',
            languages: data.languages || [],
            frameworks: data.frameworks || [],
            skills: data.skills || [],
            experience: 'See description',
            contributions: data.lookingFor || '',
            lookingFor: data.lookingFor || '',
            compensation: data.compensation || '',
            benefits: data.benefits || '',
            locations: data.locations || [],
            roleTypes: data.roleTypes || []
        });
    }

    console.log(`Generated ${finalCompanies.length} companies.`);

    // Write to file
    const outputPath = path.join(process.cwd(), 'src', 'data', 'companies-db.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalCompanies, null, 2));
    console.log(`Database written to ${outputPath}`);
}

main().catch(console.error);
