import prisma from './src/lib/prisma'

async function main() {
    try {
        console.log('Attempting to connect to database...');
        // Try a simple query
        const count = await prisma.company.count();
        console.log(`Successfully connected! Found ${count} companies.`);
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
