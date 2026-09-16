import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { optimize } from 'svgo';
import svgoConfig from '../svgo.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../src/assets/credit-card');

// Orçamento máximo por arquivo de bandeira (60 KB bruto, 25 KB gzip, 20 KB brotli)
const MAX_RAW_BYTES = 60 * 1024;
const MAX_GZIP_BYTES = 25 * 1024;
const MAX_BROTLI_BYTES = 20 * 1024;

function optimizeDirectory(directory, checkOnly = false) {
    const files = fs.readdirSync(directory);
    let hasChanges = false;
    let errorCount = 0;
    let budgetViolations = 0;

    for (const file of files) {
        if (file.endsWith('.svg')) {
            const filePath = path.join(directory, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const result = optimize(content, { path: filePath, ...svgoConfig });

            if (result.error) {
                console.error(`Erro ao otimizar ${file}:`, result.error);
                errorCount++;
                continue;
            }

            const rawBuffer = Buffer.from(result.data, 'utf-8');
            const gzipSize = zlib.gzipSync(rawBuffer).length;
            const brotliSize = zlib.brotliCompressSync(rawBuffer).length;

            if (rawBuffer.length > MAX_RAW_BYTES || gzipSize > MAX_GZIP_BYTES || brotliSize > MAX_BROTLI_BYTES) {
                console.error(`❌ Orçamento excedido para ${file}: bruto=${rawBuffer.length}B (max ${MAX_RAW_BYTES}B), gzip=${gzipSize}B (max ${MAX_GZIP_BYTES}B), brotli=${brotliSize}B (max ${MAX_BROTLI_BYTES}B)`);
                budgetViolations++;
            }

            if (result.data !== content) {
                hasChanges = true;
                if (checkOnly) {
                    console.error(`SVG não otimizado ou divergente encontrado: ${file}`);
                } else {
                    fs.writeFileSync(filePath, result.data, 'utf-8');
                    console.log(`Optimized ${file} [bruto: ${rawBuffer.length}B, gzip: ${gzipSize}B, brotli: ${brotliSize}B]`);
                }
            } else if (!checkOnly) {
                console.log(`Already optimized: ${file} [bruto: ${rawBuffer.length}B, gzip: ${gzipSize}B, brotli: ${brotliSize}B]`);
            }
        }
    }

    if (errorCount > 0 || budgetViolations > 0) {
        process.exit(1);
    }

    if (checkOnly) {
        if (hasChanges) {
            console.error('Falha na verificação de SVGO: existem SVGs não otimizados. Execute `node scripts/optimize-svgs.mjs` para corrigir.');
            process.exit(1);
        } else {
            console.log('✅ Verificação SVGO: todos os SVGs de bandeiras estão otimizados, idempotentes e dentro dos orçamentos bruto/gzip/Brotli.');
        }
    } else {
        console.log('SVG optimization complete.');
    }
}

const isCheck = process.argv.includes('--check');
optimizeDirectory(assetsDir, isCheck);

