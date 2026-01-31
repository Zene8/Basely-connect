// src/lib/scraper.ts
import * as cheerio from 'cheerio';

export interface ScrapedCompanyData {
  name: string;
  url: string;
  languages: string[];
  frameworks: string[];
  skills: string[];
  qualities: string[];
  rawText: string;
  scrapedAt: Date;
}

// Common tech keywords to look for
const LANGUAGES = [
  'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Rust', 'Go', 'Golang',
  'Scala', 'Kotlin', 'Ruby', 'PHP', 'Swift', 'R', 'MATLAB', 'SQL', 'Bash', 'Shell',
  'Perl', 'Haskell', 'Elixir', 'Clojure', 'F#', 'OCaml', 'Julia', 'Dart', 'Lua'
];

const FRAMEWORKS = [
  'React', 'Next.js', 'NextJS', 'Vue', 'Angular', 'Svelte', 'Node.js', 'NodeJS',
  'Express', 'FastAPI', 'Django', 'Flask', 'Spring', 'Spring Boot', '.NET',
  'Rails', 'Ruby on Rails', 'Laravel', 'Pytorch', 'PyTorch', 'TensorFlow',
  'Keras', 'Pandas', 'NumPy', 'Scikit-learn', 'Spark', 'Apache Spark',
  'Kafka', 'RabbitMQ', 'Redis', 'MongoDB', 'PostgreSQL', 'MySQL', 'GraphQL',
  'REST', 'gRPC', 'Kubernetes', 'K8s', 'Docker', 'AWS', 'Azure', 'GCP',
  'Terraform', 'Ansible', 'Jenkins', 'GitLab', 'Electron', 'React Native',
  'Flutter', 'Unity', 'Unreal', 'OpenGL', 'WebGL', 'Three.js', 'D3.js',
  'Polars', 'dbt', 'Airflow', 'Snowflake', 'Databricks', 'Neo4j'
];

const SKILLS = [
  'Machine Learning', 'ML', 'Deep Learning', 'AI', 'Artificial Intelligence',
  'Data Science', 'Data Engineering', 'Data Analysis', 'NLP', 'Computer Vision',
  'DevOps', 'MLOps', 'CI/CD', 'Microservices', 'System Design', 'API Design',
  'Cloud Computing', 'Distributed Systems', 'Blockchain', 'Cryptography',
  'Cybersecurity', 'Security', 'Networking', 'Databases', 'Backend', 'Frontend',
  'Full Stack', 'Mobile Development', 'Web Development', 'Embedded Systems',
  'Quantitative', 'Algorithmic Trading', 'High Frequency Trading', 'HFT',
  'Statistics', 'Mathematics', 'Linear Algebra', 'Probability', 'Optimization',
  'Agile', 'Scrum', 'Testing', 'QA', 'Unit Testing', 'Integration Testing'
];

const QUALITIES = [
  'team player', 'teamwork', 'collaboration', 'collaborative', 'communication',
  'leadership', 'leader', 'ownership', 'proactive', 'proactivity', 'driven',
  'motivated', 'motivation', 'passionate', 'passion', 'curiosity', 'curious',
  'problem solving', 'problem-solving', 'analytical', 'critical thinking',
  'creative', 'creativity', 'innovative', 'innovation', 'entrepreneurial',
  'fast-paced', 'adaptable', 'flexible', 'resilient', 'integrity', 'honest',
  'empathy', 'growth mindset', 'self-starter', 'autonomous', 'independent',
  'detail-oriented', 'organized', 'time management', 'mentorship', 'mentor'
];

function extractKeywords(text: string, keywords: string[]): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    // Use word boundary matching to avoid partial matches
    const regex = new RegExp(`\\b${keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      // Normalize the keyword (use the original casing from our list)
      if (!found.includes(keyword)) {
        found.push(keyword);
      }
    }
  }
  
  return found;
}

function extractCompanyName(url: string, $: cheerio.CheerioAPI): string {
  // Try to get from title or meta tags
  const title = $('title').text().split(/[|\-–]/)[0].trim();
  if (title && title.length < 50) return title;
  
  // Try og:site_name
  const siteName = $('meta[property="og:site_name"]').attr('content');
  if (siteName) return siteName;
  
  // Fall back to domain name
  try {
    const domain = new URL(url).hostname.replace('www.', '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Company';
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[^\w\s.,!?;:()\-]/g, ' ')  // Remove special chars
    .trim();
}

export async function scrapeCareerPage(url: string): Promise<ScrapedCompanyData | null> {
  try {
    console.log(`Scraping: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script, style, nav, footer elements
    $('script, style, nav, footer, header, noscript, iframe').remove();
    
    // Get main content areas (careers pages often have these)
    const contentSelectors = [
      'main',
      '[class*="career"]',
      '[class*="job"]',
      '[id*="career"]',
      '[id*="job"]',
      'article',
      '.content',
      '#content',
      'body'
    ];
    
    let pageText = '';
    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > pageText.length) {
        pageText = content;
      }
    }
    
    pageText = cleanText(pageText);
    
    // Extract data
    const companyName = extractCompanyName(url, $);
    const languages = extractKeywords(pageText, LANGUAGES);
    const frameworks = extractKeywords(pageText, FRAMEWORKS);
    const skills = extractKeywords(pageText, SKILLS);
    const qualities = extractKeywords(pageText, QUALITIES);
    
    return {
      name: companyName,
      url,
      languages,
      frameworks,
      skills,
      qualities,
      rawText: pageText.substring(0, 10000), // Store first 10k chars
      scrapedAt: new Date(),
    };
    
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}

export async function scrapeMultiplePages(urls: string[]): Promise<ScrapedCompanyData[]> {
  const results: ScrapedCompanyData[] = [];
  
  // Scrape sequentially with a delay to be respectful
  for (const url of urls) {
    const data = await scrapeCareerPage(url);
    if (data) {
      results.push(data);
    }
    // Wait 1 second between requests
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return results;
}
