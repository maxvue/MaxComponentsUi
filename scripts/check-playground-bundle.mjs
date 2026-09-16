import { gzipSync } from 'node:zlib';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const DIST_DIR = resolve(fileURLToPath(new URL('../playground/dist', import.meta.url)));
const LIMITS = Object.freeze({
    // Orçamento congelado a partir dos baselines auditados (2.507.440 bytes brutos e 823.120 bytes gzip).
    rawBytes: 2_507_440,
    gzipBytes: 823_120
});

if (!existsSync(DIST_DIR)) {
    console.log('playground/dist não encontrado. Executando build do playground...');
    execSync('npx vite build --config playground/vite.config.ts', { stdio: 'inherit' });
}

function listJavaScriptFiles(directory) {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return listJavaScriptFiles(path);
        return entry.name.endsWith('.js') ? [path] : [];
    });
}

const chunks = listJavaScriptFiles(DIST_DIR).map((file) => {
    const content = readFileSync(file);
    return { file, rawBytes: content.byteLength, gzipBytes: gzipSync(content).byteLength };
});

if (chunks.length === 0) {
    throw new Error(`Nenhum chunk JavaScript encontrado em ${DIST_DIR}. Execute o build antes do orçamento.`);
}

const failures = chunks.filter(({ rawBytes, gzipBytes }) => rawBytes > LIMITS.rawBytes || gzipBytes > LIMITS.gzipBytes);
const largestChunk = chunks.reduce((largest, chunk) => chunk.rawBytes > largest.rawBytes ? chunk : largest);
console.log(`Maior chunk: ${largestChunk.file} (${largestChunk.rawBytes} bytes brutos, ${largestChunk.gzipBytes} bytes gzip).`);

if (failures.length > 0) {
    throw new Error(`Orçamento do playground excedido: ${failures.map(({ file }) => file).join(', ')}`);
}
