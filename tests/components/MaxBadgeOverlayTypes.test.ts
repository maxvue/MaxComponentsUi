import { describe, it, expect, assertType } from 'vitest';
import type {
    MaxBadgeProps,
    OverlayData as PublicOverlayData,
    MaxBadgeButtonProps,
    MaxTagProps,
    MaxBadgeButtonsGroupItem
} from '../../src/index';
import type {
    OverlayData as ComponentOverlayData
} from '../../src/components/MaxBadge.vue';

describe('Tipagem estrita do contrato de Overlay no MaxBadge e wrappers', () => {
    it('assegura que OverlayData é reexportado na raiz e compatível com o componente', () => {
        const item1: PublicOverlayData = { value: 'Item', color: '#10b981' };
        const item2: ComponentOverlayData = item1;
        expect(item2.value).toBe('Item');
        expect(item2.color).toBe('#10b981');

        assertType<PublicOverlayData>({ value: 'Teste' });
        assertType<ComponentOverlayData>({ value: 123, color: 'var(--max-primary-500)' });
    });

    it('aceita todas as variantes válidas em MaxBadgeProps', () => {
        const p1: MaxBadgeProps = { label: 'T1', overlay: undefined };
        const p2: MaxBadgeProps = { label: 'T2', overlay: true };
        const p3: MaxBadgeProps = { label: 'T3', overlay: false };
        const p4: MaxBadgeProps = { label: 'T4', overlay: 'Texto' };
        const p5: MaxBadgeProps = { label: 'T5', overlay: 42 };
        const p6: MaxBadgeProps = { label: 'T6', overlay: ['A', 'B'] };
        const p7: MaxBadgeProps = { label: 'T7', overlay: [1, 2, 3] };
        const p8: MaxBadgeProps = { label: 'T8', overlay: { value: 'Único' } };
        const p9: MaxBadgeProps = { label: 'T9', overlay: { value: 'Com Cor', color: '#ef4444' } };
        const p10: MaxBadgeProps = {
            label: 'T10',
            overlay: [
                { value: 'Item 1', color: '#10b981' },
                { value: 2 }
            ]
        };

        expect(p1.label).toBe('T1');
        expect(p2.overlay).toBe(true);
        expect(p3.overlay).toBe(false);
        expect(p4.overlay).toBe('Texto');
        expect(p5.overlay).toBe(42);
        expect(p6.overlay).toEqual(['A', 'B']);
        expect(p7.overlay).toEqual([1, 2, 3]);
        expect(p8.overlay).toEqual({ value: 'Único' });
        expect(p9.overlay).toEqual({ value: 'Com Cor', color: '#ef4444' });
        expect(p10.overlay).toHaveLength(2);
    });

    it('aceita múltiplos overlays nos contratos de wrappers (Button, Tag, GroupItem)', () => {
        const btnProps: MaxBadgeButtonProps = {
            label: 'Botão',
            overlay: [{ value: 'Alerta', color: '#f59e0b' }]
        };
        const tagProps: MaxTagProps = {
            label: 'Tag',
            overlay: ['Tag1', 'Tag2']
        };
        const groupItem: MaxBadgeButtonsGroupItem = {
            label: 'Grupo',
            value: 'g1',
            overlay: [10, 20]
        };

        expect(btnProps.label).toBe('Botão');
        expect(tagProps.label).toBe('Tag');
        expect(groupItem.value).toBe('g1');
    });

    it('rejeita tipos inválidos em tempo de compilação via @ts-expect-error', () => {
        // @ts-expect-error Objeto sem value obrigatório
        const _invalidObj: PublicOverlayData = { color: '#ffffff' };

        // @ts-expect-error Value booleano não é aceito em OverlayData
        const _invalidVal: PublicOverlayData = { value: true };

        // @ts-expect-error Array de booleanos não integra o contrato
        const _invalidBoolArr: MaxBadgeProps = { label: 'Inv', overlay: [true, false] };

        // @ts-expect-error Array misto de primitivas e objetos não é aceito
        const _invalidMixedArr: MaxBadgeProps = { label: 'Inv', overlay: ['texto', { value: 1 }] };

        expect(_invalidObj).toBeDefined();
        expect(_invalidVal).toBeDefined();
        expect(_invalidBoolArr).toBeDefined();
        expect(_invalidMixedArr).toBeDefined();
    });
});
