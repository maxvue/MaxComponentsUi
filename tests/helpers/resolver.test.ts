import { describe, it, expect } from 'vitest';
import manifest from '../../src/components-manifest.json';
import { MaxComponentsUiResolver } from '../../src/helpers/MaxComponentsUiResolver';

describe('MaxComponentsUiResolver', () => {
    const resolver = MaxComponentsUiResolver();

    it('resolve alias existente no manifest', () => {
        const result = (resolver as any).resolve('Button');
        expect(result).toEqual({
            name: 'MaxButton',
            from: '@maxvue/max-components-ui'
        });
    });

    it('resolve alias kebab-case do manifest', () => {
        const result = (resolver as any).resolve('icon-button');
        expect(result).toEqual({
            name: 'MaxIconButton',
            from: '@maxvue/max-components-ui'
        });
    });

    it('retorna undefined para componente desconhecido', () => {
        const result = (resolver as any).resolve('ComponenteInexistente');
        expect(result).toBeUndefined();
    });

    it('manifest contém todos os aliases esperados', () => {
        const aliases = manifest.aliases as Record<string, string>;
        expect(aliases['Botao']).toBe('MaxButton');
        expect(aliases['InputField']).toBe('MaxInputText');
        expect(aliases['InputPhone']).toBe('MaxPhoneField');
        expect(aliases['T1']).toBe('MaxTitle1');
        expect(aliases['T2']).toBe('MaxTitle2');
    });
});
