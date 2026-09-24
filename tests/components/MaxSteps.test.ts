import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import MaxSteps from '../../src/components/MaxSteps.vue';
import MaxStepItem from '../../src/components/MaxStepItem.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

describe('MaxSteps — Renderização e Estrutura Básica', () => {
    it('renderiza os steps e ativa o primeiro automaticamente', async () => {
        const wrapper = mount(MaxSteps, {
            props: { id: 'steps-test-1', cached: false },
            slots: {
                default: `
                    <MaxStepItem value="s1" title="Passo 1"><div class="content-1">Conteúdo 1</div></MaxStepItem>
                    <MaxStepItem value="s2" title="Passo 2"><div class="content-2">Conteúdo 2</div></MaxStepItem>
                `
            },
            global: {
                components: { MaxStepItem }
            }
        });

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers.length).toBe(2);
        expect(headers[0].classes()).toContain('is-active');
        expect(wrapper.find('.content-1').exists()).toBe(true);
        expect(wrapper.find('.content-2').exists()).toBe(false);
    });

    it('aplica classe has-border quando showBorder é true', () => {
        const wrapper = mount(MaxSteps, {
            props: { showBorder: true, cached: false }
        });
        expect(wrapper.find('.max-steps').classes()).toContain('has-border');
    });

    it('renderiza botões de navegação no topo se showTopButtons for true e oculta se false', async () => {
        const wrapperWithTop = mount(MaxSteps, {
            props: { showTopButtons: true, cached: false }
        });
        expect(wrapperWithTop.findAll('.step-nav-btn').length).toBe(2);

        const wrapperWithoutTop = mount(MaxSteps, {
            props: { showTopButtons: false, cached: false }
        });
        expect(wrapperWithoutTop.findAll('.step-nav-btn').length).toBe(0);
    });
});

