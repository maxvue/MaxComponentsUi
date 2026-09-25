import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import MaxSteps from '../../src/components/MaxSteps.vue';
import MaxStepItem from '../../src/components/MaxStepItem.vue';

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

describe('MaxStepItem — Status Visuais (done, error, caution)', () => {
    it('renderiza o status done e ícone correspondente', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-status-1" :cached="false" value="2">
                    <MaxStepItem value="1" title="Passo 1" :done="true"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="Passo 2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].classes()).toContain('is-done');
        expect(headers[0].find('.status-done').exists()).toBe(true);
    });

    it('renderiza o status error e ícone correspondente', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-status-2" :cached="false" value="2">
                    <MaxStepItem value="1" title="Passo 1" :error="true"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="Passo 2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].classes()).toContain('is-error');
        expect(headers[0].find('.status-error').exists()).toBe(true);
    });

    it('renderiza o status caution e ícone correspondente', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-status-3" :cached="false" value="2">
                    <MaxStepItem value="1" title="Passo 1" :caution="true"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="Passo 2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].classes()).toContain('is-caution');
        expect(headers[0].find('.status-caution').exists()).toBe(true);
    });
});

describe('MaxStepItem — Aliases de Props e Labels', () => {
    it('suporta customização de nextLabel e previousLabel no item', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-labels-1" :cached="false">
                    <MaxStepItem value="1" title="P1" nextLabel="Continuar"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2" previousLabel="Retornar"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        expect(wrapper.find('.btn-step-next').text()).toContain('Continuar');

        await wrapper.find('.btn-step-next').trigger('click');
        await settle();

        expect(wrapper.find('.btn-step-prev').text()).toContain('Retornar');
    });

    it('suporta aliases FowardLabel e BackLabel no item', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-labels-2" :cached="false">
                    <MaxStepItem value="1" title="P1" FowardLabel="Prosseguir"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2" BackLabel="Anterior"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        expect(wrapper.find('.btn-step-next').text()).toContain('Prosseguir');

        await wrapper.find('.btn-step-next').trigger('click');
        await settle();

        expect(wrapper.find('.btn-step-prev').text()).toContain('Anterior');
    });

    it('suporta aliases onFoward e onBack no item', async () => {
        const onFowardMock = vi.fn();
        const onBackMock = vi.fn();

        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            setup() {
                return { onFowardMock, onBackMock };
            },
            template: `
                <MaxSteps id="item-aliases-1" :cached="false">
                    <MaxStepItem value="1" title="P1" :onFoward="onFowardMock"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2" :onBack="onBackMock"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        await wrapper.find('.btn-step-next').trigger('click');
        await settle();
        expect(onFowardMock).toHaveBeenCalled();

        await wrapper.find('.btn-step-prev').trigger('click');
        await settle();
        expect(onBackMock).toHaveBeenCalled();
    });

    it('suporta slot customizado de footer no item', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-footer-custom" :cached="false">
                    <MaxStepItem value="1" title="P1">
                        <div class="c1">C1</div>
                        <template #footer="{ next }">
                            <button class="custom-next-btn" @click="next">Meu Botão Avançar</button>
                        </template>
                    </MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const customBtn = wrapper.find('.custom-next-btn');
        expect(customBtn.exists()).toBe(true);

        await customBtn.trigger('click');
        await settle();

        expect(wrapper.find('.c2').exists()).toBe(true);
    });
});

describe('MaxStepItem — Suporte a labelMobile e LabelMobile', () => {
    it('exibe labelMobile quando em modo mobile e title quando desktop', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-mobile-1" :cached="false" :isMobile="false">
                    <MaxStepItem value="1" title="Informações Pessoais Longas" labelMobile="Dados"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="Endereço de Entrega"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].find('.step-title-text').text()).toBe('Informações Pessoais Longas');

        // Alterna para mobile
        await wrapper.setProps({ isMobile: true });
        await settle();

        expect(headers[0].find('.step-title-text').text()).toBe('Dados');
        // O segundo step não tem labelMobile, então deve manter o title
        expect(headers[1].find('.step-title-text').text()).toBe('Endereço de Entrega');
    });

    it('suporta o alias PascalCase LabelMobile', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-mobile-2" :cached="false" :isMobile="true">
                    <MaxStepItem value="1" title="Configurações Avançadas" LabelMobile="Config"><div class="c1">C1</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].find('.step-title-text').text()).toBe('Config');
    });
});

describe('MaxStepItem — Prop status Unificada e Badges Secundários', () => {
    it('suporta status="concluido" e status="done", exibindo badge boxicons:check-circle-filled', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-status-unif-1" :cached="false" value="2">
                    <MaxStepItem value="1" title="P1" status="concluido"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2" status="done"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].classes()).toContain('is-done');
        const badge1 = headers[0].find('.badge-done');
        expect(badge1.exists()).toBe(true);
        expect(badge1.findComponent({ name: 'MaxIcon' }).props('icon')).toBe('boxicons:check-circle-filled');

        expect(headers[1].classes()).toContain('is-done');
        expect(headers[1].classes()).toContain('is-active');
        const badge2 = headers[1].find('.badge-done');
        expect(badge2.exists()).toBe(true);
        expect(badge2.findComponent({ name: 'MaxIcon' }).props('icon')).toBe('boxicons:check-circle-filled');
    });

    it('suporta status="erro" e status="error", exibindo badge bi:exclamation-circle-fill', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-status-unif-2" :cached="false" value="2">
                    <MaxStepItem value="1" title="P1" status="erro"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].classes()).toContain('is-error');
        const badge = headers[0].find('.badge-error');
        expect(badge.exists()).toBe(true);
        expect(badge.findComponent({ name: 'MaxIcon' }).props('icon')).toBe('bi:exclamation-circle-fill');
    });

    it('suporta status="pendencia", status="pending" e :pending="true", exibindo badge bxs:help-circle', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-status-unif-3" :cached="false" value="1">
                    <MaxStepItem value="1" title="P1" status="pendencia"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="P2" :pending="true"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].classes()).toContain('is-pending');
        const badge1 = headers[0].find('.badge-pending');
        expect(badge1.exists()).toBe(true);
        expect(badge1.findComponent({ name: 'MaxIcon' }).props('icon')).toBe('bxs:help-circle');

        expect(headers[1].classes()).toContain('is-pending');
        const badge2 = headers[1].find('.badge-pending');
        expect(badge2.exists()).toBe(true);
        expect(badge2.findComponent({ name: 'MaxIcon' }).props('icon')).toBe('bxs:help-circle');
    });

    it('step ativo renderiza linha indicadora de step aberto .step-active-line', async () => {
        const wrapper = mount(defineComponent({
            components: { MaxSteps, MaxStepItem },
            template: `
                <MaxSteps id="item-active-line" :cached="false" value="1">
                    <MaxStepItem value="1" title="Passo Aberto"><div class="c1">C1</div></MaxStepItem>
                    <MaxStepItem value="2" title="Passo Fechado"><div class="c2">C2</div></MaxStepItem>
                </MaxSteps>
            `
        }));

        await settle();

        const headers = wrapper.findAll('.max-step-header-item');
        expect(headers[0].classes()).toContain('is-active');
        expect(headers[0].find('.step-active-line').exists()).toBe(true);
        expect(headers[1].classes()).not.toContain('is-active');
    });
});

