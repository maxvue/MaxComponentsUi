import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';
import svgoConfig from '../svgo.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../src/assets/credit-card');

function optimizeDirectory(directory) {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        if (file.endsWith('.svg')) {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const result = optimize(content, { path: filePath, ...svgoConfig });

            if (result.error) {
                console.error(`Error optimizing ${file}:`, result.error);
                continue;
            }

            fs.writeFileSync(filePath, result.data, 'utf-8');
            console.log(`Optimized ${file}`);
        }
    }
}

optimizeDirectory(assetsDir);
console.log('SVG optimization complete.');
