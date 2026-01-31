import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx';
import path from 'path';

const prisma = new PrismaClient()

// Helper to clean string arrays
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
  console.log(`Start seeding from Excel...`)
  
  // Read Excel
  const excelPath = path.join(process.cwd(), 'Sponsor Skill Interest Survey (Responses).xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  // Clear existing
  await prisma.company.deleteMany({});
  
  for (const row of data as any[]) {
    const name = row['Name of Company'];
    if (!name) continue;

    const languages = cleanArray(row['Langauges(JS, Python, C etc)']);
    const frameworks = cleanArray(row['Frameworks and Libraries (React, Pytorch)']);
    
    // Merge soft skills + technical extras + "anything else" into broad skills/traits
    const softSkills = cleanArray(row['Personal Qualities (e.g. time management, leadership, team player, research). Seperate with comma + space']);
    const otherTech = cleanArray(row['Any other technical skills?']);
    const otherTraits = cleanArray(row['Anything else you look for in canidates?']);
    
    const allSkills = Array.from(new Set([...softSkills, ...otherTech]));

    const description = row['What seperates you from other companies here?'] || `A technology company specializing in ${languages[0] || 'software development'}.`;
    const contributions = row['Anything else you look for in canidates?'] || 'Passionate developers.';

    const company = {
      name: name.trim(),
      logo: '🏢', // Could map specific names to emojis if desired
      color: stringToColor(name),
      industry: 'Technology', // Default
      description: description,
      languages: JSON.stringify(languages),
      frameworks: JSON.stringify(frameworks),
      skills: JSON.stringify(allSkills),
      experience: 'See description',
      contributions: contributions
    };

    const created = await prisma.company.create({
      data: company,
    })
    console.log(`Created company: ${created.name}`)
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