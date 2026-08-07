<template>
    <div class="max-credit-card">
        <div :class="`flip-card ${side}`">
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <svg viewBox="0 0 700 430">
                        <image :href="creditCardFrontUri" x="0" y="0" width="700" height="430" />
                        <text
                            ref="numberTextEl"
                            x="105"
                            y="270"
                            style="font-size: 42px;"
                            fill="#336699"
                            font-weight="700"
                            font-family="'JetBrains Mono', monospace"
                            :textLength="numberTextLength"
                            :lengthAdjust="numberTextLength ? 'spacingAndGlyphs' : undefined"
                        >{{ t1 }} {{ t2 }} {{ t3 }} {{ t4 }}</text>
                        <text
                            ref="nameTextEl"
                            x="35"
                            y="340"
                            style="font-size: 32px;"
                            fill="#336699"
                            font-family="'JetBrains Mono', monospace"
                            :textLength="nameTextLength"
                            :lengthAdjust="nameTextLength ? 'spacingAndGlyphs' : undefined"
                        >{{ props.name || 'NOME IMPRESSO NO CARTÃO' }}</text>
                        <text
                            ref="dateTextEl"
                            x="35"
                            y="380"
                            style="font-size: 28px;"
                            fill="#336699"
                            font-family="'JetBrains Mono', monospace"
                            :textLength="dateTextLength"
                            :lengthAdjust="dateTextLength ? 'spacingAndGlyphs' : undefined"
                        >{{ date }}</text>
                        <image v-if="card_type_image" :href="card_type_image" x="540" y="320" width="138" height="92" />
                    </svg>
                </div>
                <div class="flip-card-back">
                    <svg viewBox="0 0 700 430">
                        <image :href="creditCardRearUri" x="0" y="0" width="700" height="430" />
                        <text
                            ref="cvvTextEl"
                            x="548"
                            y="218"
                            style="font-size: 36px;"
                            fill="#336699"
                            font-family="'JetBrains Mono', monospace"
                            :textLength="cvvTextLength"
                            :lengthAdjust="cvvTextLength ? 'spacingAndGlyphs' : undefined"
                        >{{ cvv }}</text>
                        <image v-if="card_type_image" :href="card_type_image" x="540" y="320" width="138" height="92" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, nextTick, watch, onMounted } from 'vue';
    import { onlyNumbers } from '@maxvue/max-use';
    import { svgToDataUri } from '../helpers/svgToDataUri';
    import creditCardFrontSvg from '../assets/credit-card/credit-card.svg?raw';
    import creditCardRearSvg from '../assets/credit-card/credit-card-rear.svg?raw';
    import cardAmexSvg from '../assets/credit-card/card-amex.svg?raw';
    import cardAmericanExpressSvg from '../assets/credit-card/card-american-express.svg?raw';
    import cardDinersSvg from '../assets/credit-card/card-diners.svg?raw';
    import cardDinersClubSvg from '../assets/credit-card/card-diners-club.svg?raw';
    import cardDiscoverySvg from '../assets/credit-card/card-discovery.svg?raw';
    import cardEloSvg from '../assets/credit-card/card-elo.svg?raw';
    import cardHipercardSvg from '../assets/credit-card/card-hipercard.svg?raw';
    import cardHiperSvg from '../assets/credit-card/card-hiper.svg?raw';
    import cardJcbSvg from '../assets/credit-card/card-jcb.svg?raw';
    import cardMaestroSvg from '../assets/credit-card/card-maestro.svg?raw';
    import cardMastercardSvg from '../assets/credit-card/card-mastercard.svg?raw';
    import cardVisaSvg from '../assets/credit-card/card-visa.svg?raw';

    /** SVGs das bandeiras embutidos no bundle, indexados pelos mesmos nomes usados anteriormente em `card-${cardType}.svg`. */
    const CARD_TYPE_SVGS: Record<string, string> = {
        amex: cardAmexSvg,
        'american-express': cardAmericanExpressSvg,
        diners: cardDinersSvg,
        'diners-club': cardDinersClubSvg,
        discover: cardDiscoverySvg,
        discovery: cardDiscoverySvg,
        elo: cardEloSvg,
        hipercard: cardHipercardSvg,
        hiper: cardHiperSvg,
        jcb: cardJcbSvg,
        maestro: cardMaestroSvg,
        mastercard: cardMastercardSvg,
        visa: cardVisaSvg
    };

    const creditCardFrontUri = svgToDataUri(creditCardFrontSvg);
    const creditCardRearUri = svgToDataUri(creditCardRearSvg);

    /**
     * Representação visual de um cartão de crédito, com frente e verso.
     */
    const props = withDefaults(
        defineProps<{
            /** Número do cartão (com ou sem máscara) */
            number?: string | number | null;
            /** Código de segurança impresso no verso */
            cvv?: string | number | null;
            /** Nome impresso no cartão */
            name?: string | null;
            /** Validade no formato MMAA (ex.: '1230') */
            date?: string | number | null;
            /** Bandeira do cartão; quando omitida é deduzida do número */
            cardType?: string | null;
            /** Face exibida do cartão */
            side?: 'front' | 'back';
        }>(),
        { number: '', cvv: '', name: '', date: '', cardType: null, side: 'front' }
    );

    const code = computed(() => onlyNumbers(String(props.number ?? '')).padEnd(16, '0').slice(0, 16));
    const cvv = computed(() => onlyNumbers(String(props.cvv ?? '')).padEnd(3, '0').slice(0, 4));

    const t1 = computed(() => code.value.slice(0, 4));
    const t2 = computed(() => code.value.slice(4, 8));
    const t3 = computed(() => code.value.slice(8, 12));
    const t4 = computed(() => code.value.slice(12, 16));

    /** Deduz a bandeira pelos primeiros dígitos quando `cardType` não é informado. */
    const detected_type = computed(() => {
        const digits = onlyNumbers(String(props.number ?? ''));
        if (!digits) return null;
        if (/^4/.test(digits)) return 'visa';
        if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
        if (/^3[47]/.test(digits)) return 'amex';
        if (/^(4011|4312|4389|5041|5066|5090|6277|6362|6363|650|651|655)/.test(digits)) return 'elo';
        if (/^(6062|384100|384140|384160)/.test(digits)) return 'hipercard';
        if (/^(30[0-5]|36|38)/.test(digits)) return 'diners';
        if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
        return null;
    });

    const card_type = computed(() => props.cardType ?? detected_type.value);
    const card_type_image = computed(() => {
        if (!card_type.value) return false;
        const svg = CARD_TYPE_SVGS[card_type.value];
        return svg ? svgToDataUri(svg) : false;
    });

    const date = computed(() => {
        const digits = onlyNumbers(String(props.date ?? ''));
        if (digits.length < 4) return '00/00';
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    });

    const side = computed(() => (props.side === 'back' ? 'flip' : ''));

    /**
     * Largura máxima disponível (em unidades do viewBox 700x430) para cada texto do cartão,
     * calculada a partir do `x` inicial de cada elemento até a margem/elemento vizinho seguinte.
     */
    const NUMBER_MAX_WIDTH = 560; // x=105 até próximo da bandeira/margem direita
    const NAME_MAX_WIDTH = 460; // x=35 até a margem direita, antes da bandeira
    const DATE_MAX_WIDTH = 150; // x=35, campo curto de validade
    const CVV_MAX_WIDTH = 120; // x=548 até a margem direita

    const numberTextEl = ref<SVGTextElement | null>(null);
    const nameTextEl = ref<SVGTextElement | null>(null);
    const dateTextEl = ref<SVGTextElement | null>(null);
    const cvvTextEl = ref<SVGTextElement | null>(null);

    const numberTextLength = ref<number | undefined>(undefined);
    const nameTextLength = ref<number | undefined>(undefined);
    const dateTextLength = ref<number | undefined>(undefined);
    const cvvTextLength = ref<number | undefined>(undefined);

    /**
     * Mede a largura real renderizada de um `<text>` (com a fonte de fato disponível no
     * navegador, seja `JetBrains Mono` ou o fallback `monospace`) e só define `textLength`
     * quando o texto realmente transborda o espaço disponível. Isso evita esticar (ou
     * comprimir) de forma artificial textos curtos, como nomes pequenos ou o placeholder,
     * mantendo a proporção visual entre grupos de tamanhos diferentes (ex.: Amex 4-6-5).
     */
    function clampTextLength(el: SVGTextElement | null, maxWidth: number, target: { value: number | undefined }): void {
        if (!el || typeof el.getComputedTextLength !== 'function') {
            target.value = undefined;
            return;
        }

        // `getComputedTextLength()` sempre retorna a largura natural dos glifos, ignorando
        // um `textLength` já aplicado — por isso é seguro medir sem remover o atributo antes.
        const naturalWidth = el.getComputedTextLength();
        target.value = naturalWidth > maxWidth ? maxWidth : undefined;
    }

    function updateAllTextLengths(): void {
        clampTextLength(numberTextEl.value, NUMBER_MAX_WIDTH, numberTextLength);
        clampTextLength(nameTextEl.value, NAME_MAX_WIDTH, nameTextLength);
        clampTextLength(dateTextEl.value, DATE_MAX_WIDTH, dateTextLength);
        clampTextLength(cvvTextEl.value, CVV_MAX_WIDTH, cvvTextLength);
    }

    onMounted(async () => {
        await nextTick();
        updateAllTextLengths();
    });

    watch([t1, t2, t3, t4, () => props.name, date, cvv], async () => {
        await nextTick();
        updateAllTextLengths();
    });
