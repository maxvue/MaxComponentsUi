import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { vMaska } from 'maska/vue';
import MaxBaseInput from '../../../src/components/base/MaxBaseInput.vue';

function mountInput(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxBaseInput, { props, attrs });
}

describe('MaxBaseInput', () => {
    // 1. contrato estrutural: a raiz PRECISA ser o proprio <input>, senao o v-maska
    //    (aplicado pelos componentes que consomem esta primitiva) vai para o elemento
    //    errado e a mascara quebra silenciosamente.
    it('renderiza um <input> como elemento raiz', () => {
        const wrapper = mountInput();

        // Olha o HTML bruto, NAO wrapper.element: o @vue/test-utils resolve
        // wrapper.element ate o filho significativo, entao ele continuaria dizendo
        // 'INPUT' mesmo com um <div> em volta — e o guardiao do v-maska seria inutil.
        expect(wrapper.html().trim().startsWith('<input')).toBe(true);
        expect(wrapper.find('div').exists()).toBe(false);
    });

    it('aplica a classe base max-input', () => {
        const wrapper = mountInput();

        expect(wrapper.classes()).toContain('max-input');
    });

    // 2. portao da migracao: nenhuma classe do PrimeVue pode ser emitida
    it('nao emite nenhuma classe .p-* do PrimeVue', () => {
        const wrapper = mountInput({ modelValue: 'algo', size: 'small', invalid: true, fluid: true, variant: 'filled', disabled: true });

        for (const cls of wrapper.classes()) expect(cls.startsWith('p-')).toBe(false);

        expect(wrapper.html()).not.toContain('p-component');
        expect(wrapper.html()).not.toContain('p-inputtext');
    });

    it('marca max-input-has-value apenas quando ha valor', async () => {
        const wrapper = mountInput({ modelValue: 'texto' });
        expect(wrapper.classes()).toContain('max-input-has-value');

        await wrapper.setProps({ modelValue: '' });
        expect(wrapper.classes()).not.toContain('max-input-has-value');

        await wrapper.setProps({ modelValue: null });
        expect(wrapper.classes()).not.toContain('max-input-has-value');
    });

    it('emite update:modelValue com o valor digitado', async () => {
        const wrapper = mountInput({ modelValue: '' });

        // Dispara o evento nativo em vez de usar setValue(): o setValue do test-utils
        // emite update:modelValue por conta propria quando a prop existe, o que
        // mascararia a ausencia do emit dentro do componente (mutacao sobreviveria).
        const el = wrapper.element as HTMLInputElement;
        el.value = 'abc';
        await wrapper.trigger('input');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['abc']);
    });

    it('reflete a prop modelValue no valor do input (prop -> view)', async () => {
        const wrapper = mountInput({ modelValue: 'inicial' });
        expect((wrapper.element as HTMLInputElement).value).toBe('inicial');

        await wrapper.setProps({ modelValue: 'alterado' });
        expect((wrapper.element as HTMLInputElement).value).toBe('alterado');
    });

    it('emite blur e focus', async () => {
        const wrapper = mountInput();

        await wrapper.trigger('focus');
        await wrapper.trigger('blur');

        expect(wrapper.emitted('focus')).toBeTruthy();
        expect(wrapper.emitted('blur')).toBeTruthy();
    });

    it('aplica as classes de tamanho e de fluid', () => {
        expect(mountInput({ size: 'small' }).classes()).toContain('max-input-sm');
        expect(mountInput({ size: 'large' }).classes()).toContain('max-input-lg');
        expect(mountInput({ fluid: true }).classes()).toContain('max-input-fluid');
        expect(mountInput({ variant: 'filled' }).classes()).toContain('max-input-filled');

        const padrao = mountInput();
        expect(padrao.classes()).not.toContain('max-input-sm');
        expect(padrao.classes()).not.toContain('max-input-lg');
        expect(padrao.classes()).not.toContain('max-input-fluid');
    });

    it('reflete invalid na classe e em aria-invalid', () => {
        const invalido = mountInput({ invalid: true });
        expect(invalido.classes()).toContain('max-input-invalid');
        expect(invalido.attributes('aria-invalid')).toBe('true');

        const valido = mountInput({ invalid: false });
        expect(valido.classes()).not.toContain('max-input-invalid');
        expect(valido.attributes('aria-invalid')).toBeUndefined();
    });

    it('reflete disabled no atributo e na classe', () => {
        const wrapper = mountInput({ disabled: true });

        expect(wrapper.attributes('disabled')).toBeDefined();
        expect(wrapper.classes()).toContain('max-input-disabled');
        expect((wrapper.element as HTMLInputElement).disabled).toBe(true);
    });

    it('repassa atributos herdados para o <input>', () => {
        const wrapper = mountInput({}, { type: 'email', placeholder: 'seu@email.com', maxlength: '10', id: 'campo-email' });

        expect(wrapper.attributes('type')).toBe('email');
        expect(wrapper.attributes('placeholder')).toBe('seu@email.com');
        expect(wrapper.attributes('maxlength')).toBe('10');
        expect(wrapper.attributes('id')).toBe('campo-email');
    });

    it('expoe focus() e $el', () => {
        // attachTo: focus() so tem efeito com o elemento anexado ao documento
        const wrapper = mount(MaxBaseInput, { attachTo: document.body });

        expect(typeof wrapper.vm.focus).toBe('function');
        wrapper.vm.focus();
        expect(document.activeElement).toBe(wrapper.element);

        wrapper.unmount();
    });

    // 3. o motivo real do requisito "raiz = <input>": com um <div> em volta, a diretiva
    //    seria aplicada no wrapper e a mascara nunca formataria o valor.
    it('funciona com v-maska aplicado por um componente consumidor', async () => {
        const Consumidor = {
            components: { MaxBaseInput },
            directives: { maska: vMaska },
            data: () => ({ valor: '' }),
            template: '<MaxBaseInput v-maska="\'###.###\'" v-model="valor" />'
        };

        const wrapper = mount(Consumidor);
        const input = wrapper.find('input');

        expect(input.element.tagName).toBe('INPUT');

        await input.setValue('123456');
        expect(input.element.value).toBe('123.456');
    });
});
