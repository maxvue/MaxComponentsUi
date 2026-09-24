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
