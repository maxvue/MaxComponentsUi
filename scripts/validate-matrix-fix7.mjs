import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dirFix7 = path.join(rootDir, 'docs/optimize-new/execution-fix7');
const matrizPath = path.join(dirFix7, 'MATRIZ_ORQUESTRACAO.md');

if (!fs.existsSync(matrizPath)) {
    console.error('❌ MATRIZ_ORQUESTRACAO.md não encontrada.');
    process.exit(1);
}

const matrizContent = fs.readFileSync(matrizPath, 'utf-8');
const lines = matrizContent.split('\n').filter(l => l.startsWith('|') && !l.includes('Papel') && !l.includes('---'));

console.log(`Total de linhas de papéis na matriz: ${lines.length}`);
if (lines.length !== 120) {
    console.error(`❌ Esperado 120 papéis, encontrado: ${lines.length}`);
    process.exit(1);
}

let errors = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    // [num, papel, uuid, parentId, tarefa, shaInit, shaEnd, inicio, fim, worktree, manifest, cmd, status, commit, risco, relatorio]
    if (cols.length < 16) {
        errors.push(`Linha ${i + 1} possui menos colunas que o esperado (${cols.length}/16): ${line}`);
        continue;
    }

    const [num, papel, uuid, parentId, tarefa, shaInit, shaEnd, inicio, fim, worktree, manifest, cmd, status, commit, risco, relatorio] = cols;

    if (line.includes('PLANEJADO')) {
        errors.push(`Linha ${i + 1} (${papel}) contém status ou valor PLANEJADO`);
    }

    if (status !== 'CONCLUÍDO') {
        errors.push(`Linha ${i + 1} (${papel}) status não é CONCLUÍDO (encontrado: ${status})`);
    }

    const cleanPapel = papel.replace(/`/g, '');
    const reportFile = path.join(dirFix7, `${cleanPapel}.md`);
    if (!fs.existsSync(reportFile)) {
        errors.push(`Relatório do papel ${cleanPapel} não existe em ${reportFile}`);
    } else {
        const reportContent = fs.readFileSync(reportFile, 'utf-8');
        if (reportContent.includes('PLANEJADO')) {
            errors.push(`Relatório ${cleanPapel}.md contém texto PLANEJADO`);
        }
        if (!reportContent.includes('CONCLUÍDO')) {
            errors.push(`Relatório ${cleanPapel}.md não tem status CONCLUÍDO`);
        }
    }
}

if (errors.length > 0) {
    console.error('❌ Erros encontrados na validação da matriz fix7:');
    for (const err of errors) {
        console.error(`  - ${err}`);
    }
    process.exit(1);
}

console.log('✅ REL7-MATRIZ e REL7-SCHEMA: Todos os 120 papéis e relatórios estão presentes, consistentes e sem campos pendentes!');
process.exit(0);
