<template>
    <div class="icon-div ico-btn" ref="icon_ref" :icon="attrs.icon ?? attrs.i" v-bind="attrs" :style="{width: size, height: size}">
        <MaxIcon v-bind="attrs" v-tooltip="null" pointer @click.stop="execute" v-if="attrs.blank || attrs.route" full :size="size" />
        <MaxIcon v-bind="attrs" v-tooltip="null" pointer v-else full :size="size" />
        <div class="sub-icon checked" v-if="attrs.checked === true">
            <div class="background-icon"></div>
            <svg full xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" /></svg>
        </div>
        <div class="sub-icon plus" v-if="attrs.plus === true">
            <div class="background-icon"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z" /></svg>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useRouter } from 'vue-router';

    const router = useRouter();
    const attrs = useAttrs();

    const execute = () => {
        if (attrs.blank) window.open(attrs.blank as any, '_blank');

        if (attrs.route && typeof attrs.route === 'string' && hasContent(attrs.route)) {
            const data: { name: string; query?: any } = { name: getRouteByName(attrs.route) ?? attrs.route };

            if (attrs.data ?? attrs.params) data.query = attrs.data ?? attrs.params;
            router.push(data);
        }
    };

    const size = computed(() => 16 * Number(attrs.size ?? 1) + 'px');
</script>

<style lang="scss">
    .icon-div {
        display: grid;
        place-items: center;
        width: auto;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        transition: transform 0.3s ease, color 0.2s ease-in-out;
        position: relative;

        &.ico-btn {
            &:hover {
                transform: scale(1.3) !important;
            }
        }

        .sub-icon {
            position: absolute;
            display: grid;
            place-items: center;

            &.plus {
                color: var(--blue-0);
                width: 13px;
                height: 13px;
                bottom: -2px;
                right: 3px;

                .background-icon {
                    height: 15px;
                    width: 15px;
                    background-color: var(--blue-750);
                }
            }

            &.checked {
                color: var(--green-600);
                width: 15px;
                height: 15px;
                bottom: 0;
                right: 2px;

                .background-icon {
                    width: 15px;
                    height: 15px;
                    background-color: rgb(255 255 255);
                }
            }

            .background-icon {
                content: '';
                position: absolute;
                border-radius: 50%;
            }

            svg {
                position: absolute;
            }
        }
    }
</style>
