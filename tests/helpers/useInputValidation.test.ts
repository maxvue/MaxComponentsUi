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

    it('caution e derivado de done=false quando nao ha override apos interacao', () => {
        const value = ref('errado');
        const { caution, onBlur } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(caution.value).toBe(false);
        onBlur();
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

    it('campo obrigatorio vazio nao exibe erro no mount e exibe apos blur', () => {
        const value = ref('');
        const { error, onBlur, done } = useInputValidation({ validator: (v) => v === 'ok', value, required: true });
        expect(error.value).toBeNull();
        expect(done.value).toBeNull();
        onBlur();
        expect(error.value).toBe('Campo obrigatório');
        expect(done.value).toBe(false);
    });

    it('error usa requiredMessage customizada quando fornecida apos blur', () => {
        const value = ref('');
        const { error, onBlur } = useInputValidation({
            validator: (v) => v === 'ok',
            value,
            required: true,
            requiredMessage: 'Preencha este campo'
        });
        expect(error.value).toBeNull();
        onBlur();
        expect(error.value).toBe('Preencha este campo');
    });

    it('error usa mensagem generica de invalido quando ha valor mas ele e invalido apos blur', () => {
        const value = ref('errado');
        const { error, onBlur } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(error.value).toBeNull();
        onBlur();
        expect(error.value).toBe('Valor inválido');
    });

    it('error usa invalidMessage customizada quando fornecida apos blur', () => {
        const value = ref('errado');
        const { error, onBlur } = useInputValidation({
            validator: (v) => v === 'ok',
            value,
            invalidMessage: 'CPF inválido'
        });
        onBlur();
        expect(error.value).toBe('CPF inválido');
    });

    it('required aceita boolean simples (nao apenas Ref)', () => {
        const value = ref('');
        const { error, onBlur } = useInputValidation({ validator: (v) => v === 'ok', value, required: true });
        onBlur();
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

    it('submit valida todos os campos e retorna false se invalido, true se valido', () => {
        const value = ref('');
        const validation = useInputValidation({ validator: (v) => v === 'ok', value, required: true });
        expect(validation.error.value).toBeNull();

        const success = validation.submit();
        expect(success).toBe(false);
        expect(validation.submitted.value).toBe(true);
        expect(validation.error.value).toBe('Campo obrigatório');

        value.value = 'ok';
        expect(validation.submit()).toBe(true);
    });

    it('correcao valida remove o erro imediatamente na digitacao', () => {
        const value = ref('errado');
        const validation = useInputValidation({ validator: (v) => v === 'correto', value });
        validation.onBlur();
        expect(validation.error.value).toBe('Valor inválido');

        // Durante correcao, proxima digitacao valida limpa o erro
        value.value = 'correto';
        validation.onInput();
        expect(validation.error.value).toBeNull();
        expect(validation.done.value).toBe(true);
        expect(validation.caution.value).toBe(false);
    });

    it('campo opcional vazio permanece neutro (done=null) mesmo apos blur', () => {
        const value = ref('');
        const validation = useInputValidation({ validator: (v) => v === 'ok', value, required: false });
        expect(validation.done.value).toBeNull();
        expect(validation.error.value).toBeNull();

        validation.onBlur();
        expect(validation.done.value).toBeNull();
        expect(validation.error.value).toBeNull();
        expect(validation.caution.value).toBe(false);
    });

    it('suporta modo eager/immediate para validacao imediata no mount', () => {
        const value = ref('');
        const validation = useInputValidation({
            validator: (v) => v === 'ok',
            value,
            required: true,
            immediate: true
        });
        expect(validation.error.value).toBe('Campo obrigatório');
        expect(validation.caution.value).toBe(true);
    });

    it('trata o numero zero como valor preenchido (nao vazio)', () => {
        const value = ref<number | string>(0);
        const validation = useInputValidation({
            validator: (v) => typeof v === 'number' && v >= 0,
            value,
            required: true
        });
        expect(validation.isValid.value).toBe(true);
        expect(validation.done.value).toBe(true);
        expect(validation.error.value).toBeNull();
    });

    it('valida targetValue para confirmacao de valor', () => {
        const value = ref('senha1');
        const targetValue = ref('senha2');
        const validation = useInputValidation({
            validator: (v) => Boolean(v),
            value,
            targetValue
        });
        validation.onBlur();
        expect(validation.isValid.value).toBe(false);
        expect(validation.error.value).toBe('Valor inválido');

        targetValue.value = 'senha1';
        expect(validation.isValid.value).toBe(true);
        expect(validation.error.value).toBeNull();
    });

    it('reset restaura o estado pristine do helper', () => {
        const value = ref('');
        const validation = useInputValidation({ validator: (v) => v === 'ok', value, required: true });
        validation.onBlur();
        expect(validation.error.value).toBe('Campo obrigatório');

        validation.reset();
        expect(validation.touched.value).toBe(false);
        expect(validation.dirty.value).toBe(false);
        expect(validation.submitted.value).toBe(false);
        expect(validation.error.value).toBeNull();
    });
});