describe('MaxSteps — Navegação Inferior (Voltar, Avançar, Concluir)', () => {
    it('mostra apenas Avançar no primeiro passo e avança ao clicar', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="steps-nav-1" :cached="false">
                    <MaxStepItem value="1" title="P1"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                    <MaxStepItem value="3" title="P3"><div class="c3">C3</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        expect(wrapper.find('.btn-step-prev').exists()).toBe(false);
        const nextBtn = wrapper.find('.btn-step-next');
        expect(nextBtn.exists()).toBe(true);
        expect(nextBtn.text()).toContain('Avançar');

        await nextBtn.trigger('click');
        await settle();

        expect(wrapper.find('.c2').exists()).toBe(true);
        expect(wrapper.find('.btn-step-prev').exists()).toBe(true);
        expect(wrapper.find('.btn-step-next').exists()).toBe(true);
    });

    it('permite voltar ao clicar no botão Voltar', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="steps-nav-2" :cached="false" value="2">
                    <MaxStepItem value="1" title="P1"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        expect(wrapper.find('.c2').exists()).toBe(true);
        const prevBtn = wrapper.find('.btn-step-prev');
        expect(prevBtn.exists()).toBe(true);
        expect(prevBtn.text()).toContain('Voltar');

        await prevBtn.trigger('click');
        await settle();

        expect(wrapper.find('.c1').exists()).toBe(true);
    });

    it('exibe o botão Concluir no último passo e chama onFinish', async () => {
        const onFinishMock = vi.fn();
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            setup() {
                return { onFinishMock };
            },
            template: `
                <MaxSteps id="steps-nav-3" :cached="false" value="2" :onFinish="onFinishMock">
                    <MaxStepItem value="1" title="P1"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        expect(wrapper.find('.btn-step-next').exists()).toBe(false);
        const finishBtn = wrapper.find('.btn-step-finish');
        expect(finishBtn.exists()).toBe(true);
        expect(finishBtn.text()).toContain('Concluir');

        await finishBtn.trigger('click');
        expect(onFinishMock).toHaveBeenCalledTimes(1);
    });
});

describe('MaxSteps — Validação em onNext e Bloqueio', () => {
    it('bloqueia avanço se onNext retornar false', async () => {
        const itemOnNext = vi.fn(() => false);

        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            setup() {
                return { itemOnNext };
            },
            template: `
                <MaxSteps id="steps-block-1" :cached="false">
                    <MaxStepItem value="1" title="P1" :onNext="itemOnNext"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        await wrapper.find('.btn-step-next').trigger('click');
        await settle();

        expect(itemOnNext).toHaveBeenCalled();
        expect(wrapper.find('.c1').exists()).toBe(true);
        expect(wrapper.find('.c2').exists()).toBe(false);
    });

    it('permite avanço se onNext retornar true ou Promise<void>', async () => {
        const itemOnNext = vi.fn(async () => true);

        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            setup() {
                return { itemOnNext };
            },
            template: `
                <MaxSteps id="steps-block-2" :cached="false">
                    <MaxStepItem value="1" title="P1" :onNext="itemOnNext"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        await wrapper.find('.btn-step-next').trigger('click');
        await settle();

        expect(itemOnNext).toHaveBeenCalled();
        expect(wrapper.find('.c2').exists()).toBe(true);
    });
});

describe('MaxSteps — nextOnlyDone', () => {
    it('desabilita botão Avançar se o passo atual não estiver done', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="steps-done-1" :cached="false" :nextOnlyDone="true">
                    <MaxStepItem value="1" title="P1" :done="false"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const nextBtn = wrapper.find('.btn-step-next');
        expect(nextBtn.attributes('disabled')).toBeDefined();
    });

    it('habilita botão Avançar se o passo atual estiver done', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="steps-done-2" :cached="false" :nextOnlyDone="true">
                    <MaxStepItem value="1" title="P1" :done="true"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const nextBtn = wrapper.find('.btn-step-next');
        expect(nextBtn.attributes('disabled')).toBeUndefined();

        await nextBtn.trigger('click');
        await settle();

        expect(wrapper.find('.c2').exists()).toBe(true);
    });

    it('bloqueia clique manual em passos futuros se houver passos anteriores não concluídos', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="steps-done-3" :cached="false" :nextOnlyDone="true" :allowManual="true">
                    <MaxStepItem value="1" title="P1" :done="false"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                    <MaxStepItem value="3" title="P3"><div class="c3">C3</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        await headers[2].trigger('click');
        await settle();

        // Permanece no passo 1 pois o passo 1 não é done
        expect(wrapper.find('.c1').exists()).toBe(true);
        expect(wrapper.find('.c3').exists()).toBe(false);
    });
});

describe('MaxSteps — allowManual', () => {
    it('permite navegar diretamente ao clicar no cabeçalho quando allowManual é true', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="steps-manual-1" :cached="false" :allowManual="true">
                    <MaxStepItem value="1" title="P1"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        await headers[1].trigger('click');
        await settle();

        expect(wrapper.find('.c2').exists()).toBe(true);
    });

    it('não permite navegar pelo cabeçalho quando allowManual é false', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="steps-manual-2" :cached="false" :allowManual="false">
                    <MaxStepItem value="1" title="P1"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        await headers[1].trigger('click');
        await settle();

        expect(wrapper.find('.c1').exists()).toBe(true);
        expect(wrapper.find('.c2').exists()).toBe(false);
    });
});

describe('MaxSteps — Callbacks onEnter e onLeave', () => {
    it('dispara onEnter ao entrar e onLeave ao sair do item', async () => {
        const onEnter1 = vi.fn();
        const onLeave1 = vi.fn();
        const onEnter2 = vi.fn();
        const onLeave2 = vi.fn();

        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            setup() {
                return { onEnter1, onLeave1, onEnter2, onLeave2 };
            },
            template: `
                <MaxSteps id="steps-callbacks" :cached="false">
                    <MaxStepItem value="1" title="P1" :onEnter="onEnter1" :onLeave="onLeave1"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2" :onEnter="onEnter2" :onLeave="onLeave2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        expect(onEnter1).toHaveBeenCalled();
        expect(onLeave1).not.toHaveBeenCalled();

        await wrapper.find('.btn-step-next').trigger('click');
        await settle();

        expect(onLeave1).toHaveBeenCalled();
        expect(onEnter2).toHaveBeenCalled();
    });
});
