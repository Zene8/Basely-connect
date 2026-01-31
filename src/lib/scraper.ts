import { load } from 'cheerio'

export interface ScrapedCompanyData {
  name: string
  url: string
  languages: string[]
  frameworks: string[]
  skills: string[]
  qualities: string[]
  rawText: string
  scrapedAt: Date
}

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Rust', 'Go', 'Scala', 'Kotlin', 'Ruby', 'SQL', 'R', 'MATLAB', 'Bash', 'Swift', 'PHP']
const FRAMEWORKS = ['React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring', 'PyTorch', 'TensorFlow', 'Pandas', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Spark', 'Kafka']
const SKILLS = ['Machine Learning', 'AI', 'Data Science', 'Deep Learning', 'DevOps', 'System Design', 'Distributed Systems', 'Cloud Computing', 'Cybersecurity', 'Quantitative', 'Statistics']
const QUALITIES = ['teamwork', 'communication', 'leadership', 'ownership', 'problem solving', 'analytical', 'motivated', 'collaborative', 'curious', 'driven']

function extractKeywords(text: string, keywords: string[]): string[] {
  const found: string[] = []
  const lowerText = text.toLowerCase()
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase()) && !found.includes(keyword)) {
      found.push(keyword)
    }
  }
  return found
}

export async function scrapeCareerPage(url: string): Promise<ScrapedCompanyData | null> {
  try {
    console.log(`Scraping: ${url}`)
    
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    
    const html = await response.text()
    const $ = load(html)
    $('script, style, nav, footer, header, noscript').remove()
    
    const pageText = $('body').text().replace(/\s+/g, ' ').trim()
    const name = $('title').text().split(/[|\-–]/)[0].trim() || 'Unknown Company'

    return {
      name,
      url,
      languages: extractKeywords(pageText, LANGUAGES),
      frameworks: extractKeywords(pageText, FRAMEWORKS),
      skills: extractKeywords(pageText, SKILLS),
      qualities: extractKeywords(pageText, QUALITIES),
      rawText: pageText.slice(0, 5000),
      scrapedAt: new Date(),
    }
  } catch (err) {
    console.error(`Failed to scrape ${url}:`, err)
    return null
  }
}

export async function scrapeMultiplePages(urls: string[]): Promise<ScrapedCompanyData[]> {
  const results: ScrapedCompanyData[] = []
  for (const url of urls) {
    const data = await scrapeCareerPage(url)
    if (data) results.push(data)
    await new Promise(r => setTimeout(r, 1000))
  }
  return results
}
