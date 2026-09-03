<template>
    <button
        type="button"
        class="max-like-button"
        :class="buttonClasses"
        :disabled="props.disabled || props.loading"
        :aria-pressed="isLiked"
        @click="handleClick"
    >
        <span class="max-like-icon-container" :class="{ 'animating': isAnimating }">
            <MaxIcon
                :icon="resolvedIcon"
                :size="resolvedIconSize"
                class="max-like-icon"
                :color="resolvedIconColor"
            />
        </span>

        <span v-if="!props.onlyIcon" class="max-like-label">
            <slot>{{ props.label }}</slot>
        </span>

        <span
            v-if="!props.noNumber"
            class="max-like-badge"
            :class="[props.onlyIcon ? 'is-overlay' : 'is-inline', props.badgeClass]"
        >
            {{ formattedNumber }}
        </span>
    </button>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { Toast } from '../helpers/Toast';
    import type { MaxLikeButtonProps } from '../types';

    const props = withDefaults(defineProps<MaxLikeButtonProps>(), {
        modelValue: 0,
        liked: undefined,
        onlyIcon: false,
        noNumber: false,
        label: 'Gostei',
        icon: undefined,
        iconTrue: undefined,
        'icon-true': undefined,
        iconFalse: undefined,
        'icon-false': undefined,
        iconLiked: undefined,
        repeat: false,
        allowRepeat: false,
        'allow-repeat': false,
        id: undefined,
        storageKey: undefined,
        disabled: false,
        loading: false,
        size: undefined,
        iconSize: 1.2,
        badgeClass: undefined,
        class: undefined
    });

    const emit = defineEmits<{
        'update:modelValue': [value: number];
        'update:liked': [value: boolean];
        'click': [event: MouseEvent, state: { liked: boolean; count: number }];
    }>();

    const internalLiked = ref(props.liked ?? false);
    const internalCount = ref(props.modelValue ?? 0);
    const isAnimating = ref(false);

    watch(() => props.liked, (newVal) => {
        if (newVal !== undefined) internalLiked.value = newVal;
    });

    watch(() => props.modelValue, (newVal) => {
        if (newVal !== undefined) internalCount.value = newVal;
    });

    const isLiked = computed<boolean>(() => internalLiked.value);
    const currentCount = computed<number>(() => internalCount.value);

    const effectiveIconTrue = computed<string | undefined>(() => {
        return props.iconTrue ?? props['icon-true'] ?? props.iconLiked;
    });

    const effectiveIconFalse = computed<string | undefined>(() => {
        return props.iconFalse ?? props['icon-false'];
    });

    const iconPair = computed<{ liked: string; unliked: string }>(() => {
        const icon = props.icon;
        const iTrue = effectiveIconTrue.value;
        const iFalse = effectiveIconFalse.value;

        // 1. icon + icon-false
        if (icon && iFalse && !iTrue) return { liked: icon, unliked: iFalse };

        // 2. icon + icon-true
        if (icon && iTrue && !iFalse) return { liked: iTrue, unliked: icon };

        // 3. icon-true + icon-false (com ou sem icon)
        if (iTrue && iFalse) return { liked: iTrue, unliked: iFalse };

        // 4. Apenas icon (auto-adaptação segura)
        if (icon) {
            if (icon.endsWith('-outline')) return { liked: icon.slice(0, -8), unliked: icon };
            if (icon.endsWith('-fill')) return { liked: icon, unliked: icon.slice(0, -5) };
            if (icon.endsWith('-filled')) return { liked: icon, unliked: icon.slice(0, -7) };
            return { liked: icon, unliked: icon };
        }

        // 5. Apenas iconTrue (com fallback unliked heart-outline)
        if (iTrue) return { liked: iTrue, unliked: 'mdi:heart-outline' };

        // 6. Apenas iconFalse (com fallback liked heart)
        if (iFalse) return { liked: 'mdi:heart', unliked: iFalse };

        // 7. Padrão geral
        return { liked: 'mdi:heart', unliked: 'mdi:heart-outline' };
    });

    const resolvedIcon = computed<string>(() => {
        if (props.loading) return 'loading';
        return isLiked.value ? iconPair.value.liked : iconPair.value.unliked;
    });

    const resolvedIconSize = computed<string | number>(() => {
        if (props.size === 'small' || props.size === 'sm') return 1.0;
        if (props.size === 'large' || props.size === 'lg') return 1.4;
        return props.iconSize ?? 1.2;
    });

    const resolvedIconColor = computed<string | undefined>(() => {
        if (isLiked.value) return 'var(--blue-700)';
        return undefined;
    });

    const effectiveRepeat = computed<boolean | number>(() => {
        if (props.repeat !== false && props.repeat !== undefined) return props.repeat;
        if (props.allowRepeat !== false && props.allowRepeat !== undefined) return props.allowRepeat;
        if (props['allow-repeat'] !== false && props['allow-repeat'] !== undefined) return props['allow-repeat'];
        return false;
    });

    const repeatMinutes = computed<number>(() => {
        const rep = effectiveRepeat.value;
        if (typeof rep === 'number' && rep > 0) return rep;
        if (rep === true) return 60;
        return 0;
    });

    const isRepeatEnabled = computed<boolean>(() => repeatMinutes.value > 0);

    const storageKeyName = computed<string>(() => {
        return `max_like_${props.storageKey ?? props.id ?? 'default'}`;
    });

    const getStoredTimestamp = (): number => {
        if (typeof localStorage === 'undefined') return 0;
        try {
            const raw = localStorage.getItem(storageKeyName.value);
            if (!raw) return 0;
            const parsed = JSON.parse(raw);
            return typeof parsed === 'number' ? parsed : (parsed?.timestamp ?? 0);
        } catch {
            return 0;
        }
    };

    const setStoredTimestamp = (ts: number) => {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(storageKeyName.value, JSON.stringify({ timestamp: ts }));
        } catch {}
    };

    const clearStoredTimestamp = () => {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.removeItem(storageKeyName.value);
        } catch {}
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const remainingMin = minutes % 60;
        if (remainingMin === 0) return `${hours}h`;
        return `${hours}h${remainingMin}m`;
    };

    const formattedNumber = computed<string>(() => {
        const count = currentCount.value;
        if (count >= 1_000_000) {
            const val = count / 1_000_000;
            const rounded = Math.round(val * 10) / 10;
            return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded}M`;
        }
        if (count >= 1_000) {
            const val = count / 1_000;
            const rounded = Math.round(val * 10) / 10;
            return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded}k`;
        }
        return String(count);
    });

    const buttonClasses = computed(() => ({
        'is-liked': isLiked.value,
        'is-only-icon': props.onlyIcon,
        'has-badge': !props.noNumber,
        'is-loading': props.loading,
        'p-button-sm': props.size === 'small' || props.size === 'sm',
        'p-button-lg': props.size === 'large' || props.size === 'lg',
        ...(props.class ? { [props.class]: true } : {})
    }));

    const handleClick = (event: MouseEvent) => {
        if (props.disabled || props.loading) return;

        const count = currentCount.value;

        if (isRepeatEnabled.value) {
            const storedTs = getStoredTimestamp();
            const now = Date.now();
            const cooldownMs = repeatMinutes.value * 60 * 1000;
            const hasCooldownExpired = !storedTs || (now - storedTs >= cooldownMs);

            if (isLiked.value && !hasCooldownExpired) {
                // Descurtir durante o cooldown
                internalLiked.value = false;
                const nextCount = Math.max(0, count - 1);
                internalCount.value = nextCount;
                clearStoredTimestamp();

                emit('update:liked', false);
                emit('update:modelValue', nextCount);
                emit('click', event, { liked: false, count: nextCount });
                return;
            }

            // Curtir (novo like ou repetido após expiração do cooldown)
            internalLiked.value = true;
            const nextCount = count + 1;
            internalCount.value = nextCount;
            setStoredTimestamp(now);

            isAnimating.value = true;
            setTimeout(() => {
                isAnimating.value = false;
            }, 350);

            const durationText = formatDuration(repeatMinutes.value);
            Toast.show({
                title: 'Ação realizada.',
                message: `Você poderá realizar esta ação novamente em ${durationText}.`,
                severity: 'info'
            });

            emit('update:liked', true);
            emit('update:modelValue', nextCount);
            emit('click', event, { liked: true, count: nextCount });
            return;
        }

        // Modo padrão sem repeat (toggle)
        const nextLiked = !isLiked.value;
        const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1);

        internalLiked.value = nextLiked;
        internalCount.value = nextCount;

        if (nextLiked) {
            isAnimating.value = true;
            setTimeout(() => {
                isAnimating.value = false;
            }, 350);
        }

        emit('update:liked', nextLiked);
        emit('update:modelValue', nextCount);
        emit('click', event, { liked: nextLiked, count: nextCount });
    };
