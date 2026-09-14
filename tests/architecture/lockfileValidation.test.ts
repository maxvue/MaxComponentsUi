import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateLockfile } from '../../scripts/check-lockfile.mjs';

describe('R01 / E01-02: Validação Bidirecional e Fixtures Negativas do Lockfile', () => {
    it('valida com sucesso o package.json e package-lock.json do projeto atual', () => {
        const result = validateLockfile(path.resolve(__dirname, '../../'));
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('fixture negativa: rejeita package-lock contendo resolved "file:../"', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-file-'));
        try {
            const pkg = { name: 'test', dependencies: { foo: '^1.0.0' } };
            const lock = {
                name: 'test',
                packages: {
                    '': { dependencies: { foo: '^1.0.0' } },
                    'node_modules/foo': {
                        version: '1.0.0',
                        resolved: 'file:../local-pkg'
                    }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('contém caminho proibido'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita package-lock contendo chaves com caminhos de máquina (/home/)', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-home-'));
        try {
            const pkg = { name: 'test', dependencies: {} };
            const lock = {
                name: 'test',
                packages: {
                    '': {},
                    '/home/user/workspace/node_modules/foo': { version: '1.0.0' }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('caminho de máquina'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita links simbólicos locais (link: true)', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-link-'));
        try {
            const pkg = { name: 'test', dependencies: { foo: '^1.0.0' } };
            const lock = {
                name: 'test',
                packages: {
                    '': { dependencies: { foo: '^1.0.0' } },
                    'node_modules/foo': { link: true }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('link: true'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita dependência faltante no lockfile', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-missing-'));
        try {
            const pkg = { name: 'test', dependencies: { foo: '^1.0.0', bar: '^2.0.0' } };
            const lock = {
                name: 'test',
                packages: {
                    '': { dependencies: { foo: '^1.0.0' } }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('ausente no bloco raiz'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita divergência de versão entre package.json e lockfile', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-divergence-'));
        try {
            const pkg = { name: 'test', dependencies: { foo: '^1.0.0' } };
            const lock = {
                name: 'test',
                packages: {
                    '': { dependencies: { foo: '^2.0.0' } }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('diverge:'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
