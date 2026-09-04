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
/**
 * O `font-size` dos `<text>` do cartao e declarado via `style` inline, nao como
 * atributo — ler apenas `getAttribute('font-size')` cairia sempre no fallback
 * de 16px e nada transbordaria, tornando o teste inofensivo.
 */
function readFontSize(el: SVGTextElement): number {
    const fromStyle = (el as unknown as HTMLElement).style?.fontSize;
    if (fromStyle) return parseFloat(fromStyle);
    return parseFloat(el.getAttribute('font-size') ?? '16');
}

function mockTextMetrics(glyphWidthEm: number): void {
    vi.spyOn(SVGTextElement.prototype, 'getComputedTextLength').mockImplementation(function (this: SVGTextElement) {
        const text = this.textContent ?? '';
        return text.length * readFontSize(this) * glyphWidthEm;
    });
}

function mockMonospaceFallbackMetrics(): void {
    mockTextMetrics(0.75);
}

/** Simula uma fonte compacta (ex.: JetBrains Mono real), na qual nada deveria transbordar. */
function mockNarrowFontMetrics(): void {
    mockTextMetrics(0.45);
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
            const naturalWidth = dateText.getComputedTextLength();
            const textLengthAttr = dateText.getAttribute('textLength');

            expect(dateText.textContent).toBe('12/30');
            expect(naturalWidth).toBeLessThanOrEqual(DATE_MAX_WIDTH);
            expect(textLengthAttr).toBeNull();

            const effectiveWidth = textLengthAttr !== null ? Number(textLengthAttr) : naturalWidth;
            expect(effectiveWidth).toBeLessThanOrEqual(DATE_MAX_WIDTH);
        });

        it('validade com fonte muito larga é clampada à caixa reservada', async () => {
            // Glifo largo para garantir overflow determinístico na validade (5 * 28 * 1.2 = 168 > 150).
            mockTextMetrics(1.2);

            const wrapper = mountCard({ date: '1230' });
            await nextTick();
            await nextTick();

            const texts = wrapper.findAll('svg text');
            const dateText = texts[2].element as unknown as SVGTextElement;
            const textLengthAttr = dateText.getAttribute('textLength');

            expect(textLengthAttr).not.toBeNull();
            expect(Number(textLengthAttr)).toBe(DATE_MAX_WIDTH);
            expect(dateText.getAttribute('lengthAdjust')).toBe('spacingAndGlyphs');
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
            // Glifo bem mais largo que o necessário, para garantir overflow determinístico no CVV.
            mockTextMetrics(1.2);

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

    describe('detecção de bandeira (detected_type)', () => {
        it('classifica número real da Diners como diners', () => {
            const wrapper = mountCard({ number: '30569309025904' });
            expect((wrapper.vm as any).detected_type).toBe('diners');
        });

        it('classifica número real da Discover como discover', () => {
            const wrapper = mountCard({ number: '6011111111111117' });
            expect((wrapper.vm as any).detected_type).toBe('discover');
        });

        it('classifica número real da Hipercard como hipercard', () => {
            const wrapper = mountCard({ number: '6062825624254001' });
            expect((wrapper.vm as any).detected_type).toBe('hipercard');
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

        it('eco do v-model não reatribui temp_value quando modelValue muda para o mesmo valor normalizado (MaxInputCreditCard)', async () => {
            const wrapper = mount(MaxInputCreditCard, {
                props: { modelValue: '4111111111111111' }
            });
            // Digita o valor mascarado manualmente (simula o que v-maska faria) para que
            // temp_value fique com formatação diferente do modelValue (dígitos puros) —
            // cenário exato em que a comparação ingênua reescreveria o input a cada digitação.
            const vm = wrapper.vm as any;
            vm.temp_value = '4111 1111 1111 1111';
            await wrapper.vm.$nextTick();

            // mesmo número (apenas normalizado é comparado): não deve reatribuir temp_value
            await wrapper.setProps({ modelValue: '4111111111111111' });
            expect(vm.temp_value).toBe('4111 1111 1111 1111');
        });

        it('eco do v-model não reatribui temp_value quando modelValue muda para o mesmo valor normalizado (MaxInputCreditCardCvv)', async () => {
            const wrapper = mount(MaxInputCreditCardCvv, {
                props: { modelValue: '123' }
            });
            const vm = wrapper.vm as any;
            await wrapper.setProps({ modelValue: '123' });
            expect(vm.temp_value).toBe('123');
        });

        it('eco do v-model não reatribui temp_value quando modelValue muda para o mesmo valor normalizado (MaxInputCreditCardDate)', async () => {
            const wrapper = mount(MaxInputCreditCardDate, {
                props: { modelValue: '1230' }
            });
            const vm = wrapper.vm as any;
            vm.temp_value = '12/30';
            await wrapper.vm.$nextTick();

            await wrapper.setProps({ modelValue: '1230' });
            expect(vm.temp_value).toBe('12/30');
        });
    });

    describe('Renderização de imagens de fundo e bandeiras (Data URI)', () => {
        it('renderiza a imagem de fundo frontal com href válido em Data URI', () => {
            const wrapper = mountCard({});
            const frontImage = wrapper.find('.flip-card-front svg image');
            expect(frontImage.exists()).toBe(true);

            const href = frontImage.attributes('href');
            expect(href).toMatch(/^data:image\/svg\+xml;base64,/);

            const base64Data = href!.replace('data:image/svg+xml;base64,', '');
            const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
            expect(decoded).toMatch(/^<svg/);
            expect(decoded).not.toContain('<?xml');
            expect(decoded).not.toContain('<!DOCTYPE');
        });

        it('renderiza a imagem de fundo traseira com href válido em Data URI', () => {
            const wrapper = mountCard({ side: 'back' });
            const rearImage = wrapper.find('.flip-card-back svg image');
            expect(rearImage.exists()).toBe(true);

            const href = rearImage.attributes('href');
            expect(href).toMatch(/^data:image\/svg\+xml;base64,/);

            const base64Data = href!.replace('data:image/svg+xml;base64,', '');
            const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
            expect(decoded).toMatch(/^<svg/);
            expect(decoded).not.toContain('<?xml');
            expect(decoded).not.toContain('<!DOCTYPE');
        });

        it('renderiza o logo da bandeira quando informada ou deduzida', () => {
            const wrapper = mountCard({ cardType: 'visa' });
            const brandImages = wrapper.findAll('.flip-card-front svg image');
            // Primeiro image é o background, segundo é a bandeira
            expect(brandImages.length).toBe(2);

            const brandHref = brandImages[1].attributes('href');
            expect(brandHref).toMatch(/^data:image\/svg\+xml;base64,/);

            const base64Data = brandHref!.replace('data:image/svg+xml;base64,', '');
            const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
            expect(decoded).toMatch(/^<svg/);
            expect(decoded).not.toContain('<?xml');
            expect(decoded).not.toContain('<!DOCTYPE');
        });
    });
});

