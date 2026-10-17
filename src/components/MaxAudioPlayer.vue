<template>
    <section class="max-audio-player" :aria-label="props.label">
        <audio ref="audio" :src="safeSrc || undefined" controls preload="metadata" @loadedmetadata="onMetadata" @play="emit('play')" @pause="emit('pause')" @ended="emit('ended')" @error="emit('error', { reason: 'load-failed' })" />
        <span v-if="!safeSrc" role="status">Fonte de áudio inválida</span>
        <span v-if="durationLabel">{{ durationLabel }}</span>
        <MaxButton :label="`Velocidade ${speed}×`" :disabled="!safeSrc" @click="cycleSpeed" />
    </section>
</template>

<script setup lang="ts">
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import MaxButton from './MaxButton.vue';
    import type { MaxAudioPlayerProps } from '../types/audioPlayer';

    const props = withDefaults(defineProps<MaxAudioPlayerProps>(), { label: 'Reprodutor de áudio', speeds: () => [1, 1.3, 1.6, 2] });
    const emit = defineEmits<{ play: []; pause: []; ended: []; error: [payload: { reason: 'invalid-source' | 'load-failed' | 'play-failed' }] }>();
    const audio = ref<HTMLAudioElement | null>(null);
    const durationLabel = ref('');
    const safeSrc = computed(() => {
        const value = props.src.trim();
        if (!value) return '';
        const scheme = value.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
        return scheme && !['http', 'https', 'blob'].includes(scheme) ? '' : value;
    });
    const speeds = computed(() => props.speeds.filter((value) => Number.isFinite(value) && value > 0));
    const speed = ref(1);
    function onMetadata(): void { const duration = audio.value?.duration; if (typeof duration === 'number' && Number.isFinite(duration) && duration >= 0) durationLabel.value = formatDuration(duration); else if (typeof props.duration === 'number' && Number.isFinite(props.duration) && props.duration >= 0) durationLabel.value = formatDuration(props.duration); }
    function formatDuration(seconds: number): string { const whole = Math.floor(seconds); return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`; }
    function cycleSpeed(): void { const valid = speeds.value.length ? speeds.value : [1]; const index = valid.indexOf(speed.value); speed.value = valid[(index + 1) % valid.length]; if (audio.value) audio.value.playbackRate = speed.value; }
    watch(() => props.src, () => { if (audio.value) { audio.value.pause(); audio.value.currentTime = 0; } speed.value = speeds.value[0] ?? 1; durationLabel.value = ''; if (!safeSrc.value) emit('error', { reason: 'invalid-source' }); }, { immediate: true });
    onBeforeUnmount(() => { audio.value?.pause(); audio.value?.removeAttribute('src'); audio.value?.load(); });
</script>

<style lang="scss" scoped>
.max-audio-player { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
audio { max-width: 100%; }
audio:focus-visible { outline: var(--max-focus-outline); outline-offset: 2px; }
</style>
