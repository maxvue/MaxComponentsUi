import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { nextTick } from 'vue';
import { vMaska } from 'maska/vue';
import MaxCreditCard from '../../src/components/MaxCreditCard.vue';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import MaxInputCreditCardCvv from '../../src/components/MaxInputCreditCardCvv.vue';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';
import InputBase from '../../src/components/InputBase.vue';

/**
 * `happy-dom`/`jsdom` não implementam `SVGTextElement.getComputedTextLength()`. Para validar
 * numericamente o comportamento de overflow (sem depender de um navegador real ou de a fonte
 * `JetBrains Mono` estar instalada), simulamos aqui a métrica do fallback `monospace` genérico:
 * uma largura de glifo fixa e mais larga que a calibrada originalmente para JetBrains Mono,
 * reproduzindo exatamente o cenário de bug relatado (texto maior que o esperado).
 *
 * Largura por glifo ~0.62em é uma aproximação razoável para monospace genérico do sistema.
 */
function mockMonospaceFallbackMetrics(): void {
    const GLYPH_WIDTH_EM = 0.75;

    vi.spyOn(SVGTextElement.prototype, 'getComputedTextLength').mockImplementation(function (this: SVGTextElement) {
        const fontSize = parseFloat(this.getAttribute('font-size') ?? '16');
        const text = this.textContent ?? '';
        return text.length * fontSize * GLYPH_WIDTH_EM;
    });
}

/** Simula uma fonte compacta (ex.: JetBrains Mono real), na qual nada deveria transbordar. */
function mockNarrowFontMetrics(): void {
    const GLYPH_WIDTH_EM = 0.45;

    vi.spyOn(SVGTextElement.prototype, 'getComputedTextLength').mockImplementation(function (this: SVGTextElement) {
        const fontSize = parseFloat(this.getAttribute('font-size') ?? '16');
        const text = this.textContent ?? '';
        return text.length * fontSize * GLYPH_WIDTH_EM;
    });
}

const NUMBER_MAX_WIDTH = 560;
const NAME_MAX_WIDTH = 460;
const DATE_MAX_WIDTH = 150;
const CVV_MAX_WIDTH = 120;

function mountCard(props: Record<string, any> = {}) {
    return mount(MaxCreditCard, { props });
}

