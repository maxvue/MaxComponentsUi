import { describe, it, expect, vi } from 'vitest';
import { effectScope, nextTick, reactive } from 'vue';
import { useMirroredModel } from '../../src/helpers/useMirroredModel';

function setup<T>(initial: T, options?: Parameters<typeof useMirroredModel>[2]) {
    const props = reactive({ modelValue: initial }) as { modelValue: T };
    const emit = vi.fn();
    const scope = effectScope();
    const value = scope.run(() => useMirroredModel(props, emit as any, options))!;
    return { props, emit, value, scope };
}

describe('useMirroredModel', () => {
    it('inicializa o ref local com props.modelValue', () => {
        const { value } = setup('abc');
        expect(value.value).toBe('abc');
    });

    it('mudanca local emite update:modelValue', async () => {
        const { value, emit } = setup('');
        value.value = 'novo';
        await nextTick();
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'novo');
    });

    it('nao emite no mount por padrao (immediate: false)', async () => {
        const { emit } = setup('inicial');
        await nextTick();
        expect(emit).not.toHaveBeenCalled();
    });

    it('emite no mount quando immediate: true', async () => {
        const { emit } = setup('inicial', { immediate: true });
        await nextTick();
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'inicial');
    });

    it('mudanca externa (props.modelValue) atualiza o ref local', async () => {
        const { props, value } = setup('a');
        props.modelValue = 'b';
        await nextTick();
        expect(value.value).toBe('b');
    });

    it('aplica transform antes de emitir', async () => {
        const { value, emit } = setup('', { transform: (v: string) => v.toUpperCase() });
        value.value = 'abc';
        await nextTick();
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'ABC');
    });

    it('nao reatribui o ref local quando compare considera os valores equivalentes (evita eco)', async () => {
        const compare = vi.fn((a: string, b: string) => a.replace(/\D/g, '') === b.replace(/\D/g, ''));
        const { props, value } = setup('123', { compare });

        value.value = '123-456';
        await nextTick();

        // Props externas mudam para um valor "equivalente" ao ref local
        // (mesmos digitos, formatacao diferente) — compare deve impedir a
        // reatribuicao do ref local, preservando a formatacao já digitada.
        props.modelValue = '123456';
        await nextTick();

        expect(compare).toHaveBeenCalled();
        expect(value.value).toBe('123-456');
    });

    it('usa igualdade estrita como compare default', async () => {
        const { props, value } = setup('x');
        props.modelValue = 'x';
        await nextTick();
        // valor identico -> nenhuma reatribuicao necessaria, mas o resultado
        // observavel e o mesmo (permanece 'x')
        expect(value.value).toBe('x');

        props.modelValue = 'y';
        await nextTick();
        expect(value.value).toBe('y');
    });

    it('funciona com valores numericos e transform de tipo', async () => {
        const { value, emit } = setup(0, { transform: (v: number) => v * 2 });
        value.value = 5;
        await nextTick();
        expect(emit).toHaveBeenCalledWith('update:modelValue', 10);
    });
});
