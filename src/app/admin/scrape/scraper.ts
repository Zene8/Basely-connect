// src/lib/scraper.ts
import { load, CheerioAPI } from 'cheerio'

export interface SubPageData {
  url: string
  title: string
  content: string  // Full raw text
}

export interface ScrapedCompanyData {
  name: string
  url: string
  description: string
  mainPageContent: string      // Full text from main page
  allContent: string           // ALL text combined from all pages
  subPages: SubPageData[]      // Individual subpage content
  totalCharacters: number
  totalPages: number
  scrapedAt: Date
}

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                              */
/* -------------------------------------------------------------------------- */

function extractCompanyName(url: string, $: CheerioAPI): string {
  // Try meta tags
  const ogName = $('meta[property="og:site_name"]').attr('content')
  if (ogName && ogName.length > 2 && ogName.length < 50) return ogName.trim()

  // Try title
  const title = $('title').text()
  const parts = title.split(/[|\-–—:]/)
  
  // Often format is "Page - Company Name"
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

  // Fallback to domain
  try {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0]
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch {
    return 'Unknown'
  }
}

function cleanText(text: string): string {
  return text
    // Normalize whitespace but preserve some structure
    .replace(/[\t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
    .replace(/[ ]{2,}/g, ' ')    // Max 1 space
    .replace(/[^\w\s.,!?;:()\-'"/@#&+\n]/g, ' ')  // Keep basic punctuation
    .trim()
}

function getFullPageText($: CheerioAPI): string {
  // Remove noise elements
  $('script, style, noscript, iframe, svg, img, video, audio').remove()
  $('[class*="cookie"], [class*="consent"], [class*="popup"], [class*="modal"], [class*="banner"], [class*="advertisement"], [class*="ad-"]').remove()
  $('[id*="cookie"], [id*="consent"], [id*="popup"], [id*="modal"]').remove()
  
  // Get text from body
  let text = ''
  
  // Try to get main content first
  const mainSelectors = [
    'main',
    'article', 
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.content',
    '#content',
    '.page-content',
  ]
  
  for (const selector of mainSelectors) {
    const content = $(selector).text()
    if (content && content.length > text.length) {
      text = content
    }
  }
  
  // If main content is too short, get everything from body
  if (text.length < 1000) {
    // Remove nav/header/footer for cleaner body content
    $('nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"]').remove()
    text = $('body').text()
  }
  
  return cleanText(text)
}

function findAllRelevantLinks($: CheerioAPI, baseUrl: string): string[] {
  const found: string[] = []
  const baseUrlObj = new URL(baseUrl)
  
  // Keywords that indicate career-related pages
  const relevantKeywords = [
    // Careers
    'career', 'careers', 'job', 'jobs', 'join', 'join-us', 'work', 'working',
    'hiring', 'hire', 'recruit', 'recruitment', 'opportunities', 'opportunity',
    'openings', 'positions', 'vacancies', 'apply',
    // Programs
    'graduate', 'graduates', 'grad', 'intern', 'interns', 'internship', 'internships',
    'entry-level', 'junior', 'associate', 'apprentice', 'trainee', 'placement',
    'early-career', 'early-careers', 'campus', 'university', 'student',
    // Teams
    'team', 'teams', 'engineering', 'technology', 'tech', 'product', 'design',
    'data', 'research', 'quant', 'quantitative', 'trading', 'investment',
    'operations', 'business', 'people', 'talent',
    // Culture
    'culture', 'values', 'about', 'about-us', 'who-we-are', 'life', 'life-at',
    'benefits', 'perks', 'why', 'why-join', 'diversity', 'inclusion',
    'mission', 'vision', 'story', 'our-story',
    // Locations
    'location', 'locations', 'office', 'offices', 'london', 'new-york', 'singapore',
  ]

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return

    try {
      const fullUrl = new URL(href, baseUrl).href
      const urlObj = new URL(fullUrl)

      // Same domain only
      if (urlObj.hostname !== baseUrlObj.hostname) return
      
      // Skip files
      if (/\.(pdf|doc|docx|png|jpg|jpeg|gif|svg|mp4|mp3|zip)$/i.test(urlObj.pathname)) return

      // Check if URL contains relevant keywords
      const lowerUrl = fullUrl.toLowerCase()
      const isRelevant = relevantKeywords.some(kw => lowerUrl.includes(kw))

      if (isRelevant && !found.includes(fullUrl) && fullUrl !== baseUrl) {
        found.push(fullUrl)
      }
    } catch {
      // Invalid URL, skip
    }
  })

  // Return more subpages for comprehensive scraping
  return found.slice(0, 20)
}

/* -------------------------------------------------------------------------- */
/*                              Fetch Function                                 */
/* -------------------------------------------------------------------------- */

async function fetchPage(url: string): Promise<{ $: CheerioAPI; html: string } | null> {
  try {
    console.log(`  📄 Fetching: ${url}`)
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeout)

    if (!res.ok) {
      console.log(`  ❌ HTTP ${res.status}`)
      return null
    }

    const html = await res.text()
    const $ = load(html)

    return { $, html }
  } catch (err) {
    console.error(`  ❌ Failed: ${url}`, err instanceof Error ? err.message : err)
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*                              Main Scraper                                   */
/* -------------------------------------------------------------------------- */

export async function scrapeCareerPage(url: string, deep: boolean = true): Promise<ScrapedCompanyData | null> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔍 SCRAPING: ${url}`)
  console.log(`   Deep mode: ${deep}`)
  console.log(`${'='.repeat(60)}`)

  // Fetch main page
  const mainResult = await fetchPage(url)
  if (!mainResult) {
    console.log('❌ Failed to fetch main page')
    return null
  }

  const { $: $main } = mainResult
  const name = extractCompanyName(url, $main)
  const description = $main('meta[name="description"]').attr('content') || 
                      $main('meta[property="og:description"]').attr('content') || ''

  // Get full text from main page
  const mainPageContent = getFullPageText($main)
  console.log(`   ✅ Main page: ${mainPageContent.length} characters`)

  // Collect all content
  let allContent = mainPageContent
  const subPages: SubPageData[] = []

  // Deep scrape subpages
  if (deep) {
    const subUrls = findAllRelevantLinks($main, url)
    console.log(`   📑 Found ${subUrls.length} relevant subpages`)

    for (const subUrl of subUrls) {
      // Be polite - wait between requests
      await new Promise(r => setTimeout(r, 600))

      const subResult = await fetchPage(subUrl)
      if (subResult) {
        const { $: $sub } = subResult
        const subContent = getFullPageText($sub)
        
        // Get page title
        const subTitle = $sub('title').text().split(/[|\-–]/)[0].trim() || 
                         $sub('h1').first().text().trim() || 
                         subUrl.split('/').filter(Boolean).pop() || 
                         'Untitled'

        subPages.push({
          url: subUrl,
          title: subTitle,
          content: subContent
        })

        // Add to combined content with separator
        allContent += `\n\n--- PAGE: ${subTitle} (${subUrl}) ---\n\n${subContent}`
        
        console.log(`   ✅ ${subTitle}: ${subContent.length} chars`)
      }
    }
  }

  const totalCharacters = allContent.length
  const totalPages = subPages.length + 1

  console.log(`\n   📊 TOTAL: ${totalCharacters.toLocaleString()} characters from ${totalPages} pages`)
  console.log(`${'='.repeat(60)}\n`)

  return {
    name,
    url,
    description: description.slice(0, 1000),
    mainPageContent,
    allContent,
    subPages,
    totalCharacters,
    totalPages,
    scrapedAt: new Date(),
  }
}

/* -------------------------------------------------------------------------- */
/*                          Multi-page Scraper                                 */
/* -------------------------------------------------------------------------- */

export async function scrapeMultiplePages(urls: string[], deep: boolean = true): Promise<ScrapedCompanyData[]> {
  const results: ScrapedCompanyData[] = []

  for (const url of urls) {
    const data = await scrapeCareerPage(url, deep)
    if (data) results.push(data)
    
    // Wait between different companies
    await new Promise(r => setTimeout(r, 2000))
  }

  return results
}