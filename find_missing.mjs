import fs from 'fs';
import path from 'path';

const dir = './src/components';
const files = fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.vue'));

const missing = [];
for (const file of files) {
  const filepath = path.join(dir, file);
  const content = fs.readFileSync(filepath, 'utf8');
  if (/(transition|animation)\s*:/.test(content)) {
    if (!content.includes('prefers-reduced-motion: reduce')) {
      missing.push(filepath);
    }
  }
}
console.log(missing.join('\n'));
