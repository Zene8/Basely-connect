import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Interfaces matching our sources
interface LocalLogoItem {
    name: string;
    logoUrl?: string; // e.g., "src/data/MW.png"
    careersUrl?: string; // Some have this instead
}

interface LocalLogoJson {
    companies: LocalLogoItem[];
}

interface JsonCompany {
    id: string; // usually UUID from original file, we might generate new IDs or keep them
    name: string;
    url: string;
    description: string;
    mainPageContent?: string;
    compensation?: string;
    benefits?: string;
    locations?: string[];
    roleTypes?: string[];
}

interface JsonData {
    companies: JsonCompany[];
}

interface ExcelRow {
    'Name of Company'?: string;
    'Langauges(JS, Python, C etc)'?: string;
    'Frameworks and Libraries (React, Pytorch)'?: string;
    'Personal Qualities (e.g. time management, leadership, team player, research). Seperate with comma + space'?: string;
    'Any other technical skills?'?: string;
    'What seperates you from other companies here?'?: string;
    'Anything else you look for in canidates?'?: string;
}

// Final DB Interface
interface DBCompany {
    id: number;
    name: string;
    logo: string; // URL path e.g., "/logos/MW.png"
    industry: string;
    description: string;
    color: string;
    website: string;
    languages: string[];
    frameworks: string[];
    skills: string[];
    experience: string;
    contributions: string;
    lookingFor: string;
    // Enriched
    compensation: string;
    benefits: string;
    locations: string[];
    roleTypes: string[];
}

const normalize = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const cleanArray = (str: string | undefined): string[] => {
    if (!str) return [];
    return str.split(/,\s*|\s+and\s+|\s*\n\s*/).map(s => s.trim()).filter(Boolean);
};

// Map manual corrections for names
const nameCorrections: Record<string, string> = {
    "Taking note app for Ipad": "Goodnotes",
    "Open positions": "Jump Trading",
    "Taking note app for Ipad ": "Goodnotes",
    "Open positions ": "Jump Trading",
    "Balyasny": "Balyasny Asset Management",
    "Qube Research and Technologies": "Qube Research & Technologies (QRT)",
    "QRT": "Qube Research & Technologies (QRT)"
};
const websiteMap: Record<string, string> = {
    "Goodnotes": "https://www.goodnotes.com",
    "Jump Trading": "https://www.jumptrading.com"
};