</script>

<style lang="scss">
    .max-like-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        gap: 0.5rem;
        border: 1px solid var(--background-300);
        border-radius: 8px;
        padding: 0.45rem 0.85rem;
        font-weight: 500;
        font-family: inherit;
        font-size: 0.9rem;
        cursor: pointer;
        background: transparent;
        color: var(--background-600, #475569);
        transition: all 0.2s ease-in-out;
        user-select: none;

        &:hover {
            border-color: var(--background-400);
            background: var(--background-100, #f8fafc);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            pointer-events: none;
        }

        &.is-liked {
            border-color: var(--blue-700);
            color: var(--blue-700);
            background: rgb(0 118 142 / 8%);

            &:hover {
                background: rgb(0 118 142 / 14%);
            }
        }

        &.p-button-sm {
            padding: 0.3rem 0.65rem;
            font-size: 0.8rem;
            gap: 0.35rem;
        }

        &.p-button-lg {
            padding: 0.6rem 1.15rem;
            font-size: 1.05rem;
            gap: 0.65rem;
        }

        .max-like-icon-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease-in-out;

            &.animating {
                animation: max-like-pop 0.35s ease-in-out;
            }
        }

        .max-like-label {
            display: inline-flex;
            align-items: center;
            line-height: 1;
        }

        .max-like-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 9999px;
            font-weight: 600;
            line-height: 1;
            transition: all 0.2s ease-in-out;

            &.is-inline {
                padding: 0.15rem 0.5rem;
                font-size: 0.75rem;
                background: var(--background-200, #e2e8f0);
                color: var(--background-700, #334155);
            }

            &.is-overlay {
                position: absolute;
                top: 0;
                right: 0;
                transform: translate(35%, -35%);
                min-width: 1.15rem;
                height: 1.15rem;
                padding: 0 0.3rem;
                font-size: 0.65rem;
                background: var(--background-400, #94a3b8);
                color: #fff;
                border: 2px solid #fff;
                box-shadow: 0 1px 3px rgb(0 0 0 / 15%);
            }
        }

        &.is-liked .max-like-badge {
            background: var(--blue-700);
            color: #fff;

            &.is-inline {
                background: var(--blue-700);
                color: #fff;
            }
        }

        &.is-only-icon {
            padding: 0.5rem;
            border-radius: 50%;
            width: 2.4rem;
            height: 2.4rem;

            &.p-button-sm {
                width: 1.9rem;
                height: 1.9rem;
                padding: 0.35rem;
            }

            &.p-button-lg {
                width: 3rem;
                height: 3rem;
                padding: 0.65rem;
            }
        }
    }

    @keyframes max-like-pop {
        0% {
            transform: scale(1);
        }

        50% {
            transform: scale(1.35);
        }

        100% {
            transform: scale(1);
        }
    }
</style>
