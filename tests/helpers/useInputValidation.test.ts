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

    it('caution prop explicita do pai tem prioridade sobre done=true', () => {
        const value = ref('ok');
        const cautionOverride = ref(true);
        const { caution } = useInputValidation({ validator: (v) => v === 'ok', value, caution: cautionOverride });
        expect(caution.value).toBe(true);
    });

    it('caution prop explicita do pai tem prioridade sobre done=false', () => {
        const value = ref('errado');
        const cautionOverride = ref(false);
        const { caution } = useInputValidation({ validator: (v) => v === 'ok', value, caution: cautionOverride });
        expect(caution.value).toBe(false);
    });

    it('error reflete a string de caution quando caution e string', () => {
        const value = ref('errado');
        const cautionOverride = ref('Mensagem customizada');
        const { error } = useInputValidation({ validator: (v) => v === 'ok', value, caution: cautionOverride });
        expect(error.value).toBe('Mensagem customizada');
    });

    it('error e null quando valor e valido', () => {
        const value = ref('ok');
        const { error } = useInputValidation({ validator: (v) => v === 'ok', value });
        expect(error.value).toBeNull();
    });

    it('error e null no mount para campo obrigatorio vazio (estado neutro) e exibe erro apos blur', () => {
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

    it('suporta isComplete: formato incompleto não exibe erro antes do blur e exibe após blur', () => {
        const value = ref('123');
        const validation = useInputValidation({
            validator: (v) => v === '12345',
            isComplete: (v) => String(v).length === 5,
            value,
            invalidMessage: 'Formato inválido'
        });

        // Incompleto, não tocado: sem erro
        expect(validation.done.value).toBeNull();
        expect(validation.caution.value).toBe(false);
        expect(validation.error.value).toBeNull();

        // Usuário digita mais um caractere (continua incompleto)
        value.value = '1234';
        validation.onInput();
        expect(validation.done.value).toBeNull();
        expect(validation.caution.value).toBe(false);
        expect(validation.error.value).toBeNull();

        // Usuário perde o foco: agora exibe erro
        validation.onBlur();
        expect(validation.done.value).toBe(false);
        expect(validation.caution.value).toBe(true);
        expect(validation.error.value).toBe('Formato inválido');

        // Formato completo mas inválido exibe erro imediatamente
        value.value = '99999';
        validation.onInput();
        expect(validation.done.value).toBe(false);
        expect(validation.caution.value).toBe(true);
        expect(validation.error.value).toBe('Formato inválido');

        // Correção para válido limpa o erro
        value.value = '12345';
        validation.onInput();
        expect(validation.done.value).toBe(true);
        expect(validation.caution.value).toBe(false);
        expect(validation.error.value).toBeNull();
    });

    it('suporta mensagens dinâmicas reativas (Ref e getter)', () => {
        const value = ref('errado');
        const msg = ref('Primeiro erro');
        const validation = useInputValidation({
            validator: (v) => v === 'ok',
            value,
            invalidMessage: msg
        });
        validation.onBlur();
        expect(validation.error.value).toBe('Primeiro erro');

        msg.value = 'Segundo erro';
        expect(validation.error.value).toBe('Segundo erro');
    });
});
