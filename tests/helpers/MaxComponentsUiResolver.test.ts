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

    it('deve resolver os dez novos inputs semânticos e suas variantes', () => {
        const names = [
            'MaxInputPercent',
            'MaxInputPower',
            'MaxInputCurrent',
            'MaxInputVoltage',
            'MaxInputDistance',
            'MaxInputDuration',
            'MaxInputTokenLimit',
            'MaxInputMonthDays',
            'MaxInputWeekInterval',
            'MaxInputSocialPlatform'
        ];

        for (const name of names) {
            expect(resolveFn(name)).toEqual({
                name,
                from: '@maxvue/max-components-ui'
            });

            const alias = name.replace(/^Max/, '');
            expect(resolveFn(alias)).toEqual({
                name,
                from: '@maxvue/max-components-ui'
            });
        }
    });
});
