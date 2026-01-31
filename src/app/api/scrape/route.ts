// src/app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { scrapeCareerPage, scrapeMultiplePages } from '@/lib/scraper';

// Allow longer execution time for deep scraping
export const maxDuration = 120; // 2 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, url, deep = true } = body;

    const urlList: string[] = urls || (url ? [url] : []);

    if (urlList.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting scrape for ${urlList.length} URL(s)`);
    console.log(`   Deep scraping: ${deep}`);
    console.log(`${'='.repeat(60)}\n`);

    const results = await scrapeMultiplePages(urlList, deep);

    const totalChars = results.reduce((acc, r) => acc + r.totalCharacters, 0);
    const totalPages = results.reduce((acc, r) => acc + r.totalPages, 0);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SCRAPE COMPLETE`);
    console.log(`   Companies: ${results.length}`);
    console.log(`   Total pages: ${totalPages}`);
    console.log(`   Total characters: ${totalChars.toLocaleString()}`);
    console.log(`${'='.repeat(60)}\n`);

    return NextResponse.json({
      success: true,
      count: results.length,
      totalPages,
      totalCharacters: totalChars,
      data: results,
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const deep = request.nextUrl.searchParams.get('deep') !== 'false';

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  const result = await scrapeCareerPage(url, deep);

  if (!result) {
    return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 });
  }

  return NextResponse.json(result);
}