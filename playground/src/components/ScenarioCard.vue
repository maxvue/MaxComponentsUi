<template>
    <article class="scenario-card" :data-family="family">
        <header class="scenario-card__header">
            <div class="title-row">
                <h3 class="component-title">{{ title }}</h3>
                <span class="family-tag">{{ family }}</span>
                <span v-if="isAlias" class="alias-tag">alias de {{ aliasOf }}</span>
                <span v-if="badge" class="custom-badge">{{ badge }}</span>
            </div>
            <p v-if="description" class="component-desc">{{ description }}</p>
        </header>
        <div class="scenario-card__content">
            <slot></slot>
        </div>
    </article>
</template>

<script setup lang="ts">
    defineProps<{
        title: string;
        family: string;
        description?: string;
        isAlias?: boolean;
        aliasOf?: string;
        badge?: string;
    }>();
</script>

<style lang="scss" scoped>
    .scenario-card {
        background-color: var(--background-0, #fff);
        border: 1px solid var(--background-200, #e2e8f0);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 4px rgb(0 0 0 / 4%);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        .dark & {
            background-color: var(--background-850, #18181b);
            border-color: var(--background-700, #27272a);
            box-shadow: 0 1px 4px rgb(0 0 0 / 20%);
        }

        &__header {
            margin-bottom: 1.25rem;
            border-bottom: 1px solid var(--background-150, #f1f5f9);
            padding-bottom: 0.75rem;

            .dark & {
                border-bottom-color: var(--background-750, #27272a);
            }

            .title-row {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .component-title {
                margin: 0;
                font-size: 1.15rem;
                font-weight: 700;
                color: var(--background-900, #0f172a);

                .dark & {
                    color: var(--background-50, #f8fafc);
                }
            }

            .family-tag {
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.15rem 0.5rem;
                border-radius: 4px;
                background-color: var(--background-100, #f1f5f9);
                color: var(--max-primary-500, #00768e);
                text-transform: uppercase;
                letter-spacing: 0.03em;

                .dark & {
                    background-color: var(--background-800, #27272a);
                    color: var(--max-primary-400, #178da5);
                }
            }

            .alias-tag {
                font-size: 0.75rem;
                font-weight: 500;
                padding: 0.15rem 0.5rem;
                border-radius: 4px;
                background-color: var(--background-100, #f1f5f9);
                color: var(--max-content-secondary, #64748b);
                font-style: italic;

                .dark & {
                    background-color: var(--background-800, #27272a);
                    color: var(--background-400, #a1a1aa);
                }
            }

            .custom-badge {
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.15rem 0.5rem;
                border-radius: 4px;
                background-color: rgb(16 185 129 / 10%);
                color: var(--max-success-500, #10b981);
            }

            .component-desc {
                margin: 0.4rem 0 0;
                font-size: 0.85rem;
                color: var(--max-content-secondary, #64748b);
                line-height: 1.4;

                .dark & {
                    color: var(--background-300, #d4d4d8);
                }
            }
        }

        &__content {
            width: 100%;
            box-sizing: border-box;
        }
    }
</style>
