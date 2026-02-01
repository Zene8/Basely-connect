import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const companies = await prisma.company.findMany()

    // Parse JSON strings back to arrays
    const formattedCompanies = companies.map(c => ({
      ...c,
      languages: JSON.parse(c.languages || '[]'),
      frameworks: JSON.parse(c.frameworks || '[]'),
      skills: JSON.parse(c.skills || '[]'),
      locations: JSON.parse(c.locations || '[]'),
      roleTypes: JSON.parse(c.roleTypes || '[]')
    }))

    return NextResponse.json(formattedCompanies)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
