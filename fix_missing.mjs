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

const snippet = `
    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
`;

for (const filepath of missing) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/<\/style>\s*$/, snippet + '</style>\n');
  fs.writeFileSync(filepath, content, 'utf8');
}
console.log(`Fixed ${missing.length} files.`);
