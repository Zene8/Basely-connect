// src/lib/scraper.ts
import { load, CheerioAPI } from 'cheerio'
import { promises as fs } from 'fs'
import path from 'path'

export interface SubPageData {
  url: string
  title: string
  content: string
}

export interface ScrapedCompanyData {
  id: string
  name: string
  url: string
  description: string
  mainPageContent: string
  allContent: string
  subPages: SubPageData[]
  totalCharacters: number
  totalPages: number
  scrapedAt: string
}

export interface CompaniesDatabase {
  lastUpdated: string
  totalCompanies: number
  companies: ScrapedCompanyData[]
}

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'companies.json')

/* -------------------------------------------------------------------------- */
/*                               Text Cleaning                                 */
/* -------------------------------------------------------------------------- */

function cleanText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/[\t\r]+/g, ' ')
    // Replace multiple spaces with single space
    .replace(/ {2,}/g, ' ')
    // Replace multiple newlines with double newline
    .replace(/\n{3,}/g, '\n\n')
    // Remove lines that are just whitespace
    .replace(/^\s+$/gm, '')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    // Final trim
    .trim()
}

function extractCleanText($: CheerioAPI): string {
  // Clone to avoid modifying original
  const $clone = load($.html())
  
  // Remove unwanted elements
  $clone('script, style, noscript, iframe, svg, img, video, audio, canvas').remove()
  $clone('nav, footer, aside').remove()
  $clone('[class*="cookie"], [class*="consent"], [class*="popup"], [class*="modal"]').remove()
  $clone('[class*="banner"], [class*="advertisement"], [class*="social"]').remove()
  $clone('[class*="share"], [class*="newsletter"], [class*="subscribe"]').remove()
  $clone('[role="navigation"], [role="contentinfo"], [aria-hidden="true"]').remove()
  
  // Try to get main content
  let text = ''
  const mainSelectors = ['main', 'article', '[role="main"]', '.main-content', '#main-content', '.content', '#content', '.page-content']
  
  for (const selector of mainSelectors) {
    const content = $clone(selector).text()
    if (content && content.length > text.length) {
      text = content
    }
  }
  
  // Fallback to body
  if (text.length < 300) {
    $clone('header').remove()
    text = $clone('body').text()
  }
  
  return cleanText(text)
}

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                              */
/* -------------------------------------------------------------------------- */

function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function extractCompanyName(url: string, $: CheerioAPI): string {
  const ogName = $('meta[property="og:site_name"]').attr('content')
  if (ogName && ogName.length > 2 && ogName.length < 50) return ogName.trim()
  
  const title = $('title').text()
  const parts = title.split(/[|\-–—:]/)
  
  if (parts.length > 1) {
    const last = parts[parts.length - 1].trim()
    if (last.length > 2 && last.length < 40 && !last.toLowerCase().includes('career')) {
      return last
    }
  }
  
  const first = parts[0].trim()
  if (first.length > 2 && first.length < 40 && !first.toLowerCase().includes('career')) {
    return first
  }
  
  try {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0]
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch {
    return 'Unknown'
  }
}

function findRelevantLinks($: CheerioAPI, baseUrl: string): string[] {
  const found: string[] = []
  const baseHost = new URL(baseUrl).hostname
  const keywords = [
    'career', 'job', 'join', 'team', 'teams', 'work', 'working',
    'graduate', 'intern', 'culture', 'benefit', 'benefits', 'perks',
    'about', 'people', 'technology', 'engineering', 'life', 'values',
    'mission', 'diversity', 'opportunities', 'roles', 'programme', 'program',
    'associate', 'analyst', 'developer', 'quantitative', 'quant', 'trading',
    'research', 'open-positions', 'apply', 'recruitment', 'hiring', 'why'
  ]
  
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
    if (href.includes('linkedin.com') || href.includes('twitter.com') || href.includes('facebook.com')) return
    if (href.includes('instagram.com') || href.includes('youtube.com')) return
    
    try {
      const fullUrl = new URL(href, baseUrl).href
      if (new URL(fullUrl).hostname !== baseHost) return
      if (/\.(pdf|doc|docx|png|jpg|jpeg|gif|svg|mp4|zip|exe)$/i.test(fullUrl)) return
      
      const linkText = $(el).text().toLowerCase()
      const lowerUrl = fullUrl.toLowerCase()
      
      const isRelevant = keywords.some(kw => lowerUrl.includes(kw) || linkText.includes(kw))
      
      if (isRelevant && !found.includes(fullUrl) && fullUrl !== baseUrl) {
        found.push(fullUrl)
      }
    } catch {}
  })
  
  return found.slice(0, 25)
}