// DATA ENRICHMENT (Researched from Internet)
const manualEnrichment: Record<string, Partial<DBCompany>> = {
    "Jump Trading": {
        description: "Jump Trading is a global research and technology-driven proprietary trading firm. We utilize advanced algorithms, high-performance computing, and massive datasets to trade across all major asset classes. Our culture combines the intellectual rigor of a research lab with the fast-paced intensity of a trading floor.",
        lookingFor: "We look for world-class problem solvers with deep expertise in C++, Python, and distributed systems. Candidates should thrive in a competitive environment, possess strong mathematical foundations, and demonstrate intellectual honesty. We value low-ego collaboration and improved outcomes over individual credit.",
        benefits: "- **Elite Compensation**: Top-tier base + performance-based bonuses.\n- **Health**: Fully paid premium medical, dental, vision.\n- **Offices**: State-of-the-art workspaces in Chicago, NY, London, Singapore, Shanghai.\n- **Perks**: Catered meals, on-site gyms, casual dress code, continuous learning budget.",
        languages: ["C++", "Python", "Go"],
        frameworks: ["Low-latency Linux", "NumPy", "Pandas", "PyTorch", "FPGA"]
    },
    "Optiver": {
        description: "Optiver is a leading global market maker with a mission to improve the market. We provide liquidity to financial markets using our own capital, at our own risk. Trading at the speed of light, we build sophisticated in-house software and connect to the world's major financial exchanges.",
        lookingFor: "We seek critical thinkers who enjoy complex problem solving. Whether you are a Trader, Researcher, or Engineer, you need a competitive spirit, rapid decision-making skills, and a collaborative mindset. We foster a flat culture where the best idea wins, regardless of seniority.",
        benefits: "- **Profit Sharing**: Significant bonus potential based on firm performance.\n- **Lifestyle**: Breakfast, lunch, and dinner provided by in-house chefs.\n- **Wellness**: Weekly massages, free gym memberships, personal training.\n- **Global Mobility**: Opportunities to work in Amsterdam, Chicago, Sydney, London.",
        languages: ["C++", "Python", "C#", "Java"],
        frameworks: ["Linux", "FPGA", "React", "Docker", "Kubernetes"]
    },
    "Citadel": {
        description: "Citadel is one of the world's most profitable hedge funds, while Citadel Securities is a leading global market maker. We deploy capital to capture market opportunities with speed and precision. Our teams build and deploy powerful trading algorithms and systems that drive the global economy.",
        lookingFor: "We hire the top 1% of talent. You must be exceptionally driven, competitive, and technically brilliant. We value resilience, ownership, and the ability to deliver under pressure. Proficiency in modern C++ and distributed systems is often required for engineering roles.",
        benefits: "- **Top Compensation**: Industry-leading pay and bonuses.\n- **Perks**: Free catered meals, on-site medical concierge, museum passes.\n- **Growth**: Citadel University, unparalleled mentorship from industry veterans.\n- **Events**: Global offsites, team outings, hackathons.",
        languages: ["C++", "Python", "Slang"],
        frameworks: ["Kubernetes", "Kafka", "React", "Angular", "Distributed Systems"]
    },
    "Wintermute": {
        description: "Wintermute is a leading algorithmic liquidity provider for digital assets. We create liquid and efficient markets on centralized and decentralized exchanges and trading platforms. We are a hyper-growth startup culture bridging the gap between traditional high-frequency trading and the crypto world.",
        lookingFor: "We need crypto-native engineers and traders who love DeFi and Web3. You should be adaptable, entrepreneurial, and ready to ship code that handles billions in volume. Experience with Solidity, Rust, and Python is highly valued.",
        benefits: "- **Ownership**: Equity options in a high-growth crypto unicorn.\n- **Culture**: Meritocratic, non-hierarchical, fast-paced choice of tech stack.\n- **Flexibility**: Hybrid work model, annual retreats, crypto-native perks.\n- **Health**: Private insurance, gym stipends.",
        languages: ["Python", "Rust", "TypeScript", "Solidity", "C++"],
        frameworks: ["Web3.js", "Ethers.js", "React", "Node.js", "DeFi Protocols"]
    },
    "JetBrains": {
        description: "JetBrains creates intelligent software development tools used by over 10 million professionals. We are the creators of IntelliJ IDEA, PyCharm, and the Kotlin programming language. Our tools automate routine checks and corrections, allowing developers to focus on the creative side of software engineering.",
        lookingFor: "We look for passionate engineers who care deeply about developer experience. If you love building tools, compilers, or IDE plugins, this is the place. We value autonomy, craftsmanship, and 'eating your own dog food'—using our tools to build our tools.",
        benefits: "- **Freedom**: Flexible schedules, remote-friendly culture.\n- **Learning**: Hackathons, 20% time for personal projects, conference budgets.\n- **Wellbeing**: Ergonomic workspaces, health insurance, free lunches.\n- **Impact**: Your work directly improves the lives of millions of developers.",
        languages: ["Java", "Kotlin", "C#", "C++"],
        frameworks: ["Swing", "Compose Multiplatform", "IntelliJ Platform", "Ktor"]
    },
    "Anthropic": {
        description: "Anthropic is an AI safety and research company. We build reliable, interpretable, and steerable AI systems, including Claude. Our mission is to ensure transformative AI helps people and society flourish.",
        lookingFor: "We seek researchers and engineers who care deeply about AI safety and alignment. You should be expert in deep learning scaling, large language models, or interpretability. A strong moral compass and ability to work on open-ended research problems are essential.",
        benefits: "- **Mission-Driven**: Work on the frontier of AI alignment.\n- **Compensation**: Top-tier tech salaries and equity.\n- **Environment**: Collaborative research culture, focus on long-term safety.\n- **Perks**: Catered meals, unlimited PTO, comprehensive health/dental.",
        languages: ["Python", "Rust"],
        frameworks: ["PyTorch", "JAX", "Kubernetes", "React", "AWS"]
    },
    "Goodnotes": {
        description: "Goodnotes is the world's most popular digital paper app. We are reimagining how people take notes, study, and collaborate. AI is at the core of our future, transforming handwriting into structured knowledge.",
        lookingFor: "We want engineers who are user-obsessed and love iOS/Apple ecosystems. Experience with Swift, Computer Vision, or ML on the edge is a huge plus. We value craftsmanship and attention to detail in UI/UX.",
        benefits: "- **Impact**: Best-in-class product used by millions of students and pros.\n- **Culture**: Remote-friendly, asynchronous work, diversity-focused.\n- **Perks**: Home office stipend, wellness budget, annual team offsites.\n- **Tech**: Work with latest Apple frameworks and ML technologies.",
        languages: ["Swift", "Objective-C", "C++", "Python"],
        frameworks: ["UIKit", "SwiftUI", "CoreML", "Metal", "React"]
    },
    "Balyasny Asset Management": {
        description: "Balyasny Asset Management (BAM) is a diversified global investment firm. We are a community of over 1,500 professionals across 15 offices. We operate across all asset classes and strategies, leveraging deep fundamental research and advanced quantitative methods.",
        lookingFor: "We value 'BAM Standard'—excellence in everything we do. We look for strong technical talent in Python, C++, and Cloud Engineering to support our trading desks. You must be collaborative, adaptable, and results-oriented.",
        benefits: "- **Compensation**: Competitive base + substantial performance bonuses.\n- **Growth**: BAM Institute for training, internal mobility opportunities.\n- **Wellness**: On-site medical, mental health resources, gym reimbursements.\n- **Community**: Philanthropic matching, employee resource groups.",
        languages: ["Python", "C++", "C#", "Java"],
        frameworks: ["Pandas", "AWS", "Azure", "React", "Kubernetes"]
    },
    // NEW ENRICHMENT FOR USER REQUEST
    "Qube Research & Technologies (QRT)": {
        description: "QRT is a global quantitative and systematic investment manager. We are a technology and data-driven organization applying a scientific approach to investing. Our culture is collaborative and research-heavy, blurring the lines between researchers, engineers, and traders. We operate as a 'machine-like' business where stability and automation are paramount.",
        lookingFor: "We need engineers who think like researchers. You should be comfortable with C++ and Python in a high-performance environment. We value intellectual curiosity and the ability to work across teams (infrastructure, data, research) without silos. Low-ego and high-collaboration are non-negotiable.",
        benefits: "- **Culture**: Academic, collaborative, 'less cutthroat' than competitors.\n- **Growth**: Flat structure with direct access to senior leadership.\n- **Perks**: Modern offices, strong work-life balance support for the industry.\n- **Tech**: Access to massive compute clusters and proprietary data sets.",
        languages: ["C++", "Python", "Java", "Go"],
        frameworks: ["Docker", "Kubernetes", "Cassandra", "React", "AWS"]
    },
    "Marshall Wace": {
        description: "Marshall Wace is a global alternative manager specializing in low-latency and fundamental equity strategies. Our 'MW TOPS' system allows us to crowd-source trading ideas from sell-side contributors globally. We are 'lean by design', meaning every technology project has a direct, measurable business impact. We believe 'a man plus a machine beats a machine'.",
        lookingFor: "We look for 'entrepreneurial technologists'. You should be ready to challenge consensus and drive change. We value full-stack capability—from understanding market data to building intuitive UI for PMs. Strong innovative spirit and integrity are required.",
        benefits: "- **Innovation**: Work on the award-winning MW TOPS system.\n- **Ownership**: High autonomy in a flat, lean structure.\n- **Compensation**: Meritocratic pay connected to your direct impact.\n- **Wellness**: Comprehensive health, gym, and social events.",
        languages: ["C#", "Python", "Java", "TypeScript"],
        frameworks: ["React", "Kafka", "SQL Server", "AWS", ".NET Core"]
    },
    "Hudson River Trading": {
        description: "HRT is a math and technology company disguised as a trading firm. We are 'Code First'—managed by coders, for coders. Our culture ('MERIT') values intellect over politics. We have a casual, relaxed environment where brilliant minds work on solving the hardest problems in finance using scientific methods.",
        lookingFor: "We hire 'Algo Developers', not just software engineers. You need strong C++17/20 skills and a deep understanding of OS internals and networking. We look for people who love low-level systems, distributed computing, and optimizing for nanoseconds.",
        benefits: "- **Lifestyle**: Casual dress, chef-prepared meals, fully stocked kitchens.\n- **Health**: On-site gyms (NYC) and premium fitness benefits.\n- **Community**: Frequent tech talks, game nights, hackathons.\n- **Vacation**: Generous PTO and respectful work-life balance.",
        languages: ["C++", "Python", "OCaml"],
        frameworks: ["Linux Kernel", "React", "Distributed Systems", "FPGA"]
    },
    "Palmify": {
        description: "Palmify is a forward-thinking student-led startup focused on AI-powered digital transformation. We are a remote-first, decentralized team of 'crypto-natives' and AI enthusiasts. We reject the 'office rat' culture in favor of global, asynchronous collaboration.",
        lookingFor: "We are looking for self-starters who love AI agents, Web3, and building products from scratch. You should be comfortable with Next.js, Vercel, and integrating LLMs. We want 'builders' who can ship fast and iterate based on user feedback.",
        benefits: "- **Flexibility**: Fully remote, work from anywhere.\n- **Ownership**: High impact in a small, fast-moving team.\n- **Tech**: Work with bleeding-edge AI and Crypto tech stacks.\n- **Culture**: Youthful, energetic, and rule-breaking.",
        languages: ["TypeScript", "Python", "Solidity"],
        frameworks: ["Next.js", "React", "Vercel", "OpenAI API", "TailwindCSS"]
    }
};

