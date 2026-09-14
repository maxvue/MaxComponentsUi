import { describe, it, expect, vi } from 'vitest';
import { effectScope, nextTick, reactive } from 'vue';
import { useMirroredModel, type UseMirroredModelOptions } from '../../src/helpers/useMirroredModel';

function setup<T>(initial: T, options?: UseMirroredModelOptions<T>) {
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
        const { props, value } = setup<string>('123', { compare });

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

    it('round-trip com transform uppercase emite exatamente uma vez (elimina eco)', async () => {
        const props = reactive({ modelValue: '' });
        const emit = vi.fn((event: string, val: string) => {
            if (event === 'update:modelValue') props.modelValue = val;
        });
        const scope = effectScope();
        const value = scope.run(() => useMirroredModel(props, emit, {
            transform: (v: string) => v.toUpperCase()
        }))!;

        value.value = 'abc';
        await nextTick();
        await nextTick();

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'ABC');
        expect(props.modelValue).toBe('ABC');
        expect(value.value).toBe('abc');
        scope.stop();
    });

    it('mudança externa com prop já canônica atualiza o ref local sem reemissão espúria', async () => {
        const props = reactive({ modelValue: 'OLD' });
        const emit = vi.fn();
        const scope = effectScope();
        const value = scope.run(() => useMirroredModel(props, emit, {
            transform: (v: string) => v.toUpperCase()
        }))!;

        props.modelValue = 'NEW';
        await nextTick();

        expect(value.value).toBe('NEW');
        expect(emit).not.toHaveBeenCalled();
        scope.stop();
    });

    it('mudança externa com prop não-canônica produz no máximo uma emissão derivada normalizada', async () => {
        const props = reactive({ modelValue: 'OLD' });
        const emit = vi.fn((event: string, val: string) => {
            if (event === 'update:modelValue') props.modelValue = val;
        });
        const scope = effectScope();
        const value = scope.run(() => useMirroredModel(props, emit, {
            transform: (v: string) => v.toUpperCase()
        }))!;

        props.modelValue = 'raw-change';
        await nextTick();
        await nextTick();

        expect(value.value).toBe('raw-change');
        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'RAW-CHANGE');
        expect(props.modelValue).toBe('RAW-CHANGE');
        scope.stop();
    });

    it('sequência de digitações locais com round-trip mantém sincronização correta', async () => {
        const props = reactive({ modelValue: '' });
        const emit = vi.fn((event: string, val: string) => {
            if (event === 'update:modelValue') props.modelValue = val;
        });
        const scope = effectScope();
        const value = scope.run(() => useMirroredModel(props, emit, {
            transform: (v: string) => v.toUpperCase()
        }))!;

        value.value = 'a';
        await nextTick();
        expect(emit).toHaveBeenLastCalledWith('update:modelValue', 'A');

        value.value = 'ab';
        await nextTick();
        expect(emit).toHaveBeenLastCalledWith('update:modelValue', 'AB');

        value.value = 'abc';
        await nextTick();
        expect(emit).toHaveBeenLastCalledWith('update:modelValue', 'ABC');

        expect(emit).toHaveBeenCalledTimes(3);
        scope.stop();
    });

    it('immediate: true inicializa guard e suprime eco no round-trip inicial', async () => {
        const props = reactive({ modelValue: 'initial' });
        const emit = vi.fn((event: string, val: string) => {
            if (event === 'update:modelValue') props.modelValue = val;
        });
        const scope = effectScope();
        scope.run(() => useMirroredModel(props, emit, {
            immediate: true,
            transform: (v: string) => v.toUpperCase()
        }))!;

        await nextTick();
        await nextTick();

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith('update:modelValue', 'INITIAL');
        expect(props.modelValue).toBe('INITIAL');
        scope.stop();
    });

    it('trata undefined como valor canônico legítimo sem ambiguidade com sentinela inicial (F03)', async () => {
        const props = reactive({ modelValue: 'inicial' as string | undefined });
        const emit = vi.fn((event: string, val: string | undefined) => {
            if (event === 'update:modelValue') props.modelValue = val;
        });
        const scope = effectScope();
        const value = scope.run(() => useMirroredModel(props, emit))!;

        // 1. Emissão local de undefined
        value.value = undefined;
        await nextTick();
        await nextTick();

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith('update:modelValue', undefined);
        expect(props.modelValue).toBeUndefined();

        // 2. Eco do pai enviando undefined não deve disparar nova emissão
        props.modelValue = undefined;
        await nextTick();
        expect(emit).toHaveBeenCalledTimes(1);

        // 3. Mudança externa genuína posterior para um valor definido
        props.modelValue = 'definido';
        await nextTick();
        expect(value.value).toBe('definido');

        // 4. Nova transição para undefined deve ser detectada e emitida
        value.value = undefined;
        await nextTick();
        await nextTick();
        expect(emit).toHaveBeenCalledTimes(2);
        expect(emit).toHaveBeenLastCalledWith('update:modelValue', undefined);

        scope.stop();
    });
});
