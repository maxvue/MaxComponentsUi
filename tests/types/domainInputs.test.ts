import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
    PhaseValue,
    WireSizeValue,
    WireTypeValue,
    AiExecutionTypeValue,
    AiBillingModeValue,
    AiBillingUnitValue,
    PaymentMethodValue,
    ScheduleTypeValue,
    MonthOccurrenceValue,
    ContentTypeValue,
    MaxInputPhaseProps,
    MaxInputWireSizeProps,
    MaxInputPaymentMethodProps
} from '../../src/types/domainInputs';

describe('domainInputs types', () => {
    it('valida PhaseValue como união estrita de 1 | 2 | 3', () => {
        expectTypeOf<PhaseValue>().toEqualTypeOf<1 | 2 | 3>();

        const valid: PhaseValue = 1;
        expect(valid).toBe(1);

        // @ts-expect-error - Não deve aceitar strings numéricas
        const _invalidStr: PhaseValue = '1';

        // @ts-expect-error - Não deve aceitar números fora do domínio
        const _invalidNum: PhaseValue = 4;
    });

    it('valida WireSizeValue como 24 seções numéricas em mm²', () => {
        expectTypeOf<WireSizeValue>().toMatchTypeOf<number>();

        const valid05: WireSizeValue = 0.5;
        const valid25: WireSizeValue = 2.5;
        const valid1000: WireSizeValue = 1000;
        expect(valid05).toBe(0.5);
        expect(valid25).toBe(2.5);
        expect(valid1000).toBe(1000);

        // @ts-expect-error - Não deve aceitar seção inexistente
        const _invalidWire: WireSizeValue = 3.5;

        // @ts-expect-error - Não deve aceitar string de bitola
        const _invalidStrWire: WireSizeValue = '2.5 mm²';
    });

    it('valida WireTypeValue combinando material e temperatura de isolamento', () => {
        expectTypeOf<WireTypeValue>().toEqualTypeOf<'copper-70' | 'copper-90' | 'aluminum-70' | 'aluminum-90'>();

        const valid: WireTypeValue = 'copper-70';
        expect(valid).toBe('copper-70');

        // @ts-expect-error - Não deve aceitar apenas cobre
        const _invalidMat: WireTypeValue = 'copper';
    });

    it('valida AiExecutionTypeValue e AiBillingModeValue', () => {
        expectTypeOf<AiExecutionTypeValue>().toEqualTypeOf<'cloud' | 'local'>();
        expectTypeOf<AiBillingModeValue>().toEqualTypeOf<'dollar' | 'bonus' | 'free' | 'local'>();

        // @ts-expect-error - Tipo desconhecido de execução
        const _invalidExec: AiExecutionTypeValue = 'hybrid';

        // @ts-expect-error - Forma inválida de cobrança
        const _invalidBilling: AiBillingModeValue = 'euro';
    });

    it('valida AiBillingUnitValue com unidades de tempo, contagem e tokens', () => {
        expectTypeOf<AiBillingUnitValue>().toEqualTypeOf<
            'm_tokens' | 'tokens' | 'unity' | 'characters' | 'second' | 'minute' | 'hour'
        >();

        // @ts-expect-error - Unidade inexistente
        const _invalidUnit: AiBillingUnitValue = 'day';
    });

    it('valida PaymentMethodValue restrito a pix e credit_card', () => {
        expectTypeOf<PaymentMethodValue>().toEqualTypeOf<'pix' | 'credit_card'>();

        // @ts-expect-error - Boleto não faz parte do catálogo deste lote
        const _invalidPay: PaymentMethodValue = 'boleto';

        // @ts-expect-error - Débito não faz parte do catálogo
        const _invalidDebit: PaymentMethodValue = 'debit';
    });

    it('valida ScheduleTypeValue e MonthOccurrenceValue', () => {
        expectTypeOf<ScheduleTypeValue>().toEqualTypeOf<
            'specific_dates' | 'weekly' | 'monthly_days' | 'monthly_nth_weekday'
        >();
        expectTypeOf<MonthOccurrenceValue>().toEqualTypeOf<1 | 2 | 3 | 4 | 5>();

        // @ts-expect-error - "last" não é aceito; 5ª ocorrência é puramente ordinal
        const _invalidOccur: MonthOccurrenceValue = 'last';

        // @ts-expect-error - 0 ou 6 não existem
        const _zeroOccur: MonthOccurrenceValue = 0;
    });

    it('valida ContentTypeValue com os 5 formatos aceitos', () => {
        expectTypeOf<ContentTypeValue>().toEqualTypeOf<'image' | 'pdf' | 'audio' | 'text' | 'url'>();

        // @ts-expect-error - Formato não mapeado
        const _invalidContent: ContentTypeValue = 'video';
    });

    it('valida interfaces de props públicas', () => {
        const phaseProps: MaxInputPhaseProps = {
            modelValue: 2,
            label: 'Fases',
            required: true,
            filter: false
        };
        expect(phaseProps.modelValue).toBe(2);

        const wireProps: MaxInputWireSizeProps = {
            modelValue: 2.5,
            filter: true
        };
        expect(wireProps.modelValue).toBe(2.5);

        const payProps: MaxInputPaymentMethodProps = {
            modelValue: 'pix',
            clearable: true
        };
        expect(payProps.modelValue).toBe('pix');
    });
});
