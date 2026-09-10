import { describe, it, expect } from 'vitest';
import manifest from '../../src/components-manifest.json';

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

    it('retorna undefined para componente desconhecido ou não exportado', () => {
        const result = resolver.resolve('ComponenteInexistente');
        expect(result).toBeUndefined();
    });

    it('resolve ColorPicker e Popover para componentes Max nativos', () => {
        expect(resolver.resolve('ColorPicker')).toEqual({
            name: 'MaxColorPicker',
            from: '@maxvue/max-components-ui'
        });
        expect(resolver.resolve('Popover')).toEqual({
            name: 'MaxPopover',
            from: '@maxvue/max-components-ui'
        });
    });

    it('resolve MaxTableColumn corretamente (não-regressão)', () => {
        const result = resolver.resolve('MaxTableColumn');
        expect(result).toEqual({
            name: 'MaxTableColumn',
            from: '@maxvue/max-components-ui'
        });
    });

    it('resolve MaxInputPhone e seus aliases (MaxPhoneField, PhoneField, InputPhone)', () => {
        expect(resolver.resolve('MaxInputPhone')).toEqual({
            name: 'MaxInputPhone',
            from: '@maxvue/max-components-ui'
        });
        expect(resolver.resolve('MaxPhoneField')).toEqual({
            name: 'MaxInputPhone',
            from: '@maxvue/max-components-ui'
        });
        expect(resolver.resolve('PhoneField')).toEqual({
            name: 'MaxInputPhone',
            from: '@maxvue/max-components-ui'
        });
        expect(resolver.resolve('InputPhone')).toEqual({
            name: 'MaxInputPhone',
            from: '@maxvue/max-components-ui'
        });
        expect(resolver.resolve('max-input-phone')).toEqual({
            name: 'MaxInputPhone',
            from: '@maxvue/max-components-ui'
        });
        expect(resolver.resolve('max-phone-field')).toEqual({
            name: 'MaxInputPhone',
            from: '@maxvue/max-components-ui'
        });
    });

    it('manifest contém todos os aliases esperados', () => {
        const aliases = manifest.aliases as Record<string, string>;
        // Verifica alguns aliases-chave
        expect(aliases['Botao']).toBe('MaxButton');
        expect(aliases['InputField']).toBe('MaxInputText');
        expect(aliases['MaxInputPhone']).toBe('MaxInputPhone');
        expect(aliases['MaxPhoneField']).toBe('MaxInputPhone');
        expect(aliases['PhoneField']).toBe('MaxInputPhone');
        expect(aliases['InputPhone']).toBe('MaxInputPhone');
        expect(aliases['T1']).toBe('MaxTitle1');
        expect(aliases['T2']).toBe('MaxTitle2');
    });
});
