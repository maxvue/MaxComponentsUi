<template>
    <MaxContainerApp v-bind="attrs">
        <MaxTopMenu v-bind="attrs" :add-items="props.addItems">
            <!-- Repassa os slots do topo para quem usa o layout: notificações,
                 chat, VoIP e Live continuam vindo da aplicação. -->
            <template v-for="(_, name) in topMenuSlots" #[name]="slotProps" :key="name">
                <slot :name="name" v-bind="slotProps ?? {}"></slot>
            </template>
        </MaxTopMenu>

        <MaxSideMenu v-bind="attrs" />

        <MaxSplitPanesContent v-bind="attrs" :side-visible="props.sideVisible">
            <slot></slot>
            <template v-if="$slots.side" #side>
                <slot name="side"></slot>
            </template>
        </MaxSplitPanesContent>

        <MaxBottomMenu v-if="attrs.screen === 'mobile'" v-bind="attrs" :tabs="props.bottomTabs" />
    </MaxContainerApp>
</template>

<script setup lang="ts">
    import { computed, useAttrs, useSlots } from 'vue';
    import MaxContainerApp from './MaxContainerApp.vue';
    import MaxTopMenu from './MaxTopMenu.vue';
    import MaxSideMenu from './MaxSideMenu.vue';
    import MaxSplitPanesContent from './MaxSplitPanesContent.vue';
    import MaxBottomMenu from './MaxBottomMenu.vue';
    import type { BottomTab } from './MaxBottomMenu.vue';

    /** Slots repassados ao `MaxTopMenu`. */
    const TOP_MENU_SLOTS = ['status', 'search', 'add', 'chat', 'bugs', 'notifications', 'voip', 'live', 'user'] as const;

    const props = defineProps<{
        /** Itens do menu "Adicionar Novo" do topo. */
        addItems?: Array<Record<string, any>>;
        /** Abas do menu inferior (mobile). Omitido, usa o padrão do `MaxBottomMenu`. */
        bottomTabs?: BottomTab[];
        /** Exibe o painel lateral do conteúdo. */
        sideVisible?: boolean;
    }>();

    const attrs = useAttrs();
    const slots = useSlots();

    /** Apenas os slots de topo efetivamente informados. */
    const topMenuSlots = computed(() => {
        const provided: Record<string, true> = {};

        TOP_MENU_SLOTS.forEach((name) => {
            if (slots[name]) provided[name] = true;
        });

        return provided;
    });
</script>
