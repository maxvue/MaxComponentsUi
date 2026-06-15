import { describe, it, expect, vi } from 'vitest';
import manifest from '../../src/components-manifest.json';

// Mock do PrimeVueResolver para evitar dependência direta
vi.mock('@primevue/auto-import-resolver', () => ({
    PrimeVueResolver: () => [{
        type: 'component',
        resolve: (name: string) => {
            // Simula resolução de componentes PrimeVue conhecidos
            const primeComponents = ['DataTable', 'Column', 'Dialog', 'InputText', 'Button'];
            if (primeComponents.includes(name)) return { name, from: 'primevue/' + name.toLowerCase() };

            return undefined;
        }
    }]
}));

// Importa o resolver depois do mock
import { MaxComponentsUiResolver } from '../../src/helpers/MaxComponentsUiResolver';

describe('MaxComponentsUiResolver', () => {
    const resolver = MaxComponentsUiResolver();

    it('resolve alias existente no manifest', () => {
        const result = resolver.resolve('Button');
        expect(result).toEqual({
            name: 'MaxButton',
            from: '@maxvue/max-components-ui'
        });
    });

    it('resolve alias kebab-case do manifest', () => {
        const result = resolver.resolve('icon-button');
        expect(result).toEqual({
            name: 'MaxIconButton',
            from: '@maxvue/max-components-ui'
        });
    });

    it('resolve componente PrimeVue via fallback', () => {
        // 'DataTable' não está no manifest, mas está no PrimeVueResolver mock
        const result = resolver.resolve('DataTable');
        expect(result).toEqual({
            name: 'DataTable',
            from: '@maxvue/max-components-ui/prime'
        });
    });

    it('retorna undefined para componente desconhecido', () => {
        const result = resolver.resolve('ComponenteInexistente');
        expect(result).toBeUndefined();
    });

    it('manifest contém todos os aliases esperados', () => {
        const aliases = manifest.aliases as Record<string, string>;
        // Verifica alguns aliases-chave
        expect(aliases['Botao']).toBe('MaxButton');
        expect(aliases['InputField']).toBe('MaxInputText');
        expect(aliases['InputPhone']).toBe('MaxPhoneField');
        expect(aliases['T1']).toBe('MaxTitle1');
        expect(aliases['T2']).toBe('MaxTitle2');
    });
});