async function main() {
    console.log("Starting DB Generation...");

    // 1. Load Local Logos (src/data/.json)
    const logoJsonPath = path.join(process.cwd(), 'src', 'data', '.json');
    const logoRaw = fs.readFileSync(logoJsonPath, 'utf-8');
    const logoData = JSON.parse(logoRaw) as LocalLogoJson;

    // Map normalized name -> public URL
    const logoMap = new Map<string, string>();
    for (const item of logoData.companies) {
        const key = normalize(item.name);
        // Correct the path: src/data/X.png -> /logos/X.png
        // The user provided paths like "src/data/MW.png"
        const assetPath = item.logoUrl || item.careersUrl;
        if (assetPath) {
            const filename = path.basename(assetPath);
            const publicPath = `/logos/${filename}`;
            logoMap.set(key, publicPath);
        }
    }
    console.log(`Loaded ${logoMap.size} logos.`);

    // 2. Load Base Company Data (src/data/companies.json)
    const baseJsonPath = path.join(process.cwd(), 'src', 'data', 'companies.json');
    const baseRaw = fs.readFileSync(baseJsonPath, 'utf-8');
    const baseData = JSON.parse(baseRaw) as JsonData;
    console.log(`Loaded ${baseData.companies.length} base company profiles.`);

    // 3. Load Excel Data
    const excelPath = path.join(process.cwd(), 'Sponsor Skill Interest Survey (Responses).xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const excelRows = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName]);
    console.log(`Loaded ${excelRows.length} rows from Excel.`);

    // 4. Merge Data
    const mergedMap = new Map<string, Partial<DBCompany>>();

    // Helper to get or create entry
    const getEntry = (name: string) => {
        let correctedName = name.trim();
        if (nameCorrections[correctedName]) correctedName = nameCorrections[correctedName];

        const key = normalize(correctedName);
        if (!mergedMap.has(key)) {
            mergedMap.set(key, {
                name: correctedName,
                website: websiteMap[correctedName] || '',
                id: Math.floor(Math.random() * 1000000) // Temporary ID
            });
        }
        return mergedMap.get(key)!;
    };

    // Process Base JSON first (rich text)
    for (const comp of baseData.companies) {
        const entry = getEntry(comp.name);
        entry.website = comp.url || entry.website;
        entry.description = comp.description || comp.mainPageContent?.slice(0, 300) + '...';
        entry.compensation = comp.compensation;
        entry.benefits = comp.benefits;
        entry.locations = comp.locations;
        entry.roleTypes = comp.roleTypes;

        // Base arrays can be init here but Excel usually better for skills
        if (!entry.languages) entry.languages = [];
        if (!entry.frameworks) entry.frameworks = [];
        if (!entry.skills) entry.skills = [];
    }

    // Process Excel (skills authority)
    for (const row of excelRows) {
        const rawName = row['Name of Company'];
        if (!rawName) continue;

        const entry = getEntry(rawName);

        // Overwrite description if present in Excel? Or append? 
        // Excel "What seperates you..." is usually good context.
        if (row['What seperates you from other companies here?']) {
            entry.description = row['What seperates you from other companies here?'];
        }
        if (row['Anything else you look for in canidates?']) {
            entry.lookingFor = row['Anything else you look for in canidates?'];
        }

        const langs = cleanArray(row['Langauges(JS, Python, C etc)']);
        const frams = cleanArray(row['Frameworks and Libraries (React, Pytorch)']);
        const soft = cleanArray(row['Personal Qualities (e.g. time management, leadership, team player, research). Seperate with comma + space']);
        const other = cleanArray(row['Any other technical skills?']);

        // Merge unique
        entry.languages = Array.from(new Set([...(entry.languages || []), ...langs]));
        entry.frameworks = Array.from(new Set([...(entry.frameworks || []), ...frams]));
        entry.skills = Array.from(new Set([...(entry.skills || []), ...soft, ...other]));
    }

    // Process Manual Enrichment (Internet Research)
    for (const [name, extraData] of Object.entries(manualEnrichment)) {
        const entry = getEntry(name);
        // Prioritize manual data if existing is weak or append if rich
        if (extraData.description) {
            entry.description = (entry.description && entry.description.length > 50)
                ? entry.description + "\n\n" + extraData.description
                : extraData.description;
        }
        if (extraData.lookingFor) {
            entry.lookingFor = (entry.lookingFor && entry.lookingFor.length > 20)
                ? entry.lookingFor + "\n\n" + extraData.lookingFor
                : extraData.lookingFor;
        }
        if (extraData.benefits) entry.benefits = extraData.benefits; // Usually null in base
        if (extraData.compensation) entry.compensation = extraData.compensation;

        if (extraData.languages) {
            entry.languages = Array.from(new Set([...(entry.languages || []), ...(extraData.languages || [])]));
        }
        if (extraData.frameworks) {
            entry.frameworks = Array.from(new Set([...(entry.frameworks || []), ...(extraData.frameworks || [])]));
        }
    }

    // 5. Finalize and Attach Logos
    const finalCompanies: DBCompany[] = [];
    let idCounter = 1;

    for (const [key, data] of mergedMap) {
        if (!data.name) continue;

        // Attach Logo
        const logoUrl = logoMap.get(key) || '🏢'; // Fallback to emoji if no logo found? 
        // Or if the user really wants a "photo", maybe a default placeholder image path?

        finalCompanies.push({
            id: idCounter++,
            name: data.name,
            logo: logoUrl,
            industry: 'Technology', // Default
            description: data.description || 'A technology company.',
            color: stringToColor(data.name),
            website: data.website || '',
            languages: data.languages || [],
            frameworks: data.frameworks || [],
            skills: data.skills || [],
            experience: 'See description',
            contributions: data.lookingFor || '',
            lookingFor: data.lookingFor || '',
            compensation: data.compensation || '',
            benefits: data.benefits || '',
            locations: data.locations || [],
            roleTypes: data.roleTypes || []
        });
    }

    console.log(`Generated ${finalCompanies.length} companies.`);

    // Write to file
    const outputPath = path.join(process.cwd(), 'src', 'data', 'companies-db.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalCompanies, null, 2));
    console.log(`Database written to ${outputPath}`);
}

main().catch(console.error);
