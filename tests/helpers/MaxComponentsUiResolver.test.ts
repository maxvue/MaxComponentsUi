import { describe, it, expect } from 'vitest';
import { MaxComponentsUiResolver } from '../../src/helpers/MaxComponentsUiResolver';

describe('MaxComponentsUiResolver', () => {
    const resolver = MaxComponentsUiResolver();
    const resolveFn = typeof resolver === 'function' ? resolver : resolver.resolve;

    it('deve resolver componentes Max canônicos para @maxvue/max-components-ui', () => {
        const result = resolveFn('MaxButton');
        expect(result).toEqual({
            name: 'MaxButton',
            from: '@maxvue/max-components-ui'
        });
    });

    it('deve resolver aliases sem prefixo Max e formatos kebab/snake para o componente correspondente', () => {
        const resultButton = resolveFn('Botao');
        expect(resultButton).toEqual({
            name: 'MaxButton',
            from: '@maxvue/max-components-ui'
        });

        const resultInputField = resolveFn('InputField');
        expect(resultInputField).toEqual({
            name: 'MaxInputText',
            from: '@maxvue/max-components-ui'
        });

        const resultKebab = resolveFn('max-input-text');
        expect(resultKebab).toEqual({
            name: 'MaxInputText',
            from: '@maxvue/max-components-ui'
        });
    });

    it('deve resolver os dez novos componentes semânticos nos formatos canônico, sem Max, kebab e snake', () => {
        const semanticComponents = [
            'MaxInputEntity',
            'MaxInputGender',
            'MaxInputWeekday',
            'MaxInputMonth',
            'MaxInputTime',
            'MaxInputYear',
            'MaxInputEmail',
            'MaxInputUrl',
            'MaxInputPassword',
            'MaxInputSlug'
        ];

        for (const canonical of semanticComponents) {
            // Canônico (ex: MaxInputEmail)
            expect(resolveFn(canonical)).toEqual({
                name: canonical,
                from: '@maxvue/max-components-ui'
            });

            // Sem prefixo Max (ex: InputEmail)
            const noMax = canonical.replace(/^Max/, '');
            expect(resolveFn(noMax)).toEqual({
                name: canonical,
                from: '@maxvue/max-components-ui'
            });

            // Kebab-case com Max (ex: max-input-email)
            const kebabWithMax = canonical.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            expect(resolveFn(kebabWithMax)).toEqual({
                name: canonical,
                from: '@maxvue/max-components-ui'
            });

            // Kebab-case sem Max (ex: input-email)
            const kebabNoMax = noMax.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            expect(resolveFn(kebabNoMax)).toEqual({
                name: canonical,
                from: '@maxvue/max-components-ui'
            });
        }
    });

    it('NÃO deve resolver nem interceptar componentes do PrimeVue puro', () => {
        const resultDataTable = resolveFn('DataTable');
        expect(resultDataTable).toBeUndefined();

        const resultSelect = resolveFn('Select');
        expect(resultSelect).toBeUndefined();

        const resultDatePicker = resolveFn('DatePicker');
        expect(resultDatePicker).toBeUndefined();
    });

    it('deve retornar undefined para componentes desconhecidos', () => {
        const result = resolveFn('NonExistentComponent');
        expect(result).toBeUndefined();
    });
});
