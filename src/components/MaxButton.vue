<template>
    <Button
        v-bind="attrs"
        :loading="attrs.loading"
        pointer
        :danger="attrs.severity === 'danger' || attrs.danger !== undefined"
        :success="attrs.severity === 'success' || attrs.success !== undefined"
        :confirm="attrs.severity === 'success' || attrs.confirm !== undefined"
        :cancel="attrs.cancel !== undefined"
        :info="attrs.severity === 'info' || attrs.info !== undefined"
        :warn="attrs.severity === 'warn' || attrs.warn !== undefined"
        :help="attrs.severity === 'help' || attrs.help !== undefined"
        :secondary="attrs.severity === 'secondary' || attrs.secondary !== undefined"
        :contrast="attrs.severity === 'contrast' || attrs.contrast !== undefined"
    >
        <template #default>
            <TransitionFade>
                <MaxIcon icon="line-md:loading-twotone-loop" size="1.6" v-if="attrs.loading" />
                <div class="content-button" v-else>
                    <div class="btn-icon-left" >
                        <MaxIconButton :icon="icon_left" :size="attrs.size ?? attrs.sizeIcon ?? attrs.iconSize ?? attrs['size-icon'] ?? attrs['icon-size'] ?? '1.8'" class="content-button-icon" v-if="icon_left" flex />
                    </div>
                    <div v-if="attrs.labelhtml || attrs.label || attrs['label-html']" :class="`btn-label ${attrs.textLeft !== undefined ? 'text-left' : ''}`" v-html="attrs.label ?? attrs.labelhtml ?? attrs['label-html']"></div>
                    <div class="btn-icon-right">
                        <MaxIconButton :icon="icon_right" :size="attrs.size ?? attrs.sizeIcon ?? attrs.iconSize ?? attrs['size-icon'] ?? attrs['icon-size'] ?? '1.8'" class="content-button-icon" v-if="icon_right" flex />
                    </div>
                    <Badge v-if="valueBadge" :size="attrs['size_badge'] ?? ''" :value="parseInt(valueBadge) > 99 ? '99+' : valueBadge" :severity="attrs['badge_severity'] ?? attrs['severity_badge'] ?? 'default'"></Badge>
                    <slot></slot>
                </div>
            </TransitionFade>
            <div class="countdown-botao" v-if="attrs.countdown !== undefined">
                {{ attrs.countdown > 0 ? attrs.countdown : '0' }}
            </div>
        </template>
    </Button>
</template>

/**
 * Componente de botão altamente customizável que estende o Button do PrimeVue.
 *
 * Suporta ícones em ambos os lados, badges numéricos, estados de carregamento animados
 * e contagem regressiva integrada.
 *
 * @slot default Conteúdo personalizado dentro do botão.
 */
<script setup lang="ts">
    import Button from 'primevue/button';
    /** Atributos capturados via v-bind, incluindo props do PrimeVue Button */
    const attrs: any = useAttrs();
    const valueBadge = computed(() => attrs['number'] ?? attrs.badge ?? false);
    const icon_left = computed(() => attrs.icon ?? attrs.iconLeft ?? attrs['icon-left'] ?? attrs.icon_left ?? null);
    const icon_right = computed(() => attrs.iconRight ?? attrs['icon-right'] ?? attrs.IconRight ?? attrs.icon_right ?? null);
</script>

<style lang="scss">
    .p-button {
        font-weight: 400 !important;
        text-transform: uppercase;
        padding: 0 !important;
        position: relative !important;
        height: 36px;
        min-width: 40px;
        border-radius: 10px;

        &.p-button-icon-only {
            min-width: unset;

            .content-button {
                grid-template-columns: auto;

                .btn-icon-left {
                    padding: 0;
                    width: 24px;
                    height: 24px;
                }

                .btn-icon-right {
                    padding: 0;
                    width: 24px;
                    height: 24px;
                }
            }
        }

        .content-button {
            display: grid;
            grid-template-columns: auto 1fr auto;
            place-items: center;
            width: 100%;
            padding: 0 8px;

            .btn-icon-left {
                width: 24px;
                height: 24px;
                overflow: hidden;
                display: grid;
                place-items: center;
            }

            .btn-icon-right {
                width: 24px;
                height: 24px;
                overflow: hidden;
                display: grid;
                place-items: center;
            }

            .btn-label {
                width: 100%;
                padding: 0 20px;

                &.text-left {
                    text-align: left !important;
                }
            }

            .icon-div {
                padding: 0 !important;
                margin: 0 !important;
                width: 24px !important;
                height: 24px !important;

                .content-button-icon {
                    width: 24px !important;
                    height: 24px !important;
                }
            }
        }

        .countdown-botao {
            width: 20px;
            padding: 0 22px;
        }
    }
</style>
