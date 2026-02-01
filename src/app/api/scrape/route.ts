// src/app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { scrapeAndSave, loadFromJson } from '@/lib/scraper'

export const maxDuration = 300 // 5 minutes for thorough scraping

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls, deep = true } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
    }

    const validUrls = urls.filter((u: string) => u && u.startsWith('http'))

    if (validUrls.length === 0) {
      return NextResponse.json({ error: 'No valid URLs' }, { status: 400 })
    }

    console.log(`\n🚀 API: Scraping ${validUrls.length} URLs...`)

    const database = await scrapeAndSave(validUrls, deep)

    return NextResponse.json({
      success: true,
      message: `Scraped ${database.totalCompanies} companies`,
      lastUpdated: database.lastUpdated,
      totalCompanies: database.totalCompanies,
      companies: database.companies,
    })

  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: 'Scraping failed', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const database = await loadFromJson()

    if (!database) {
      return NextResponse.json({
        success: false,
        message: 'No data found',
        companies: [],
      })
    }

    return NextResponse.json({
      success: true,
      lastUpdated: database.lastUpdated,
      totalCompanies: database.totalCompanies,
      companies: database.companies,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load', details: String(error) },
      { status: 500 }
    )
  }
}