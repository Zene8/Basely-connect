const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "file:./dev.db"
        }
    }
});

async function main() {
    console.log("Checking DB connection...");
    try {
        const count = await prisma.company.count();
        console.log(`Success! Found ${count} companies.`);
    } catch (e) {
        console.error("Connection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
