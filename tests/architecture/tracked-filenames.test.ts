import { describe, it, expect } from 'vitest';
import { validateFilenames, getTrackedFiles } from '../../scripts/check-tracked-filenames.mjs';

describe('Arquitetura - Validação de Nomes de Arquivos Rastreados', () => {
    it('deve aceitar caminhos de arquivos válidos normais', () => {
        const validFiles = [
            'src/components/MaxButton.vue',
            'src/stores/useUser.Store.ts',
            'package.json',
            'scripts/check-tracked-filenames.mjs',
            'docs/optimize-new/instructions_to_implementation.md'
        ];

        const result = validateFilenames(validFiles);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('deve rejeitar arquivos cujo basename comece com hífen (ex.: -l)', () => {
        const hostileFiles = [
            'src/components/base/-l',
            '-flag.txt',
            'deep/nested/folder/-file.js'
        ];

        const result = validateFilenames(hostileFiles);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors[0]?.reason).toContain('inicia com hífen (-)');
        expect(result.errors[1]?.reason).toContain('inicia com hífen (-)');
        expect(result.errors[2]?.reason).toContain('inicia com hífen (-)');
    });

    it('deve rejeitar segmentos de diretório iniciados com hífen', () => {
        const hostileDirs = [
            'src/-nested/MyComponent.vue',
            '-tools/script.sh'
        ];

        const result = validateFilenames(hostileDirs);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(2);
    });

    it('deve rejeitar arquivos com caracteres de controle ASCII', () => {
        const hostileChars = [
            'src/components/test\nfile.ts',
            'src/components/test\rfile.ts',
            'src/components/\x00null.ts',
            'src/components/\x1Funit.ts'
        ];

        const result = validateFilenames(hostileChars);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(4);
        expect(result.errors[0]?.reason).toContain('caracteres de controle ASCII');
    });

    it('deve respeitar exceções devidamente documentadas na lista de exceções', () => {
        const filesWithException = [
            'src/components/base/-l',
            'src/components/MaxButton.vue'
        ];

        const result = validateFilenames(filesWithException, ['src/components/base/-l']);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('deve validar com sucesso todos os arquivos rastreados no repositório atual', () => {
        const trackedFiles = getTrackedFiles();
        expect(trackedFiles.length).toBeGreaterThan(0);

        const result = validateFilenames(trackedFiles);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});
