<template>
    <div
        class="max-stats-container"
        :class="[
            canWrap ? 'is-wrap' : 'is-nowrap',
            `layout-${currentLayout}`
        ]"
    >
        <template v-for="(item, index) in props.items" :key="index">
            <!-- Modo Desktop: Cards Completos -->
            <div
                v-if="currentLayout === 'cards'"
                class="max-stat-item max-stat-card"
                :style="getItemStyles(item)"
            >
                <div class="max-stat-card-content">
                    <span class="max-stat-label">
                        {{ item.label }}
                    </span>

                    <span class="max-stat-value">
                        {{ item.value }}
                    </span>

                    <span v-if="item.sublabel" class="max-stat-sublabel">
                        {{ item.sublabel }}
                    </span>
                </div>

                <div class="max-stat-icon-wrapper">
                    <MaxIcon
                        :icon="item.icon"
                        :size="24"
                        :color="getItemColors(item).accentColor"
                    />
                </div>
            </div>

            <!-- Modo Mobile: Pílulas Compactas -->
            <div
                v-else
                class="max-stat-item max-stat-pill"
                :style="getItemStyles(item)"
                :title="getPillTooltip(item)"
                :aria-label="getPillTooltip(item)"
            >
                <div class="max-stat-pill-icon-wrapper">
                    <MaxIcon
                        :icon="item.icon"
                        :size="18"
                        :color="getItemColors(item).accentColor"
                    />
                </div>

                <span class="max-stat-pill-value">
                    {{ item.value }}
                </span>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
    /**
     * Componente MaxStats para exibição de indicadores estatísticos e métricas (KPIs).
     *
     * Suporta layout responsivo com cards ricos no desktop e pílulas compactas no mobile,
     * cálculo automático de paleta WCAG para alto contraste e conforto visual,
     * e controle flexível de quebra de linha.
     */
    import { computed, useAttrs } from 'vue';
    import { useBreakpoints, useDark } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import { resolveStatItemColors, type StatItemColors } from '../helpers/colorLuminance';

    export interface MaxStatsItem {
        /** Título ou rótulo principal do indicador */
        label: string;
        /** Subtítulo descritivo exibido no rodapé (opcional, exibido no modo card) */
        sublabel?: string;
        /** Nome do ícone Iconify a ser renderizado via MaxIcon */
        icon: string;
        /** Cor base do indicador (hex, rgb, hsl, nome ou variável CSS) */
        color: string;
        /** Valor em destaque exibido no card ou pílula */
        value: string | number;
    }

    export interface MaxStatsProps {
        /** Lista de estatísticas e indicadores a serem exibidos */
        items?: MaxStatsItem[];
        /**
         * Permite quebra de linha quando os itens não couberem na mesma linha.
         * Se false (padrão), mantém linha única com rolagem horizontal suave.
         * Suporta tanto camelCase `allowLineBreak` quanto kebab-case `allow-line-break`.
         */
        allowLineBreak?: boolean;
        /**
         * Formato de visualização dos itens:
         * - 'auto': detecta tela via breakpoint `md` (768px). Mobile = 'pills', Desktop = 'cards'.
         * - 'cards': força formato de cards completos.
         * - 'pills': força formato de pílulas compactas.
         */
        layout?: 'auto' | 'cards' | 'pills';
    }

    const attrs: any = useAttrs();

    const props = withDefaults(defineProps<MaxStatsProps>(), {
        items: () => [],
        allowLineBreak: false,
        layout: 'auto'
    });

    const isDark = useDark();

    // Sistema de detecção de viewport
    const breakpoints = useBreakpoints({ sm: 640, md: 768, lg: 1024, xl: 1280 });
    const isMobile = breakpoints.smaller('md');

    /** Define se a quebra de linha está habilitada (suporta camelCase e kebab-case) */
    const canWrap = computed(() => {
        if (props.allowLineBreak) return true;
        const rawAttr = attrs['allow-line-break'];
        return rawAttr === true || rawAttr === '' || rawAttr === 'true';
    });

    /** Define o layout atual com base nas props e no breakpoint */
    const currentLayout = computed<'cards' | 'pills'>(() => {
        if (props.layout === 'cards') return 'cards';
        if (props.layout === 'pills') return 'pills';
        return isMobile.value ? 'pills' : 'cards';
    });

    /** Retorna a paleta de cores calculada por luminância WCAG */
    const getItemColors = (item: MaxStatsItem): StatItemColors => {
        return resolveStatItemColors(item.color, isDark.value);
    };

    /** Retorna as propriedades CSS personalizadas injetadas no estilo do elemento */
    const getItemStyles = (item: MaxStatsItem) => {
        const colors = getItemColors(item);
        return {
            '--stat-bg': colors.background,
            '--stat-icon-bg': colors.iconBackground,
            '--stat-text': colors.textColor,
            '--stat-accent': colors.accentColor
        };
    };

    /** Tooltip de acessibilidade exibido no modo pílula */
    const getPillTooltip = (item: MaxStatsItem): string => {
        return item.sublabel ? `${item.label} — ${item.sublabel}` : item.label;
    };
</script>

<style lang="scss">
    .max-stats-container {
        display: flex;
        width: 100%;
        gap: 1rem;
        align-items: center;

        &.is-wrap {
            flex-wrap: wrap;
        }

        &.is-nowrap {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: thin;
            -webkit-overflow-scrolling: touch;

            &::-webkit-scrollbar {
                height: 6px;
            }

            &::-webkit-scrollbar-track {
                background: transparent;
            }

            &::-webkit-scrollbar-thumb {
                background: rgb(150 150 150 / 25%);
                border-radius: 9999px;
            }

            &::-webkit-scrollbar-thumb:hover {
                background: rgb(150 150 150 / 45%);
            }
        }
    }

    // Modo Desktop: Card Retangular com Cantos Arredondados
    .max-stat-card {
        display: flex;
        flex: 1 1 0%;
        min-width: 200px;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        background-color: var(--stat-bg);
        border-radius: 1rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            transform: translateY(-1px);
        }

        .max-stat-card-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-width: 0;
            flex: 1;
            margin-right: 0.75rem;
        }

        .max-stat-label {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            line-height: 1.2;
            color: var(--stat-text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .max-stat-value {
            font-size: 1.875rem;
            font-weight: 800;
            line-height: 1.1;
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
            color: var(--stat-accent);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .max-stat-sublabel {
            font-size: 0.75rem;
            font-weight: 500;
            line-height: 1.2;
            color: var(--stat-text);
            opacity: 0.85;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .max-stat-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 3.25rem;
            height: 3.25rem;
            border-radius: 1rem;
            background-color: var(--stat-icon-bg);
            flex-shrink: 0;
        }
    }

    // Modo Mobile: Pílula Compacta
    .max-stat-pill {
        display: inline-flex;
        align-items: center;
        height: 2.375rem;
        padding: 0.25rem 0.875rem 0.25rem 0.3125rem;
        background-color: var(--stat-bg);
        border-radius: 9999px;
        flex-shrink: 0;
        cursor: default;
        transition: transform 0.15s ease;

        &:hover {
            transform: scale(1.02);
        }

        .max-stat-pill-icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.875rem;
            height: 1.875rem;
            border-radius: 9999px;
            background-color: var(--stat-icon-bg);
            flex-shrink: 0;
        }

        .max-stat-pill-value {
            font-size: 0.9375rem;
            font-weight: 800;
            line-height: 1;
            margin-left: 0.625rem;
            color: var(--stat-accent);
        }
    }
</style>
