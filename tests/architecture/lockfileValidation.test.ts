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

    it('fixture negativa: rejeita .npmrc contendo legacy-peer-deps=true', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-npmrc-'));
        try {
            const pkg = { name: 'test', dependencies: {} };
            const lock = { name: 'test', packages: { '': {} } };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));
            fs.writeFileSync(path.join(tmpDir, '.npmrc'), 'legacy-peer-deps=true\n');

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('legacy-peer-deps'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita chave de pacote órfã ou externa a node_modules', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-non-nm-'));
        try {
            const pkg = { name: 'test', dependencies: {} };
            const lock = {
                name: 'test',
                packages: {
                    '': {},
                    '../MaxUse': { version: '1.0.0' }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('não é canônica'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita symlink: true', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-symlink-'));
        try {
            const pkg = { name: 'test', dependencies: { foo: '^1.0.0' } };
            const lock = {
                name: 'test',
                packages: {
                    '': { dependencies: { foo: '^1.0.0' } },
                    'node_modules/foo': { symlink: true }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('link/symlink: true'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita especificação de versão local (file:) em package.json', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-pkg-file-'));
        try {
            const pkg = { name: 'test', dependencies: { '@maxvue/max-use': 'file:../MaxUse' } };
            const lock = {
                name: 'test',
                packages: {
                    '': { dependencies: { '@maxvue/max-use': 'file:../MaxUse' } }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('possui especificação de versão local proibida'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita peerDependencies e optionalDependencies divergentes bidirecionalmente', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-peers-'));
        try {
            const pkg = {
                name: 'test',
                peerDependencies: { vue: '^3.6.0' },
                optionalDependencies: { opt: '^1.0.0' }
            };
            const lock = {
                name: 'test',
                packages: {
                    '': {
                        peerDependencies: { vue: '^3.5.0' },
                        optionalDependencies: { other: '^1.0.0' }
                    }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('PeerDependência "vue" diverge'))).toBe(true);
            expect(res.errors.some((e) => e.includes('OptionalDependência "opt" declarada em package.json ausente'))).toBe(true);
            expect(res.errors.some((e) => e.includes('OptionalDependência "other" presente no bloco raiz'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa: rejeita peerDependenciesMeta divergente bidirecionalmente', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-peer-meta-'));
        try {
            const pkg = {
                name: 'test',
                peerDependencies: { 'pkg-a': '^1.0.0', 'pkg-b': '^2.0.0' },
                peerDependenciesMeta: {
                    'pkg-a': { optional: true },
                    'pkg-b': { optional: false }
                }
            };
            const lock = {
                name: 'test',
                packages: {
                    '': {
                        peerDependencies: { 'pkg-a': '^1.0.0', 'pkg-b': '^2.0.0' },
                        peerDependenciesMeta: {
                            'pkg-a': { optional: false },
                            'pkg-c': { optional: true }
                        }
                    }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('peerDependenciesMeta para "pkg-a.optional" diverge'))).toBe(true);
            expect(res.errors.some((e) => e.includes('peerDependenciesMeta para "pkg-b" declarada em package.json ausente'))).toBe(true);
            expect(res.errors.some((e) => e.includes('peerDependenciesMeta para "pkg-c" presente no bloco raiz'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa adversarial: rejeita .npmrc com legacy-peer-deps booleano isolado, maiúsculo, numérico ou com aspas', () => {
        const testCases = [
            'legacy-peer-deps\n',
            'legacy-peer-deps=TRUE\n',
            'legacy-peer-deps=1\n',
            'legacy-peer-deps = "true"\n',
            'legacy-peer-deps = \'true\'\n',
            'legacy-peer-deps = yes\n'
        ];

        for (const npmrcContent of testCases) {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-npmrc-adv-'));
            try {
                const pkg = { name: 'test', dependencies: {} };
                const lock = { name: 'test', packages: { '': {} } };
                fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
                fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));
                fs.writeFileSync(path.join(tmpDir, '.npmrc'), npmrcContent);

                const res = validateLockfile(tmpDir);
                expect(res.valid).toBe(false);
                expect(res.errors.some((e) => e.includes('legacy-peer-deps'))).toBe(true);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        }
    });

    it('fixture positiva: permite .npmrc contendo legacy-peer-deps=false explicitamente desativado', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-npmrc-false-'));
        try {
            const pkg = { name: 'test', dependencies: {} };
            const lock = { name: 'test', packages: { '': {} } };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));
            fs.writeFileSync(path.join(tmpDir, '.npmrc'), 'legacy-peer-deps=false\n');

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(true);
            expect(res.errors).toEqual([]);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa adversarial: rejeita caminho relativo iniciado por ./ em package.json', () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-relative-dot-'));
        try {
            const pkg = { name: 'test', dependencies: { 'local-comp': './local-components' } };
            const lock = {
                name: 'test',
                packages: {
                    '': { dependencies: { 'local-comp': './local-components' } }
                }
            };
            fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
            fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

            const res = validateLockfile(tmpDir);
            expect(res.valid).toBe(false);
            expect(res.errors.some((e) => e.includes('possui especificação de versão local proibida'))).toBe(true);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    it('fixture negativa adversarial: rejeita resolved com caminhos absolutos /tmp e /Users no lockfile', () => {
        const paths = ['/tmp/pacote.tgz', '/Users/developer/pacote.tgz', '/root/pkg.tgz', '/opt/pkg.tgz'];
        for (const badPath of paths) {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-abs-'));
            try {
                const pkg = { name: 'test', dependencies: { foo: '^1.0.0' } };
                const lock = {
                    name: 'test',
                    packages: {
                        '': { dependencies: { foo: '^1.0.0' } },
                        'node_modules/foo': { version: '1.0.0', resolved: badPath }
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
        }
    });

    it('fixture negativa adversarial: rejeita protocolos workspace:*, portal: e git+file: em package.json', () => {
        const protocols = ['workspace:*', 'portal:./foo', 'git+file:///path/to/repo'];
        for (const spec of protocols) {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lock-test-proto-'));
            try {
                const pkg = { name: 'test', dependencies: { 'custom-pkg': spec } };
                const lock = {
                    name: 'test',
                    packages: {
                        '': { dependencies: { 'custom-pkg': spec } }
                    }
                };
                fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(pkg));
                fs.writeFileSync(path.join(tmpDir, 'package-lock.json'), JSON.stringify(lock));

                const res = validateLockfile(tmpDir);
                expect(res.valid).toBe(false);
                expect(res.errors.some((e) => e.includes('possui especificação de versão local proibida'))).toBe(true);
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        }
    });
});
