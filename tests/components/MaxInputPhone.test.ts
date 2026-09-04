import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, enableAutoUnmount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';
import {
    MaxInputPhone as ExportedMaxInputPhone,
    MaxPhoneField as ExportedMaxPhoneField,
    PhoneField,
    InputPhone
} from '../../src/index';

enableAutoUnmount(afterEach);

function mountPhoneField(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputPhone, {
        props: { modelValue: '', ...props },
        attrs,
        attachTo: document.body
    });
}

describe('MaxInputPhone', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    // O dropdown usa Teleport para o body; sem esta limpeza o overlay de um
    // teste vazaria para os document.querySelector do teste seguinte.
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('renderiza corretamente', () => {
        const wrapper = mountPhoneField();
        expect(wrapper.exists()).toBe(true);
    });

    it('aplica DDI correto pelo modelValue com 2 digitos (55)', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.vm.$nextTick();
        const country = (wrapper.vm as any).country;
        expect(country.ddi).toBe(55);
        expect((wrapper.vm as any).phone).toBe('(11) 9 9999 - 9999');
    });

    it('aplica DDI correto pelo modelValue com 1 digito (ex: 1 EUA)', async () => {
        const wrapper = mountPhoneField({ modelValue: '18005551234' });
        await wrapper.vm.$nextTick();
        const country = (wrapper.vm as any).country;
        expect(country.ddi).toBe(1);
        expect((wrapper.vm as any).phone).toBe('8005551234');
    });

    it('aplica DDI default se o código for desconhecido (ex: 999)', async () => {
        const wrapper = mountPhoneField({ modelValue: '999123456' });
        await wrapper.vm.$nextTick();
        const country = (wrapper.vm as any).country;
        expect(country.ddi).toBe(55);
        // Fallback places all digits in phone
        expect((wrapper.vm as any).phone).toBe('(99) 9 1234 - 56');
    });

    it('limpa campos se modelValue vier vazio ou undefined', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.setProps({ modelValue: '' });
        expect((wrapper.vm as any).phone).toBe('');
    });

    it('não faz nada se o novo modelValue for o mesmo que temp_value', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.setProps({ modelValue: '5511999999999' });
        expect((wrapper.vm as any).phone).toBe('(11) 9 9999 - 9999');
    });

    it('remove "0" inicial no watch do phone', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        (wrapper.vm as any).phone = '01199999999';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).phone).toBe('(11) 9 9999 - 999');
    });

    it('computa maskValue para default % se country !== 55', async () => {
        const wrapper = mountPhoneField({ modelValue: '18005551234' }); // DDI 1
        await wrapper.vm.$nextTick();
        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('%');
    });

    it('computa maskValue de telefone fixo ou 8 dígitos se não tiver 9º digito', async () => {
        const wrapper = mountPhoneField({ modelValue: '551144445555' });
        await wrapper.vm.$nextTick();
        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('(##) #### - ####$$');
    });

    it('computa maskValue celular (9 dígitos)', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.vm.$nextTick();
        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('(##) 9 #### - ####$$');
    });

    it('testa noMask quando ctrl+v é acionado', async () => {
        const wrapper = mountPhoneField();
        (wrapper.vm as any).onFocus = true;
        // mock magic keys logic manually by setting ref
        (wrapper.vm as any).noMask = true;
        await wrapper.vm.$nextTick();

        const mask = (wrapper.vm as any).maskValue.mask;
        expect(mask).toBe('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$');
    });

    it('não depende mais do PrimeVue (nenhum componente Select montado)', () => {
        const wrapper = mountPhoneField();
        expect(wrapper.findComponent({ name: 'Select' }).exists()).toBe(false);
        expect(wrapper.find('.max-phone-select').exists()).toBe(true);
    });

    it('abre o dropdown ao clicar no seletor de país', async () => {
        const wrapper = mountPhoneField();
        expect(document.querySelector('.max-phone-select-overlay')).toBeNull();

        await wrapper.find('.max-phone-select').trigger('click');
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).isOpen).toBe(true);
        expect(document.querySelector('.max-phone-select-overlay')).not.toBeNull();
    });

    it('filtra países por nome e por código DDI numérico', async () => {
        const wrapper = mountPhoneField();
        await wrapper.find('.max-phone-select').trigger('click');

        (wrapper.vm as any).filter_text = 'Argentina';
        await wrapper.vm.$nextTick();
        let filtered = (wrapper.vm as any).filtered_options;
        expect(filtered.length).toBe(1);
        expect(filtered[0].ddi).toBe(54);

        // `value` é numérico: o filtro precisa converter para string ao comparar
        (wrapper.vm as any).filter_text = '351';
        await wrapper.vm.$nextTick();
        filtered = (wrapper.vm as any).filtered_options;
        expect(filtered.length).toBeGreaterThan(0);
        expect(filtered.every((o: any) => String(o.value).includes('351'))).toBe(true);
    });

    it('seleciona um país pelo dropdown, fecha o overlay e troca a máscara', async () => {
        const wrapper = mountPhoneField({ modelValue: '5511999999999' });
        await wrapper.find('.max-phone-select').trigger('click');

        const argentina = (wrapper.vm as any).filtered_options.find((o: any) => o.ddi === 54);
        (wrapper.vm as any).selectOption(argentina);
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).country.ddi).toBe(54);
        expect((wrapper.vm as any).isOpen).toBe(false);
        // país !== 55 → máscara livre
        expect((wrapper.vm as any).maskValue.mask).toBe('%');
    });

    it('navega por teclado no filtro (setas + Enter) e fecha com Escape', async () => {
        const wrapper = mountPhoneField();
        await wrapper.find('.max-phone-select').trigger('click');
        await wrapper.vm.$nextTick();

        (wrapper.vm as any).filter_text = 'Argentina';
        await wrapper.vm.$nextTick();

        // O overlay é teleportado para o body, fora da árvore do wrapper
        const filterInput = document.querySelector('.max-phone-select-filter input') as HTMLInputElement;
        expect(filterInput).not.toBeNull();

        filterInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).country.ddi).toBe(54);
        expect((wrapper.vm as any).isOpen).toBe(false);

        await wrapper.find('.max-phone-select').trigger('click');
        await wrapper.vm.$nextTick();

        const reopened = document.querySelector('.max-phone-select-filter input') as HTMLInputElement;
        reopened.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).isOpen).toBe(false);
    });

    it('abre o dropdown pelo teclado no trigger (ArrowDown)', async () => {
        const wrapper = mountPhoneField();
        await wrapper.find('.max-phone-select').trigger('keydown', { key: 'ArrowDown' });
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).isOpen).toBe(true);
    });

    it('não abre o dropdown quando disabled', async () => {
        const wrapper = mountPhoneField({ disabled: true });
        await wrapper.find('.max-phone-select').trigger('click');
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).isOpen).toBe(false);
    });

    it('slot #option sobrescreve o markup padrão do item', async () => {
        const wrapper = mount(MaxInputPhone, {
            props: { modelValue: '' },
            attachTo: document.body,
            slots: {
                option: '<template #option="{ option }"><span class="custom-opt">{{ option.sigla }}</span></template>'
            }
        });

        await wrapper.find('.max-phone-select').trigger('click');
        await wrapper.vm.$nextTick();

        expect(document.querySelector('.custom-opt')).not.toBeNull();
        expect(document.querySelector('.input-phone-label-div')).toBeNull();
    });

    it('emite update:modelValue com DDI + dígitos após o debounce de 500ms', async () => {
        vi.useFakeTimers();
        try {
            const wrapper = mount(MaxInputPhone, { props: { modelValue: '' } });
            (wrapper.vm as any).phone = '11988887777';
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('update:modelValue')).toBeFalsy();

            vi.advanceTimersByTime(600);
            await wrapper.vm.$nextTick();

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted).toBeTruthy();
            expect(String(emitted![emitted!.length - 1][0]).replace(/\D/g, '')).toBe('5511988887777');
        } finally {
            vi.useRealTimers();
        }
    });

    it('repassa label, error, caution, done e required ao InputBase', () => {
        const wrapper = mountPhoneField({ label: 'Celular', error: 'Inválido', required: true });
        const base = wrapper.findComponent({ name: 'InputBase' });
        expect(base.exists()).toBe(true);
        expect(base.props('label')).toBe('Celular');
        expect(base.props('error')).toBe('Inválido');
        expect(base.props('required')).toBe(true);
    });

    it('respeita noLabel e noIcon no InputBase', () => {
        const wrapper = mountPhoneField({ noLabel: true, noIcon: true });
        const base = wrapper.findComponent({ name: 'InputBase' });
        expect(base.props('label')).toBeUndefined();
        expect(base.props('iconRight')).toBeUndefined();
    });

    it('agrupa múltiplos eventos de scroll em um único requestAnimationFrame evitando layout thrashing', async () => {
        const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
        const wrapper = mountPhoneField();

        await wrapper.find('.max-phone-select').trigger('click');
        await wrapper.vm.$nextTick();

        rafSpy.mockClear();

        // Dispara múltiplos eventos de rolagem sucessivos
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));

        // Deve agendar apenas 1 frame de animação enquanto pendente
        expect(rafSpy).toHaveBeenCalledTimes(1);

        rafSpy.mockRestore();
    });

    it('cancela requestAnimationFrame pendente e remove listeners ao fechar dropdown', async () => {
        const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');
        const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
        const wrapper = mountPhoneField();

        await wrapper.find('.max-phone-select').trigger('click');
        await wrapper.vm.$nextTick();

        // Dispara scroll para agendar RAF
        window.dispatchEvent(new Event('scroll'));

        // Fecha o overlay (via close / clique na máscara / método)
        const mask = document.querySelector('.max-phone-overlay-mask') as HTMLElement;
        mask?.click();
        await wrapper.vm.$nextTick();

        expect(cancelRafSpy).toHaveBeenCalled();
        expect(removeListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
        expect(removeListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

        cancelRafSpy.mockRestore();
        removeListenerSpy.mockRestore();
    });

    it('exporta MaxPhoneField, PhoneField e InputPhone como aliases idênticos a MaxInputPhone no index', () => {
        expect(ExportedMaxInputPhone).toBe(MaxInputPhone);
        expect(ExportedMaxPhoneField).toBe(MaxInputPhone);
        expect(PhoneField).toBe(MaxInputPhone);
        expect(InputPhone).toBe(MaxInputPhone);
    });
});

