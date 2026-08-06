import { describe, it, expect } from 'vitest';
import { MaxComponentsUiResolver } from '../../src/helpers/MaxComponentsUiResolver';

describe('MaxComponentsUiResolver', () => {
    const resolverObj = MaxComponentsUiResolver();
    const resolve = (resolverObj as any).resolve;

    it('resolve um componente Max pelo nome exato', () => {
        const res = resolve('MaxInputText');
        expect(res).toEqual({
            name: 'MaxInputText',
            from: '@maxvue/max-components-ui'
        });
    });

    it('resolve pelo alias sem prefixo ou kebab-case se estiver no manifesto', () => {
        const res = resolve('InputText');
        expect(res).toBeDefined();
        expect(res?.from).toBe('@maxvue/max-components-ui');
    });

    it('retorna undefined para um nome desconhecido', () => {
        const res = resolve('UnknownComponentNotExisting');
        expect(res).toBeUndefined();
    });
});
