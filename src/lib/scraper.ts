import { load, CheerioAPI } from 'cheerio'

export interface SubPageData {
  url: string
  title: string
  content: string
}

export interface ScrapedCompanyData {
  name: string
  url: string
  description: string
  mainPageContent: string
  allContent: string
  subPages: SubPageData[]
  totalCharacters: number
  totalPages: number
  scrapedAt: Date
}

function extractCompanyName(url: string, $: CheerioAPI): string {
  const ogName = $('meta[property="og:site_name"]').attr('content')
  if (ogName && ogName.length > 2 && ogName.length < 50) return ogName.trim()
  const title = $('title').text()
  const parts = title.split(/[|\-–—:]/)
  if (parts.length > 1) {
    const last = parts[parts.length - 1].trim()
    if (last.length > 2 && last.length < 40) return last
  }
  try {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0]
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch { return 'Unknown' }
}

function cleanText(text: string): string {
  return text.replace(/[\t]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/[ ]{2,}/g, ' ').trim()
}

function getFullPageText($: CheerioAPI): string {
  $('script, style, noscript, iframe, svg, img, video, audio, nav, header, footer').remove()
  $('[class*="cookie"], [class*="consent"], [class*="popup"], [class*="modal"]').remove()
  return cleanText($('body').text())
}

function findRelevantLinks($: CheerioAPI, baseUrl: string): string[] {
  const found: string[] = []
  const baseHost = new URL(baseUrl).hostname
  const keywords = ['career', 'job', 'join', 'team', 'work', 'graduate', 'intern', 'culture', 'benefit', 'about', 'people', 'technology', 'engineering']
  
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return
    try {
      const fullUrl = new URL(href, baseUrl).href
      if (new URL(fullUrl).hostname !== baseHost) return
      if (keywords.some(kw => fullUrl.toLowerCase().includes(kw)) && !found.includes(fullUrl) && fullUrl !== baseUrl) {
        found.push(fullUrl)
      }
    } catch {}
  })
  return found.slice(0, 15)
}

async function fetchPage(url: string): Promise<CheerioAPI | null> {
  try {
    console.log(`  📄 Fetching: ${url}`)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    return load(await res.text())
  } catch (err) {
    console.error(`  ❌ Failed: ${url}`)
    return null
  }
}

export async function scrapeCareerPage(url: string, deep: boolean = true): Promise<ScrapedCompanyData | null> {
  console.log(`\n🔍 Scraping: ${url}`)
  
  const $main = await fetchPage(url)
  if (!$main) return null

  const name = extractCompanyName(url, $main)
  const description = $main('meta[name="description"]').attr('content') || ''
  const mainPageContent = getFullPageText($main)
  
  let allContent = mainPageContent
  const subPages: SubPageData[] = []

  if (deep) {
    const subUrls = findRelevantLinks($main, url)
    console.log(`  📑 Found ${subUrls.length} subpages`)

    for (const subUrl of subUrls) {
      await new Promise(r => setTimeout(r, 500))
      const $sub = await fetchPage(subUrl)
      if ($sub) {
        const content = getFullPageText($sub)
        const title = $sub('title').text().split(/[|\-–]/)[0].trim() || 'Page'
        subPages.push({ url: subUrl, title, content })
        allContent += `\n\n--- ${title} ---\n\n${content}`
        console.log(`  ✅ ${title}: ${content.length} chars`)
      }
    }
  }

  const totalCharacters = allContent.length
  const totalPages = subPages.length + 1

  console.log(`  📊 Total: ${totalCharacters} chars from ${totalPages} pages`)

  return {
    name,
    url,
    description,
    mainPageContent,
    allContent,
    subPages,
    totalCharacters,
    totalPages,
    scrapedAt: new Date(),
  }
}

export async function scrapeMultiplePages(urls: string[], deep: boolean = true): Promise<ScrapedCompanyData[]> {
  const results: ScrapedCompanyData[] = []
  for (const url of urls) {
    const data = await scrapeCareerPage(url, deep)
    if (data) results.push(data)
    await new Promise(r => setTimeout(r, 1500))
  }
  return results
}