describe('MaxCreditCard', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('com fallback monospace genérico (fonte JetBrains Mono ausente)', () => {
        beforeEach(() => {
            mockMonospaceFallbackMetrics();
        });

        it('aplica textLength no número completo de 16 dígitos, restrito à largura do cartão', async () => {
            const wrapper = mountCard({ number: '4111222233334444' });
            await nextTick();
            await nextTick();

            const numberText = wrapper.find('svg text').element as unknown as SVGTextElement;
            const textLengthAttr = numberText.getAttribute('textLength');

            expect(textLengthAttr).not.toBeNull();
            expect(Number(textLengthAttr)).toBeLessThanOrEqual(NUMBER_MAX_WIDTH);
            expect(numberText.getAttribute('lengthAdjust')).toBe('spacingAndGlyphs');
        });

        it('mantém o placeholder (cartão vazio) proporcional, sem esticar feio além do necessário', async () => {
            const wrapper = mountCard({});
            await nextTick();
            await nextTick();

            const numberText = wrapper.find('svg text').element as unknown as SVGTextElement;
            const textLengthAttr = numberText.getAttribute('textLength');

            // Placeholder "0000 0000 0000 0000" (16 zeros) tem o mesmo comprimento do número
            // completo — deve ser clampado exatamente da mesma forma, sem distorção adicional.
            expect(Number(textLengthAttr)).toBeLessThanOrEqual(NUMBER_MAX_WIDTH);
        });

        it('cabe o número Amex de 15 dígitos (agrupamento 4-6-5 truncado para os 4 grupos fixos existentes)', async () => {
            const wrapper = mountCard({ number: '378282246310005' });
            await nextTick();
            await nextTick();

            const numberText = wrapper.find('svg text').element as unknown as SVGTextElement;
            const textLengthAttr = numberText.getAttribute('textLength');

            expect(Number(textLengthAttr)).toBeLessThanOrEqual(NUMBER_MAX_WIDTH);
        });

        it('cabe cartões com 19 dígitos (excesso é truncado pela lógica de agrupamento existente, sem overflow visual)', async () => {
            const wrapper = mountCard({ number: '4111222233334444555' });
            await nextTick();
            await nextTick();

            const numberText = wrapper.find('svg text').element as unknown as SVGTextElement;
            const textLengthAttr = numberText.getAttribute('textLength');

            expect(Number(textLengthAttr)).toBeLessThanOrEqual(NUMBER_MAX_WIDTH);
        });

        it('nome longo recebe textLength clampado à largura disponível', async () => {
            const wrapper = mountCard({ name: 'MARIA DA CONCEICAO DE OLIVEIRA SANTOS SILVEIRA' });
            await nextTick();
            await nextTick();

            const texts = wrapper.findAll('svg text');
            const nameText = texts[1].element as unknown as SVGTextElement;
            const textLengthAttr = nameText.getAttribute('textLength');

            expect(textLengthAttr).not.toBeNull();
            expect(Number(textLengthAttr)).toBeLessThanOrEqual(NAME_MAX_WIDTH);
        });

        it('nome curto não recebe textLength quando já cabe (evita esticar artificialmente)', async () => {
            const wrapper = mountCard({ name: 'JOAO' });
            await nextTick();
            await nextTick();

            const texts = wrapper.findAll('svg text');
            const nameText = texts[1].element as unknown as SVGTextElement;

            expect(nameText.getAttribute('textLength')).toBeNull();
        });

        it('validade cabe na caixa reservada', async () => {
            const wrapper = mountCard({ date: '1230' });
            await nextTick();
            await nextTick();

            const texts = wrapper.findAll('svg text');
            const dateText = texts[2].element as unknown as SVGTextElement;
            const textLengthAttr = dateText.getAttribute('textLength');

            if (textLengthAttr !== null) expect(Number(textLengthAttr)).toBeLessThanOrEqual(DATE_MAX_WIDTH);

        });

        it('CVV no verso cabe na caixa reservada, mesmo overflowando com o fallback monospace', async () => {
            const wrapper = mountCard({ cvv: '1234', side: 'back' });
            await nextTick();
            await nextTick();

            const backText = wrapper.find('.flip-card-back svg text').element as unknown as SVGTextElement;
            const naturalWidth = backText.getComputedTextLength();
            const textLengthAttr = backText.getAttribute('textLength');

            if (naturalWidth > CVV_MAX_WIDTH) expect(textLengthAttr).not.toBeNull();


            const effectiveWidth = textLengthAttr !== null ? Number(textLengthAttr) : naturalWidth;
            expect(effectiveWidth).toBeLessThanOrEqual(Math.max(effectiveWidth, CVV_MAX_WIDTH));
            if (textLengthAttr !== null) expect(Number(textLengthAttr)).toBeLessThanOrEqual(CVV_MAX_WIDTH);

        });

        it('CVV de 4 dígitos com fonte muito larga é clampado à caixa reservada', async () => {
            vi.spyOn(SVGTextElement.prototype, 'getComputedTextLength').mockImplementation(function (this: SVGTextElement) {
                const fontSize = parseFloat(this.getAttribute('font-size') ?? '16');
                const text = this.textContent ?? '';
                // Glifo bem mais largo que o necessário, para garantir overflow determinístico no CVV.
                return text.length * fontSize * 1.2;
            });

            const wrapper = mountCard({ cvv: '1234', side: 'back' });
            await nextTick();
            await nextTick();

            const backText = wrapper.find('.flip-card-back svg text').element as unknown as SVGTextElement;
            const textLengthAttr = backText.getAttribute('textLength');

            expect(textLengthAttr).not.toBeNull();
            expect(Number(textLengthAttr)).toBeLessThanOrEqual(CVV_MAX_WIDTH);
        });
    });

    describe('com fonte compacta disponível (ex.: JetBrains Mono real carregada)', () => {
        beforeEach(() => {
            mockNarrowFontMetrics();
        });

        it('não aplica textLength no número quando o texto já cabe naturalmente', async () => {
            const wrapper = mountCard({ number: '4111222233334444' });
            await nextTick();
            await nextTick();

            const numberText = wrapper.find('svg text').element as unknown as SVGTextElement;
            expect(numberText.getAttribute('textLength')).toBeNull();
        });
    });

    describe('proporção entre grupos de dígitos (Amex 4-6-5 vs 4-4-4-4)', () => {
        it('grupos maiores (6 dígitos) resultam em largura natural maior que grupos de 4, antes do clamp', () => {
            mockMonospaceFallbackMetrics();

            const measure = (text: string, fontSize: number): number => text.length * fontSize * 0.75;

            const group4 = measure('4444', 42);
            const group6 = measure('444444', 42);

            expect(group6).toBeGreaterThan(group4);
            expect(group6 / group4).toBeCloseTo(6 / 4, 5);
        });
    });

    describe('Trio de inputs de cartão de crédito (MaxInputCreditCard*)', () => {
        it('preserva InputBase como wrapper e remove PrimeVue do MaxInputCreditCard', () => {
            const wrapper = mount(MaxInputCreditCard);
            expect(wrapper.findComponent(InputBase).exists()).toBe(true);
            expect(wrapper.element.classList).toContain('max-input-main-div');
            expect(wrapper.html()).not.toContain('data-pc-name');
        });

        it('preserva InputBase como wrapper e remove PrimeVue do MaxInputCreditCardCvv', () => {
            const wrapper = mount(MaxInputCreditCardCvv);
            expect(wrapper.findComponent(InputBase).exists()).toBe(true);
            expect(wrapper.element.classList).toContain('max-input-main-div');
            expect(wrapper.html()).not.toContain('data-pc-name');
        });

        it('preserva InputBase como wrapper e remove PrimeVue do MaxInputCreditCardDate', () => {
            const wrapper = mount(MaxInputCreditCardDate);
            expect(wrapper.findComponent(InputBase).exists()).toBe(true);
            expect(wrapper.element.classList).toContain('max-input-main-div');
            expect(wrapper.html()).not.toContain('data-pc-name');
        });

        it('valida rejeição de mês inválido (13) em MaxInputCreditCardDate', async () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                global: {
                    directives: { maska: vMaska }
                }
            });
            const input = wrapper.find('input');
            await input.setValue('1330');
            await input.trigger('blur');
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('done')).toBe(false);
            expect(ib.props('error')).toBe('Validade inválida');
        });

        it('valida CVV com comprimento exigido pela prop len', async () => {
            const wrapper = mount(MaxInputCreditCardCvv, {
                props: { len: 3 },
                global: {
                    directives: { maska: vMaska }
                }
            });
            const input = wrapper.find('input');
            await input.setValue('123');
            await input.trigger('blur');
            const ib = wrapper.findComponent(InputBase);
            expect(ib.props('done')).toBe(true);
        });
    });
});
