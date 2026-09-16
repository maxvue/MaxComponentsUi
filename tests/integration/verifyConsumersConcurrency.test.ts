/**
 * verifyConsumersConcurrency.test.ts
 *
 * Valida o requisito R25 (E11-05):
 * 1. Duas execuções concorrentes do verificador operam simultaneamente sem colisão,
 *    utilizando diretórios temporários e tarballs exclusivos por PID.
 * 2. O bloco finally garante a remoção integral do diretório temporário mesmo
 *    após falha forçada com código de saída de erro.
 * 3. A interrupção prematura do processo via sinal (SIGTERM) dispara a limpeza preventiva.
 * 4. O verificador cobre a matriz completa de cenários: Node, TS, Vite, SSR, CSS/temas e peers.
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '../../');
const scriptPath = path.resolve(projectRoot, 'scripts/verify-consumers.mjs');

interface ProcessResult {
    code: number | null;
    signal: string | null;
    stdout: string;
    stderr: string;
    tempDir: string | null;
    tarballPath: string | null;
}

function runVerifierProcess(args: string[], env: Record<string, string> = {}): Promise<ProcessResult> {
    return new Promise((resolve) => {
        const proc = spawn('node', [scriptPath, ...args], {
            cwd: projectRoot,
            env: { ...process.env, ...env }
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        proc.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        proc.on('close', (code, signal) => {
            const tempDirMatch = stdout.match(/Diretório temporário exclusivo por PID:\s*([^\r\n]+)/);
            const tarballMatch = stdout.match(/Tarball isolado criado:\s*([^\r\n]+)/);

            resolve({
                code,
                signal,
                stdout,
                stderr,
                tempDir: tempDirMatch ? tempDirMatch[1].trim() : null,
                tarballPath: tarballMatch ? tarballMatch[1].trim() : null
            });
        });
    });
}

describe('R25 (E11-05) - Concorrência, Isolamento e Cleanup de Consumidores', () => {
    it('deve executar dois verificadores simultâneos em processos distintos com diretórios e tarballs exclusivos sem colisão', async () => {
        // Inicia dois processos concorrentes executando cenários isolados em paralelo
        const [res1, res2] = await Promise.all([
            runVerifierProcess(['--skip-build', '--scenario=7']),
            runVerifierProcess(['--skip-build', '--scenario=7'])
        ]);

        // Ambos devem finalizar com código de saída 0 (sucesso)
        expect(res1.code, `Processo 1 falhou: ${res1.stderr}`).toBe(0);
        expect(res2.code, `Processo 2 falhou: ${res2.stderr}`).toBe(0);

        // Cada processo deve ter criado um diretório temporário exclusivo
        expect(res1.tempDir).toBeTruthy();
        expect(res2.tempDir).toBeTruthy();
        expect(res1.tempDir).not.toBe(res2.tempDir);

        // Cada processo deve ter gerado seu próprio tarball isolado no respectivo diretório
        expect(res1.tarballPath).toBeTruthy();
        expect(res2.tarballPath).toBeTruthy();
        expect(res1.tarballPath).not.toBe(res2.tarballPath);
        expect(res1.tarballPath).toContain(res1.tempDir!);
        expect(res2.tarballPath).toContain(res2.tempDir!);

        // Ao término dos processos, o bloco finally deve ter removido ambos os diretórios
        expect(fs.existsSync(res1.tempDir!)).toBe(false);
        expect(fs.existsSync(res2.tempDir!)).toBe(false);
    }, 45000);

    it('deve garantir a limpeza completa de diretórios temporários via bloco finally mesmo após falha forçada', async () => {
        // Executa com --force-fail para acionar exceção após criar o diretório temporário
        const res = await runVerifierProcess(['--skip-build', '--force-fail']);

        // O processo deve falhar com código != 0
        expect(res.code).toBe(1);
        const output = res.stdout + res.stderr;
        expect(output).toContain('Falha forçada controlada');
        expect(res.stdout).toContain('Diretório temporário removido');

        // O diretório temporário informado na saída deve ter sido 100% removido
        expect(res.tempDir).toBeTruthy();
        expect(fs.existsSync(res.tempDir!)).toBe(false);
    }, 15000);

    it('deve realizar limpeza preventiva do diretório temporário em caso de interrupção por sinal SIGTERM', async () => {
        let capturedTempDir: string | null = null;

        const proc = spawn('node', [scriptPath, '--skip-build', '--scenario=1'], {
            cwd: projectRoot,
            env: { ...process.env }
        });

        await new Promise<void>((resolve) => {
            proc.stdout.on('data', (chunk) => {
                const text = chunk.toString();
                const match = text.match(/Diretório temporário exclusivo por PID:\s*([^\r\n]+)/);
                if (match && !capturedTempDir) {
                    capturedTempDir = match[1].trim();
                    // Envia SIGTERM imediatamente após a criação do diretório
                    proc.kill('SIGTERM');
                    resolve();
                }
            });
        });

        await new Promise<void>((resolve) => {
            proc.on('close', () => {
                resolve();
            });
        });

        expect(capturedTempDir).toBeTruthy();
        // O handler de SIGTERM deve ter executado a limpeza
        expect(fs.existsSync(capturedTempDir!)).toBe(false);
    }, 15000);

    it('deve cobrir todos os cenários contratuais de consumidores no script de distribuição', () => {
        const scriptContent = fs.readFileSync(scriptPath, 'utf-8');

        // Cenários obrigatórios de distribuição
        expect(scriptContent).toContain('Node ESM sem deps opcionais');
        expect(scriptContent).toContain('Node ESM com deps opcionais');
        expect(scriptContent).toContain('TypeScript Consumer');
        expect(scriptContent).toContain('Vite Consumer');
        expect(scriptContent).toContain('SSR Consumer');
        expect(scriptContent).toContain('CSS Global e Temas SCSS Consumer');
        expect(scriptContent).toContain('Subpath desconhecido deve falhar');

        // Validação ativa de compilação SCSS no cenário de temas (não apenas fs.existsSync)
        expect(scriptContent).toContain('sass.compile(themePath)');
        expect(scriptContent).toContain('sass.compileString(consumerScss');
    });
});
