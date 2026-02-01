
import * as fs from 'fs';
import * as path from 'path';
import { parseResume } from '../src/lib/parse-resume';

async function main() {
    const files = [
        'Nathan_Software_Engineering .docx (1).pdf',
        'Profile.pdf'
    ];

    for (const file of files) {
        const filePath = path.join(process.cwd(), file);
        console.log(`\n--- Processing: ${file} ---`);
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            continue;
        }

        const buffer = fs.readFileSync(filePath);
        try {
            // Create a buffer from the file (Node buffer is compatible with Buffer type needed)
            const text = await parseResume(buffer, 'application/pdf');
            console.log(`Successfully parsed ${text.length} characters.`);
            console.log('Preview (first 500 chars):');
            console.log(text.substring(0, 500));
            console.log('\nPreview (last 500 chars):');
            console.log(text.substring(text.length - 500));
        } catch (error) {
            console.error('Error parsing:', error);
        }
    }
}

main();
