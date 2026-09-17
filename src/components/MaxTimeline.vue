<template>
    <div
        class="max-timeline"
        :class="[
            `max-timeline--${props.layout}`,
            `max-timeline--${resolvedAlign}`
        ]"
    >
        <div
            v-for="(item, index) in (props.value || [])"
            :key="getKey(item, index)"
            class="max-timeline-event"
        >
            <div class="max-timeline-event-opposite">
                <slot
                    name="opposite"
                    :item="item"
                    :index="index"
                />
            </div>

            <div class="max-timeline-event-separator">
                <slot
                    name="marker"
                    :item="item"
                    :index="index"
                >
                    <div
                        class="max-timeline-event-marker"
                        :style="getMarkerStyle(item)"
                    />
                </slot>
                <slot
                    v-if="index !== (props.value || []).length - 1"
                    name="connector"
                    :item="item"
                    :index="index"
                >
                    <div class="max-timeline-event-connector" />
                </slot>
            </div>

            <div class="max-timeline-event-content">
                <slot
                    name="content"
                    :item="item"
                    :index="index"
                >
                    <span v-if="typeof item === 'string' || typeof item === 'number'">{{ item }}</span>
                </slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

    export type MaxTimelineAlign = 'left' | 'right' | 'top' | 'bottom' | 'alternate';
    export type MaxTimelineLayout = 'vertical' | 'horizontal';

    export interface MaxTimelineProps<T = any> {
        /**
         * Lista de eventos / itens a serem renderizados na timeline.
         */
        value?: T[];
        /**
         * Alinhamento dos itens e separadores.
         * No layout vertical: 'left' (padrão) | 'right' | 'alternate'.
         * No layout horizontal: 'top' (padrão) | 'bottom' | 'alternate'.
         */
        align?: MaxTimelineAlign;
        /**
         * Orientação da linha do tempo.
         * 'vertical' (padrão) | 'horizontal'.
         */
        layout?: MaxTimelineLayout;
        /**
         * Propriedade usada como chave única no v-for. Se omitida, utiliza o índice.
         */
        dataKey?: string;
    }

    const props = withDefaults(defineProps<MaxTimelineProps>(), {
        value: () => [],
        align: undefined,
        layout: 'vertical',
        dataKey: undefined
    });

    const resolvedAlign = computed<MaxTimelineAlign>(() => {
        if (props.align) return props.align;
        return props.layout === 'horizontal' ? 'top' : 'left';
    });

    const getKey = (item: any, index: number): string | number => {
        if (props.dataKey && item && typeof item === 'object' && props.dataKey in item) return item[props.dataKey];
        return index;
    };

    const severityColorMap: Record<string, string> = {
        success: 'var(--max-success-500, #10b981)',
        info: 'var(--max-info-500, #0ea5e9)',
        warn: 'var(--max-warning-500, #f59e0b)',
        warning: 'var(--max-warning-500, #f59e0b)',
        danger: 'var(--max-danger-500, #ef4444)',
        error: 'var(--max-danger-500, #ef4444)',
        primary: 'var(--max-primary-500, #00768e)'
    };

    const getMarkerStyle = (item: any): Record<string, string> => {
        if (!item || typeof item !== 'object') return {};

        const color = item.color || (item.severity && severityColorMap[item.severity]);
        if (color) return {
            borderColor: color,
            color
        };

        return {};
    };
</script>

<style lang="scss" scoped>
    .max-timeline {
        display: flex;
        flex-grow: 1;
        width: 100%;
        color: var(--background-700);

        // Layout Vertical
        &--vertical {
            flex-direction: column;

            .max-timeline-event {
                display: flex;
                position: relative;
                min-height: 4.5rem;

                &:last-child {
                    min-height: auto;
                }
            }

            .max-timeline-event-opposite,
            .max-timeline-event-content {
                flex: 1;
                padding: 0 1rem;
            }

            .max-timeline-event-opposite {
                text-align: right;
            }

            .max-timeline-event-content {
                text-align: left;
            }

            .max-timeline-event-separator {
                flex: 0 0 auto;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .max-timeline-event-connector {
                flex-grow: 1;
                width: 2px;
                background-color: var(--background-300);
            }

            // Alinhamento right no vertical
            &.max-timeline--right {
                .max-timeline-event {
                    flex-direction: row-reverse;
                }

                .max-timeline-event-opposite {
                    text-align: left;
                }

                .max-timeline-event-content {
                    text-align: right;
                }
            }

            // Alinhamento alternado no vertical
            &.max-timeline--alternate {
                .max-timeline-event:nth-child(even) {
                    flex-direction: row-reverse;

                    .max-timeline-event-opposite {
                        text-align: left;
                    }

                    .max-timeline-event-content {
                        text-align: right;
                    }
                }
            }
        }

        // Layout Horizontal
        &--horizontal {
            flex-direction: row;
            overflow-x: auto;

            .max-timeline-event {
                display: flex;
                flex-direction: column;
                flex: 1;
                position: relative;
                align-items: center;
            }

            .max-timeline-event-opposite,
            .max-timeline-event-content {
                text-align: center;
                padding: 0 0.5rem;
            }

            .max-timeline-event-opposite {
                margin-bottom: 0.5rem;
            }

            .max-timeline-event-content {
                margin-top: 0.5rem;
            }

            .max-timeline-event-separator {
                display: flex;
                align-items: center;
                width: 100%;
            }

            .max-timeline-event-connector {
                flex-grow: 1;
                height: 2px;
                background-color: var(--background-300);
            }

            // Alinhamento bottom no horizontal
            &.max-timeline--bottom {
                .max-timeline-event {
                    flex-direction: column-reverse;
                }

                .max-timeline-event-opposite {
                    margin-bottom: 0;
                    margin-top: 0.5rem;
                }

                .max-timeline-event-content {
                    margin-top: 0;
                    margin-bottom: 0.5rem;
                }
            }

            // Alinhamento alternado no horizontal
            &.max-timeline--alternate {
                .max-timeline-event:nth-child(even) {
                    flex-direction: column-reverse;

                    .max-timeline-event-opposite {
                        margin-bottom: 0;
                        margin-top: 0.5rem;
                    }

                    .max-timeline-event-content {
                        margin-top: 0;
                        margin-bottom: 0.5rem;
                    }
                }
            }
        }

        // Elementos Comuns
        .max-timeline-event-marker {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 1rem;
            height: 1rem;
            border-radius: 50%;
            border: 2px solid var(--max-primary-500);
            background-color: var(--background-0);
            z-index: 1;
        }
    }
</style>
