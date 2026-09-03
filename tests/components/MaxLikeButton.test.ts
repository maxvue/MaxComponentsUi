import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxLikeButton from '../../src/components/MaxLikeButton.vue';

let pinia: ReturnType<typeof createPinia>;

function mountLikeButton(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
    return mount(MaxLikeButton, {
        props,
        slots,
        global: {
            plugins: [pinia],
            stubs: {
                MaxIcon: {
                    template: '<div class="max-icon-stub" :data-icon="String(icon)" :data-size="String(size)" :data-color="String(color)"></div>',
                    props: ['icon', 'size', 'color']
                }
            }
        }
    });
}

describe('MaxLikeButton', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        vi.clearAllMocks();
    });

    it('renderiza com label padrão "Gostei" e ícone de coração outline', () => {
        const wrapper = mountLikeButton();
        expect(wrapper.text()).toContain('Gostei');
        const icon = wrapper.find('.max-icon-stub');
        expect(icon.exists()).toBe(true);
        expect(icon.attributes('data-icon')).toBe('mdi:heart-outline');
    });

    it('renderiza com label customizado', () => {
        const wrapper = mountLikeButton({ label: 'Curtir' });
        expect(wrapper.text()).toContain('Curtir');
    });

    it('renderiza com slot padrão customizando o texto', () => {
        const wrapper = mountLikeButton({}, { default: 'Amei isso' });
        expect(wrapper.text()).toContain('Amei isso');
    });

    it('no modo onlyIcon, não exibe o label e adiciona classe overlay no badge', () => {
        const wrapper = mountLikeButton({ onlyIcon: true, modelValue: 5 });
        expect(wrapper.find('.max-like-label').exists()).toBe(false);
        const badge = wrapper.find('.max-like-badge');
        expect(badge.exists()).toBe(true);
        expect(badge.classes()).toContain('is-overlay');
        expect(badge.text()).toBe('5');
    });

    it('no modo noNumber, oculta o badge com a contagem de likes', () => {
        const wrapper = mountLikeButton({ noNumber: true, modelValue: 10 });
        expect(wrapper.find('.max-like-badge').exists()).toBe(false);
    });

    it('ao clicar, alterna o estado de curtido (toggle) e incrementa a contagem', async () => {
        const wrapper = mountLikeButton({ modelValue: 0 });
        expect(wrapper.classes()).not.toContain('is-liked');

        await wrapper.trigger('click');

        expect(wrapper.classes()).toContain('is-liked');
        const icon = wrapper.find('.max-icon-stub');
        expect(icon.attributes('data-icon')).toBe('mdi:heart');
        expect(wrapper.emitted('update:liked')?.[0]).toEqual([true]);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
        expect(wrapper.find('.max-like-badge').text()).toBe('1');
    });

    it('ao clicar uma segunda vez, descurte, decrementa a contagem e volta ao ícone outline', async () => {
        const wrapper = mountLikeButton({ modelValue: 1, liked: true });
        expect(wrapper.classes()).toContain('is-liked');
        expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:heart');

        await wrapper.trigger('click');

        expect(wrapper.classes()).not.toContain('is-liked');
        expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:heart-outline');
        expect(wrapper.emitted('update:liked')?.[0]).toEqual([false]);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0]);
        expect(wrapper.find('.max-like-badge').text()).toBe('0');
    });

    it('não permite contagem negativa ao descurtir quando iniciado em 0', async () => {
        const wrapper = mountLikeButton({ modelValue: 0, liked: true });
        await wrapper.trigger('click');

        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0]);
    });

    it('executa a prop onClick e emite o evento click com payload de estado', async () => {
        const onClickMock = vi.fn();
        const wrapper = mountLikeButton({ modelValue: 3, onClick: onClickMock });

        await wrapper.trigger('click');

        expect(onClickMock).toHaveBeenCalledTimes(1);
        expect(wrapper.emitted('click')).toBeTruthy();
        const clickArgs = wrapper.emitted('click')?.[0];
        expect(clickArgs?.[1]).toEqual({ liked: true, count: 4 });
    });

    it('quando disabled=true, não altera estado nem dispara eventos ao clicar', async () => {
        const onClickMock = vi.fn();
        const wrapper = mountLikeButton({ disabled: true, modelValue: 5, onClick: onClickMock });

        await wrapper.trigger('click');

        expect(onClickMock).not.toHaveBeenCalled();
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
        expect(wrapper.emitted('update:liked')).toBeUndefined();
        expect(wrapper.emitted('click')).toBeUndefined();
    });

    it('quando loading=true, exibe ícone de carregamento e ignora cliques', async () => {
        const wrapper = mountLikeButton({ loading: true, modelValue: 5 });
        expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('loading');

        await wrapper.trigger('click');
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('permite customizar os ícones através de icon e iconLiked', async () => {
        const wrapper = mountLikeButton({
            icon: 'mdi:thumb-up-outline',
            iconLiked: 'mdi:thumb-up',
            modelValue: 0
        });

        expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:thumb-up-outline');

        await wrapper.trigger('click');
        expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:thumb-up');
    });

    describe('formatação de números no badge', () => {
        it('exibe valores exatos menores que 1000', () => {
            const wrapper = mountLikeButton({ modelValue: 950 });
            expect(wrapper.find('.max-like-badge').text()).toBe('950');
        });

        it('formata valores em milhares com sufixo k', () => {
            const w1 = mountLikeButton({ modelValue: 1000 });
            expect(w1.find('.max-like-badge').text()).toBe('1k');

            const w2 = mountLikeButton({ modelValue: 1250 });
            expect(w2.find('.max-like-badge').text()).toBe('1.3k');

            const w3 = mountLikeButton({ modelValue: 15000 });
            expect(w3.find('.max-like-badge').text()).toBe('15k');
        });

        it('formata valores em milhões com sufixo M', () => {
            const w1 = mountLikeButton({ modelValue: 1000000 });
            expect(w1.find('.max-like-badge').text()).toBe('1M');

            const w2 = mountLikeButton({ modelValue: 2450000 });
            expect(w2.find('.max-like-badge').text()).toBe('2.5M');
        });
    });

    describe('sincronização com props externas', () => {
        it('atualiza o contador quando modelValue muda externamente', async () => {
            const wrapper = mountLikeButton({ modelValue: 10 });
            expect(wrapper.find('.max-like-badge').text()).toBe('10');

            await wrapper.setProps({ modelValue: 25 });
            expect(wrapper.find('.max-like-badge').text()).toBe('25');
        });

        it('atualiza o estado de curtido quando liked muda externamente', async () => {
            const wrapper = mountLikeButton({ liked: false });
            expect(wrapper.classes()).not.toContain('is-liked');

            await wrapper.setProps({ liked: true });
            expect(wrapper.classes()).toContain('is-liked');
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:heart');
        });
    });

    describe('resolução avançada de ícones (icon, icon-true, icon-false)', () => {
        it('se passar icon e icon-false: usa icon para curtido e icon-false para não curtido', async () => {
            const wrapper = mountLikeButton({ icon: 'mdi:star', iconFalse: 'mdi:star-outline' });
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:star-outline');

            await wrapper.trigger('click');
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:star');
        });

        it('se passar icon e icon-true: usa icon para não curtido e icon-true para curtido', async () => {
            const wrapper = mountLikeButton({ icon: 'mdi:thumb-up-outline', iconTrue: 'mdi:thumb-up' });
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:thumb-up-outline');

            await wrapper.trigger('click');
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:thumb-up');
        });

        it('se passar icon-true e icon-false: usa icon-true para curtido e icon-false para não curtido', async () => {
            const wrapper = mountLikeButton({ iconTrue: 'solar:like-bold', iconFalse: 'solar:like-broken' });
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('solar:like-broken');

            await wrapper.trigger('click');
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('solar:like-bold');
        });

        it('suporta props em formato kebab-case (icon-true e icon-false)', async () => {
            const wrapper = mountLikeButton({ 'icon-true': 'mdi:bell', 'icon-false': 'mdi:bell-outline' });
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:bell-outline');

            await wrapper.trigger('click');
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:bell');
        });

        it('se passar apenas icon com sufixo -outline, auto-adapta removendo -outline quando curtido', async () => {
            const wrapper = mountLikeButton({ icon: 'mdi:thumb-up-outline' });
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:thumb-up-outline');

            await wrapper.trigger('click');
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:thumb-up');
        });

        it('se passar apenas icon sem par identificável, usa o mesmo ícone com segurança', async () => {
            const wrapper = mountLikeButton({ icon: 'mdi:custom-symbol' });
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:custom-symbol');

            await wrapper.trigger('click');
            expect(wrapper.find('.max-icon-stub').attributes('data-icon')).toBe('mdi:custom-symbol');
        });
    });

    describe('prop repeat, cooldown e notificações toast', () => {
        beforeEach(() => {
            localStorage.clear();
        });

        it('com repeat=true exibe toast com tempo formatado em 1h e persiste no localStorage', async () => {
            const { useToastStore } = await import('../../src/stores/useToast.Store');
            const toastStore = useToastStore(pinia);
            toastStore.clear();

            const wrapper = mountLikeButton({ repeat: true, storageKey: 'post-1' });

            await wrapper.trigger('click');

            expect(toastStore.items.length).toBe(1);
            expect(toastStore.items[0].title).toBe('Ação realizada.');
            expect(toastStore.items[0].message).toContain('1h');

            const stored = localStorage.getItem('max_like_post-1');
            expect(stored).toBeTruthy();
        });

        it('com repeat com número de minutos exibe toast formatado (ex: 90min -> 1h30m e 45min -> 45m)', async () => {
            const { useToastStore } = await import('../../src/stores/useToast.Store');
            const toastStore = useToastStore(pinia);
            toastStore.clear();

            const w90 = mountLikeButton({ repeat: 90, storageKey: 'post-90' });
            await w90.trigger('click');
            expect(toastStore.items[0].message).toContain('1h30m');

            toastStore.clear();
            const w45 = mountLikeButton({ repeat: 45, storageKey: 'post-45' });
            await w45.trigger('click');
            expect(toastStore.items[0].message).toContain('45m');
        });

        it('permite descurtir durante o cooldown do repeat (-1) e limpa o registro de like', async () => {
            const wrapper = mountLikeButton({ repeat: true, storageKey: 'post-toggle', modelValue: 5 });

            await wrapper.trigger('click');
            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([6]);
            expect(localStorage.getItem('max_like_post-toggle')).toBeTruthy();

            // Descurtir durante o cooldown
            await wrapper.trigger('click');
            expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([5]);
            expect(localStorage.getItem('max_like_post-toggle')).toBeNull();
        });

        it('permite curtir novamente após o tempo de cooldown expirar', async () => {
            const { useToastStore } = await import('../../src/stores/useToast.Store');
            const toastStore = useToastStore(pinia);
            toastStore.clear();

            // Simula que o usuário deu like há 70 minutos atrás (cooldown de 60m expirado)
            const pastTimestamp = Date.now() - (70 * 60 * 1000);
            localStorage.setItem('max_like_post-expired', JSON.stringify({ timestamp: pastTimestamp }));

            const wrapper = mountLikeButton({ repeat: true, storageKey: 'post-expired', modelValue: 10 });

            // Usuário clica novamente após cooldown
            await wrapper.trigger('click');

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([11]);
            expect(toastStore.items.length).toBe(1);
            expect(toastStore.items[0].message).toContain('1h');
        });

        it('por padrão repeat e allow-repeat são false (modo toggle normal sem toast)', async () => {
            const { useToastStore } = await import('../../src/stores/useToast.Store');
            const toastStore = useToastStore(pinia);
            toastStore.clear();

            const wrapper = mountLikeButton({ storageKey: 'post-default-repeat' });
            await wrapper.trigger('click');

            expect(toastStore.items.length).toBe(0);
            expect(localStorage.getItem('max_like_post-default-repeat')).toBeNull();
        });

        it('suporta allowRepeat=true como alias de repeat=true', async () => {
            const { useToastStore } = await import('../../src/stores/useToast.Store');
            const toastStore = useToastStore(pinia);
            toastStore.clear();

            const wrapper = mountLikeButton({ allowRepeat: true, storageKey: 'post-allow-repeat' });
            await wrapper.trigger('click');

            expect(toastStore.items.length).toBe(1);
            expect(toastStore.items[0].message).toContain('1h');
            expect(localStorage.getItem('max_like_post-allow-repeat')).toBeTruthy();
        });

        it('suporta kebab-case allow-repeat="90" como alias numérico de repeat', async () => {
            const { useToastStore } = await import('../../src/stores/useToast.Store');
            const toastStore = useToastStore(pinia);
            toastStore.clear();

            const wrapper = mountLikeButton({ 'allow-repeat': 90, storageKey: 'post-kebab-repeat' });
            await wrapper.trigger('click');

            expect(toastStore.items.length).toBe(1);
            expect(toastStore.items[0].message).toContain('1h30m');
            expect(localStorage.getItem('max_like_post-kebab-repeat')).toBeTruthy();
        });
    });
});
