// src/lib/companies.ts
// Utility to load scraped company data from the JSON file

import { promises as fs } from 'fs'
import path from 'path'

export interface CompanyData {
  id: string
  name: string
  url: string
  description: string
  allContent: string
  totalCharacters: number
  totalPages: number
  scrapedAt: string
}

export interface CompaniesDB {
  lastUpdated: string
  totalCompanies: number
  companies: CompanyData[]
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'companies.json')

// Load all companies from JSON
export async function getCompanies(): Promise<CompanyData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const db: CompaniesDB = JSON.parse(data)
    return db.companies || []
  } catch {
    return []
  }
}

// Get a single company by ID
export async function getCompanyById(id: string): Promise<CompanyData | null> {
  const companies = await getCompanies()
  return companies.find(c => c.id === id) || null
}

// Get a single company by name (case insensitive)
export async function getCompanyByName(name: string): Promise<CompanyData | null> {
  const companies = await getCompanies()
  return companies.find(c => c.name.toLowerCase() === name.toLowerCase()) || null
}

// Get all company names
export async function getCompanyNames(): Promise<string[]> {
  const companies = await getCompanies()
  return companies.map(c => c.name)
}

// Get the raw content for a company (for OpenAI processing)
export async function getCompanyContent(id: string): Promise<string | null> {
  const company = await getCompanyById(id)
  return company?.allContent || null
}

// Get last update time
export async function getLastUpdated(): Promise<string | null> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const db: CompaniesDB = JSON.parse(data)
    return db.lastUpdated
  } catch {
    return null
  }
}

// Check if data exists
export async function hasData(): Promise<boolean> {
  const companies = await getCompanies()
  return companies.length > 0
}