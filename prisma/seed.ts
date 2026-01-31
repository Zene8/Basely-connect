import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const companies = [
  {
    name: 'TechFlow Solutions',
    industry: 'Fintech',
    description: 'A leading fintech company modernizing payment gateways.',
    requiredSkills: JSON.stringify(['React', 'Node.js', 'AWS', 'PostgreSQL']),
    preferredLangs: JSON.stringify(['TypeScript', 'JavaScript', 'SQL']),
    minExperience: 3,
    culture: 'Fast-paced, innovative, remote-first'
  },
  {
    name: 'CreativePixels',
    industry: 'Digital Agency',
    description: 'Award-winning creative agency building immersive web experiences.',
    requiredSkills: JSON.stringify(['Vue.js', 'CSS', 'Animation', 'Three.js']),
    preferredLangs: JSON.stringify(['JavaScript', 'GLSL']),
    minExperience: 1,
    culture: 'Artistic, collaborative, design-focused'
  },
  {
    name: 'DataMinds AI',
    industry: 'Artificial Intelligence',
    description: 'Building the next generation of predictive models.',
    requiredSkills: JSON.stringify(['PyTorch', 'TensorFlow', 'Data Pipelines', 'Docker']),
    preferredLangs: JSON.stringify(['Python', 'C++']),
    minExperience: 4,
    culture: 'Research-oriented, academic, rigorous'
  },
  {
    name: 'SolidSystems',
    industry: 'Enterprise Software',
    description: 'Reliable backend systems for global logistics.',
    requiredSkills: JSON.stringify(['Spring Boot', 'Microservices', 'Kafka']),
    preferredLangs: JSON.stringify(['Java', 'Kotlin']),
    minExperience: 5,
    culture: 'Structured, stable, clear career ladder'
  },
  {
    name: 'CloudScale',
    industry: 'Cloud Infrastructure',
    description: 'Infrastructure as code and developer tooling.',
    requiredSkills: JSON.stringify(['Kubernetes', 'Terraform', 'CI/CD']),
    preferredLangs: JSON.stringify(['Go', 'Rust', 'Bash']),
    minExperience: 3,
    culture: 'Engineering-led, open-source friendly'
  }
]

async function main() {
  console.log(`Start seeding ...`)
  for (const company of companies) {
    const exists = await prisma.company.findFirst({ where: { name: company.name } })
    if (!exists) {
        const user = await prisma.company.create({
        data: company,
        })
        console.log(`Created company: ${user.name}`)
    }
  }
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })