import Papa from 'papaparse';
import { Company } from '@/types';

export function parseCompanyCSV(csvContent: string): Promise<Partial<Company>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      complete: (results: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const companies = results.data.map((row: any, index: number) => ({
          id: index + 100,
          name: row['Company Name'] || row['name'] || 'Unknown Company',
          description: row['Description'] || row['description'] || '',
          industry: row['Industry'] || row['industry'] || 'Technology',
          logo: '🏢',
          color: '#888888',
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: (error: any) => reject(error)
    });
  });
}