</script>

<style lang="scss">
.max-credit-card {
    /** Proporção do viewBox dos SVGs de frente/verso (700x430). */
    --max-credit-card-ratio: 700 / 430;
    --max-credit-card-max-width: 400px;

    perspective: 1000px;
    position: relative;
    width: 100%;
    display: grid;

    svg {
        display: block;
        width: 100%;
        height: 100%;
        font-family: 'JetBrains Mono', monospace;
        font-optical-sizing: auto;
    }

    .flip-card {
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s;

        .flip-card-inner {
            position: relative;
            transition: transform 0.6s;
            transform-style: preserve-3d;
            display: grid;
            place-items: start center;

            /**
             * As duas faces são `position: absolute` (necessário para empilhá-las no flip),
             * então não geram altura no fluxo. Reservamos a altura aqui a partir da
             * proporção do cartão, para que o componente ocupe o espaço do cartão visível
             * em vez de colapsar para 0.
             */
            width: 100%;
            max-width: var(--max-credit-card-max-width);
            aspect-ratio: var(--max-credit-card-ratio);
            margin-inline: auto;

            .flip-card-front,
            .flip-card-back {
                position: absolute;
                inset: 0;
                width: 100%;
                backface-visibility: hidden;
            }

            .flip-card-back {
                transform: rotateY(180deg);
            }
        }

        &.flip {
            transform: rotateY(180deg);
        }
    }
}
</style>
