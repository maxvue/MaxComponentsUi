<template>
    <div class="card-container">
        <div :class="`flip-card ${side}`">
            <div class="flip-card-inner">
                <div class="flip-card-front">
                    <svg viewBox="0 0 700 430">
                        <image :href="`${props.assetsPath}/credit-card.svg`" x="0" y="0" width="700" height="430" />
                        <text x="105" y="270" font-size="42" fill="#336699" font-weight="700" font-family="'JetBrains Mono', monospace">{{ t1 }} {{ t2 }} {{ t3 }} {{ t4 }}</text>
                        <text x="35" y="340" font-size="32" fill="#336699" font-family="'JetBrains Mono', monospace">{{ props.name || 'NOME IMPRESSO NO CARTÃO' }}</text>
                        <text x="35" y="380" font-size="28" fill="#336699" font-family="'JetBrains Mono', monospace">{{ date }}</text>
                        <image v-if="card_type_image" :href="card_type_image" x="540" y="320" width="138" height="92" />
                    </svg>
                </div>
                <div class="flip-card-back">
                    <svg viewBox="0 0 700 430">
                        <image :href="`${props.assetsPath}/credit-card-rear.svg`" x="0" y="0" width="700" height="430" />
                        <text x="548" y="218" font-size="36" fill="#336699" font-family="'JetBrains Mono', monospace">{{ cvv }}</text>
                        <image v-if="card_type_image" :href="card_type_image" x="540" y="320" width="138" height="92" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { onlyNumbers } from '@maxvue/max-use';

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
            /** Caminho base das imagens SVG do cartão na aplicação consumidora */
            assetsPath?: string;
        }>(),
        { number: '', cvv: '', name: '', date: '', cardType: null, side: 'front', assetsPath: '/media/images' }
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
        if (/^(38|60)/.test(digits)) return 'hipercard';
        if (/^(30[0-5]|36|38)/.test(digits)) return 'diners';
        if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
        return null;
    });

    const card_type = computed(() => props.cardType ?? detected_type.value);
    const card_type_image = computed(() => (card_type.value ? `${props.assetsPath}/card-${card_type.value}.svg` : false));

    const date = computed(() => {
        const digits = onlyNumbers(String(props.date ?? ''));
        if (digits.length < 4) return '00/00';
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    });

    const side = computed(() => (props.side === 'back' ? 'flip' : ''));
</script>

<style lang="scss">
.card-container {
    perspective: 1000px;
    position: relative;
    width: 100%;
    display: grid;

    svg {
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

            .flip-card-front,
            .flip-card-back {
                position: absolute;
                width: 100%;
                max-width: 400px;
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