async function fetchPage(url: string): Promise<CheerioAPI | null> {
  try {
    console.log(`  📄 Fetching: ${url}`)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status}`)
      return null
    }
    return load(await res.text())
  } catch (err) {
    console.error(`  ❌ Failed: ${url}`, err instanceof Error ? err.message : '')
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*                              Scraper Functions                              */
/* -------------------------------------------------------------------------- */

export async function scrapeCareerPage(url: string, deep: boolean = true): Promise<ScrapedCompanyData | null> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔍 Scraping: ${url}`)
  console.log(`${'='.repeat(60)}`)
  
  const $main = await fetchPage(url)
  if (!$main) return null

  const name = extractCompanyName(url, $main)
  const description = $main('meta[name="description"]').attr('content') || 
                      $main('meta[property="og:description"]').attr('content') || ''
  
  const mainPageContent = extractCleanText($main)
  
  console.log(`  ✅ Company: ${name}`)
  console.log(`  ✅ Main page: ${mainPageContent.length} chars`)
  
  // Build all content with clear structure
  let allContent = `
========================================
COMPANY: ${name.toUpperCase()}
URL: ${url}
========================================

${mainPageContent}
`.trim()

  const subPages: SubPageData[] = []

  if (deep) {
    const subUrls = findRelevantLinks($main, url)
    console.log(`  📑 Found ${subUrls.length} subpages`)

    const seenContent = new Set<string>()
    seenContent.add(mainPageContent.slice(0, 1000))

    for (const subUrl of subUrls) {
      await new Promise(r => setTimeout(r, 700))
      
      const $sub = await fetchPage(subUrl)
      if ($sub) {
        const content = extractCleanText($sub)
        
        // Skip short content
        if (content.length < 150) continue
        
        // Skip duplicates
        const contentKey = content.slice(0, 1000)
        if (seenContent.has(contentKey)) continue
        seenContent.add(contentKey)
        
        const title = cleanText(
          $sub('h1').first().text() || 
          $sub('title').text().split(/[|\-–]/)[0] || 
          'Page'
        ).slice(0, 100)
        
        subPages.push({ url: subUrl, title, content })
        
        allContent += `

========================================
PAGE: ${title.toUpperCase()}
URL: ${subUrl}
========================================

${content}`
        
        console.log(`  ✅ ${title}: ${content.length} chars`)
      }
    }
  }

  const totalCharacters = allContent.length
  const totalPages = subPages.length + 1

  console.log(`\n  📊 TOTAL: ${totalCharacters.toLocaleString()} chars from ${totalPages} pages`)

  return {
    id: generateId(name),
    name,
    url,
    description: cleanText(description).slice(0, 1000),
    mainPageContent,
    allContent,
    subPages,
    totalCharacters,
    totalPages,
    scrapedAt: new Date().toISOString(),
  }
}

export async function scrapeMultiplePages(urls: string[], deep: boolean = true): Promise<ScrapedCompanyData[]> {
  const results: ScrapedCompanyData[] = []
  
  for (const url of urls) {
    const data = await scrapeCareerPage(url, deep)
    if (data) results.push(data)
    await new Promise(r => setTimeout(r, 2500))
  }
  
  return results
}

/* -------------------------------------------------------------------------- */
/*                              JSON Functions                                 */
/* -------------------------------------------------------------------------- */

export async function saveToJson(companies: ScrapedCompanyData[]): Promise<string> {
  const database: CompaniesDatabase = {
    lastUpdated: new Date().toISOString(),
    totalCompanies: companies.length,
    companies,
  }

  const dataDir = path.dirname(DATA_FILE_PATH)
  try { await fs.mkdir(dataDir, { recursive: true }) } catch {}

  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(database, null, 2), 'utf-8')
  console.log(`\n💾 Saved ${companies.length} companies to ${DATA_FILE_PATH}`)
  
  return DATA_FILE_PATH
}

export async function loadFromJson(): Promise<CompaniesDatabase | null> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data) as CompaniesDatabase
  } catch {
    return null
  }
}

export async function scrapeAndSave(urls: string[], deep: boolean = true): Promise<CompaniesDatabase> {
  console.log(`\n${'#'.repeat(60)}`)
  console.log(`# SCRAPE & SAVE - ${urls.length} URLs`)
  console.log(`${'#'.repeat(60)}`)

  const companies = await scrapeMultiplePages(urls, deep)
  await saveToJson(companies)

  return {
    lastUpdated: new Date().toISOString(),
    totalCompanies: companies.length,
    companies,
  }
}