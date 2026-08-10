import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { useInputValidation } from '../../src/helpers/useInputValidation';

describe('useInputValidation', () => {
    it('chama o validator com o valor atual e reflete o resultado em done', () => {
        const validator = vi.fn((v: string) => v === 'ok');
        const value = ref('ok');

        const { done } = useInputValidation({ validator, value });

        expect(done.value).toBe(true);
        expect(validator).toHaveBeenCalledWith('ok');
    });

    it('done reflete false quando validator retorna false', () => {
        const value = ref('errado');
        const { done } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(done.value).toBe(false);
    });

    it('done prop explicita do pai tem prioridade sobre a validacao interna', () => {
        const value = ref('errado');
        const doneOverride = ref(true);
        const { done } = useInputValidation({ validator: (v) => v === 'ok', value, done: doneOverride });
        expect(done.value).toBe(true);
    });

    it('caution e derivado de done=false quando nao ha override', () => {
        const value = ref('errado');
        const { caution } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(caution.value).toBe(true);
    });

    it('caution e false quando done e true e nao ha override', () => {
        const value = ref('ok');
        const { caution } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(caution.value).toBe(false);
    });

    // Prova da correcao do achado 22: override explicito de caution do pai
    // deve passar DIRETO, sem AND com o estado interno de validacao (ex.:
    // done === false). Mesmo quando o valor e valido (done=true), uma
    // caution=true explicita do pai deve prevalecer.
    it('achado 22: override de caution do pai passa direto, mesmo com done=true internamente', () => {
        const value = ref('ok');
        const cautionOverride = ref<string | boolean | undefined>(true);
        const { caution } = useInputValidation({ validator: (v) => v === 'ok', value, caution: cautionOverride });
        expect(caution.value).toBe(true);
    });

    it('achado 22: override de caution=false do pai suprime a caution mesmo com valor invalido', () => {
        const value = ref('errado');
        const cautionOverride = ref<string | boolean | undefined>(false);
        const { caution } = useInputValidation({ validator: (v) => v === 'ok', value, caution: cautionOverride });
        expect(caution.value).toBe(false);
    });

    it('achado 22: override de caution como string do pai passa direto e vira a mensagem de erro', () => {
        const value = ref('ok');
        const cautionOverride = ref<string | boolean | undefined>('Atenção customizada');
        const { caution, error } = useInputValidation({ validator: (v) => v === 'ok', value, caution: cautionOverride });
        expect(caution.value).toBe(true);
        expect(error.value).toBe('Atenção customizada');
    });

    it('error e null quando nao ha caution', () => {
        const value = ref('ok');
        const { error } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(error.value).toBeNull();
    });

    it('error usa mensagem de campo obrigatorio quando required e valor vazio', () => {
        const value = ref('');
        const { error } = useInputValidation({ validator: (v) => v === 'ok', value, required: true });
        expect(error.value).toBe('Campo obrigatório');
    });

    it('error usa requiredMessage customizada quando fornecida', () => {
        const value = ref('');
        const { error } = useInputValidation({
            validator: (v) => v === 'ok',
            value,
            required: true,
            requiredMessage: 'Preencha este campo'
        });
        expect(error.value).toBe('Preencha este campo');
    });

    it('error usa mensagem generica de invalido quando ha valor mas ele e invalido', () => {
        const value = ref('errado');
        const { error } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(error.value).toBe('Valor inválido');
    });

    it('error usa invalidMessage customizada quando fornecida', () => {
        const value = ref('errado');
        const { error } = useInputValidation({
            validator: (v) => v === 'ok',
            value,
            invalidMessage: 'CPF inválido'
        });
        expect(error.value).toBe('CPF inválido');
    });

    it('required aceita boolean simples (nao apenas Ref)', () => {
        const value = ref('');
        const { error } = useInputValidation({ validator: (v) => v === 'ok', value, required: true });
        expect(error.value).toBe('Campo obrigatório');
    });

    it('onBlur existe e pode ser chamado sem lancar erro', () => {
        const value = ref('ok');
        const { onBlur } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(() => onBlur()).not.toThrow();
    });

    it('reage a mudancas no value (reatividade)', () => {
        const value = ref('errado');
        const { done } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(done.value).toBe(false);

        value.value = 'ok';
        expect(done.value).toBe(true);
    });
});
