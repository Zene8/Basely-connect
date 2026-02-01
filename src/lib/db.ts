import fs from 'fs';
import path from 'path';
import { Company } from '@/types';

// Path to the generated JSON DB
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'companies-db.json');

// Cached data
let companiesCache: Company[] | null = null;
let lastModified = 0;

export async function getCompanies(): Promise<Company[]> {
    try {
        // Check file stats for cache invalidation
        if (!fs.existsSync(DB_PATH)) {
            console.warn("Database file not found:", DB_PATH);
            return [];
        }

        const stats = fs.statSync(DB_PATH);
        if (!companiesCache || stats.mtimeMs > lastModified) {
            const raw = fs.readFileSync(DB_PATH, 'utf-8');
            companiesCache = JSON.parse(raw) as Company[];
            lastModified = stats.mtimeMs;
        }

        return companiesCache || [];
    } catch (error) {
        console.error("Failed to load companies DB:", error);
        return [];
    }
}

export async function getCompamyById(id: number): Promise<Company | undefined> {
    const companies = await getCompanies();
    return companies.find(c => c.id === id);
}
