
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

async function main() {
    const files = [
        'Nathan_Software_Engineering .docx (1).pdf',
        'Profile.pdf'
    ];

    for (const file of files) {
        const filePath = path.join(process.cwd(), file);
        console.log(`\n--- Processing with pdf-parse: ${file} ---`);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        const buffer = fs.readFileSync(filePath);
        try {
            const data = await pdf(buffer);
            console.log(`Successfully parsed ${data.text.length} characters.`);
            console.log('Preview (first 500 chars):');
            console.log(data.text.substring(0, 500).replace(/\n/g, '\\n'));
        } catch (error) {
            console.error('Error parsing:', error);
        }
    }
}

main();
