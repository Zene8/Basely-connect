import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const companies = [
      {
        name: 'TechFlow Solutions',
        industry: 'Fintech',
        description: 'A leading fintech company modernizing payment gateways.',
        website: 'https://techflow.example.com/careers',
        skills: JSON.stringify(['React', 'Node.js', 'AWS', 'PostgreSQL']),
        languages: JSON.stringify(['TypeScript', 'JavaScript', 'SQL']),
        frameworks: JSON.stringify(['Next.js', 'Express']),
        experience: '3+ years',
        contributions: 'Open source contributions to fintech libraries appreciated.'
      },
      {
        name: 'CreativePixels',
        industry: 'Digital Agency',
        description: 'Award-winning creative agency building immersive web experiences.',
        website: 'https://creativepixels.example.com/apply',
        skills: JSON.stringify(['Vue.js', 'CSS', 'Animation', 'Three.js']),
        languages: JSON.stringify(['JavaScript', 'GLSL']),
        frameworks: JSON.stringify(['Nuxt.js', 'TailwindCSS']),
        experience: '1+ years',
        contributions: 'Portfolio required.'
      },
      {
        name: 'DataMinds AI',
        industry: 'Artificial Intelligence',
        description: 'Building the next generation of predictive models.',
        website: 'https://dataminds.example.com/jobs',
        skills: JSON.stringify(['PyTorch', 'TensorFlow', 'Data Pipelines', 'Docker']),
        languages: JSON.stringify(['Python', 'C++']),
        frameworks: JSON.stringify(['FastAPI', 'Keras']),
        experience: '4+ years',
        contributions: 'Research papers or Kaggle competitions.'
      },
      {
        name: 'SolidSystems',
        industry: 'Enterprise Software',
        description: 'Reliable backend systems for global logistics.',
        website: 'https://solidsystems.example.com/careers',
        skills: JSON.stringify(['Spring Boot', 'Microservices', 'Kafka']),
        languages: JSON.stringify(['Java', 'Kotlin']),
        frameworks: JSON.stringify(['Spring Cloud', 'Hibernate']),
        experience: '5+ years',
        contributions: 'Evidence of handling high-scale systems.'
      },
      {
        name: 'CloudScale',
        industry: 'Cloud Infrastructure',
        description: 'Infrastructure as code and developer tooling.',
        website: 'https://cloudscale.example.com/join',
        skills: JSON.stringify(['Kubernetes', 'Terraform', 'CI/CD']),
        languages: JSON.stringify(['Go', 'Rust', 'Bash']),
        frameworks: JSON.stringify(['Gin', 'Actix']),
        experience: '3+ years',
        contributions: 'contributions to CNCF projects.'
      }
    ]

    let count = 0
    for (const company of companies) {
      const exists = await prisma.company.findFirst({ where: { name: company.name } })
      if (!exists) {
        await prisma.company.create({ data: company })
        count++
      }
    }

    return NextResponse.json({ success: true, message: `Seeded ${count} companies.` })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
