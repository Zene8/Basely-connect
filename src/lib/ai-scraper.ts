// src/lib/ai-scraper.ts
import OpenAI from 'openai'
import { scrapeCareerPage, ScrapedCompanyData } from './scraper'

/**
 * AI-enhanced company data with structured output
 */
export interface AIEnhancedCompanyData {
  name: string
  url: string
  industry: string
  description: string
  languages: string[]
  frameworks: string[]
  skills: string[]
  qualities: string[]
  lookingFor: string
}

/**
 * Use OpenAI to analyze scraped data and extract structured information
 */
export async function enhanceWithAI(
  scrapedData: ScrapedCompanyData
): Promise<AIEnhancedCompanyData> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const rawText = scrapedData.allContent || scrapedData.mainPageContent || ''
  const detectedLanguages = (scrapedData as unknown as { languages?: string[] }).languages || []
  const detectedFrameworks = (scrapedData as unknown as { frameworks?: string[] }).frameworks || []
  const detectedSkills = (scrapedData as unknown as { skills?: string[] }).skills || []
  const detectedQualities = (scrapedData as unknown as { qualities?: string[] }).qualities || []

  const prompt = `
You are analyzing a company's career page. Based on the scraped content, extract:

1. Industry (e.g., "Fintech", "AI/ML", "Trading", "Cybersecurity")
2. A 2-sentence company description
3. Programming languages they use (from the text)
4. Frameworks/tools they use
5. Technical skills they're looking for
6. Personal qualities they value (e.g., "teamwork", "leadership")
7. A brief summary of what they look for in candidates

Company: ${scrapedData.name}
URL: ${scrapedData.url}

Raw text from career page:
${rawText.slice(0, 8000)}

Already detected:
- Languages: ${detectedLanguages.join(', ')}
- Frameworks: ${detectedFrameworks.join(', ')}
- Skills: ${detectedSkills.join(', ')}
- Qualities: ${detectedQualities.join(', ')}

Respond in JSON format:
{
  "industry": "...",
  "description": "...",
  "languages": ["...", "..."],
  "frameworks": ["...", "..."],
  "skills": ["...", "..."],
  "qualities": ["...", "..."],
  "lookingFor": "..."
}
`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a recruitment data analyzer. Extract structured company information from career pages. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    return {
      name: scrapedData.name,
      url: scrapedData.url,
      industry: result.industry || 'Technology',
      description: result.description || rawText.slice(0, 200),
      languages: result.languages || detectedLanguages,
      frameworks: result.frameworks || detectedFrameworks,
      skills: result.skills || detectedSkills,
      qualities: result.qualities || detectedQualities,
      lookingFor: result.lookingFor || 'See career page for details.',
    }
  } catch (error) {
    console.error('AI enhancement failed:', error)
    // Fallback to scraped data
    return {
      name: scrapedData.name,
      url: scrapedData.url,
      industry: 'Technology',
      description: rawText.slice(0, 200),
      languages: detectedLanguages,
      frameworks: detectedFrameworks,
      skills: detectedSkills,
      qualities: detectedQualities,
      lookingFor: 'See career page for details.',
    }
  }
}

/**
 * Scrape a URL and enhance with AI
 */
export async function scrapeWithAI(url: string): Promise<AIEnhancedCompanyData | null> {
  const scrapedData = await scrapeCareerPage(url)
  if (!scrapedData) return null

  return enhanceWithAI(scrapedData)
}

/**
 * Scrape multiple URLs with AI enhancement
 */
export async function scrapeMultipleWithAI(
  urls: string[]
): Promise<AIEnhancedCompanyData[]> {
  const results: AIEnhancedCompanyData[] = []

  for (const url of urls) {
    console.log(`🤖 AI-scraping ${url}`)
    const data = await scrapeWithAI(url)
    if (data) {
      results.push(data)
    }

    // Rate limiting - be polite to websites and OpenAI
    await new Promise((r) => setTimeout(r, 2000))
  }

  return results
}
