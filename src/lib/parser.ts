import Papa from 'papaparse';
import { Company } from '@/types';

export function parseCompanyCSV(csvContent: string): Promise<Partial<Company>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const companies = results.data.map((row: any, index) => ({
          id: index + 100, // Offset IDs to avoid collision with static data
          name: row['Company Name'] || row['name'] || 'Unknown Company',
          description: row['Description'] || row['description'] || '',
          industry: row['Industry'] || row['industry'] || 'Technology',
          logo: '🏢', // Default logo
          color: '#888888', // Default color
          attributes: {
            languages: (row['Languages'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            frameworks: (row['Frameworks'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            skills: (row['Skills'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            experience: row['Experience'] || 'Not specified',
            contributions: row['Contributions'] || 'Not specified'
          }
        }));
        resolve(companies as Partial<Company>[]);
      },
      error: (error: any) => reject(error)
    });
  });
}
