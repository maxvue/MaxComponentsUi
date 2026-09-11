import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';

function mountDatePicker(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputDatePicker, {
        props: {
            modelValue: '',
            ...props
        },
        attrs,
        attachTo: document.body
    });
}

describe('MaxInputDatePicker (Unit / WAI-ARIA, Multi-View, Range & Conditional Listener)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    describe('1. Alternância de Vistas (date -> month -> year)', () => {
        it('inicia na vista "date" e alterna sequencialmente ao clicar no título', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).currentView).toBe('date');
            expect(document.body.querySelector('.max-datepicker-grid')).toBeTruthy();
            expect(document.body.querySelector('.max-datepicker-months')).toBeNull();
            expect(document.body.querySelector('.max-datepicker-years')).toBeNull();

            // Clica no título para ir para 'month'
            const titleBtn = document.body.querySelector('.max-datepicker-title-btn') as HTMLButtonElement;
            titleBtn.click();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).currentView).toBe('month');
            expect(document.body.querySelector('.max-datepicker-months')).toBeTruthy();
            const monthButtons = document.body.querySelectorAll('.max-datepicker-month-btn');
            expect(monthButtons.length).toBe(12);

            // Clica no título novamente para ir para 'year'
            titleBtn.click();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).currentView).toBe('year');
            expect(document.body.querySelector('.max-datepicker-years')).toBeTruthy();
            const yearButtons = document.body.querySelectorAll('.max-datepicker-year-btn');
            expect(yearButtons.length).toBe(12);

            // Clica novamente para voltar a 'date'
            titleBtn.click();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).currentView).toBe('date');
        });

        it('selecionar um mês atualiza currentMonth e retorna para a vista "date"', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            (wrapper.vm as any).toggleView();
            await wrapper.vm.$nextTick();

            const monthButtons = document.body.querySelectorAll('.max-datepicker-month-btn');
            // Mês 7 = Agosto (índice 7)
            (monthButtons[7] as HTMLButtonElement).click();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).currentMonth).toBe(7);
            expect((wrapper.vm as any).currentView).toBe('date');
        });

        it('selecionar um ano atualiza currentYear e navega para a vista "month"', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            (wrapper.vm as any).currentView = 'year';
            (wrapper.vm as any).yearRangeStart = 1990;
            await wrapper.vm.$nextTick();

            const yearButtons = document.body.querySelectorAll('.max-datepicker-year-btn');
            const targetBtn = Array.from(yearButtons).find((btn) => btn.textContent?.trim() === '1995') as HTMLButtonElement;
            expect(targetBtn).toBeTruthy();

            targetBtn.click();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).currentYear).toBe(1995);
            expect((wrapper.vm as any).currentView).toBe('month');
        });

        it('navegação do cabeçalho adapta-se à vista corrente', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const navBtns = document.body.querySelectorAll('.max-datepicker-nav-btn');
            const prevBtn = navBtns[0] as HTMLButtonElement;
            const nextBtn = navBtns[1] as HTMLButtonElement;

            // Na vista date: mês anterior / próximo mês
            expect(prevBtn.getAttribute('aria-label')).toBe('Mês anterior');
            expect(nextBtn.getAttribute('aria-label')).toBe('Próximo mês');

            prevBtn.click();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).currentMonth).toBe(3); // Abril

            // Muda para vista month: ano anterior / próximo ano
            (wrapper.vm as any).toggleView();
            await wrapper.vm.$nextTick();
            expect(prevBtn.getAttribute('aria-label')).toBe('Ano anterior');
            expect(nextBtn.getAttribute('aria-label')).toBe('Próximo ano');

            prevBtn.click();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).currentYear).toBe(2023);

            // Muda para vista year: década anterior / próxima década
            (wrapper.vm as any).toggleView();
            await wrapper.vm.$nextTick();
            expect(prevBtn.getAttribute('aria-label')).toBe('Década anterior');
            expect(nextBtn.getAttribute('aria-label')).toBe('Próxima década');

            const currentDecade = (wrapper.vm as any).yearRangeStart;
            prevBtn.click();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).yearRangeStart).toBe(currentDecade - 10);
        });
    });

    describe('2. Restrições de Intervalo (minDate e maxDate)', () => {
        it('desabilita dias anteriores a minDate e bloqueia seleção', async () => {
            const wrapper = mountDatePicker({
                modelValue: '2024-05-15',
                minDate: '2024-05-10'
            });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const dayButtons = document.body.querySelectorAll('.max-datepicker-day');
            // Procura dia 5 de Maio de 2024 (deve estar desabilitado)
            const day5 = Array.from(dayButtons).find((btn) => btn.getAttribute('aria-label') === '5 de Maio de 2024') as HTMLButtonElement;
            expect(day5).toBeTruthy();
            expect(day5.classList.contains('is-disabled')).toBe(true);
            expect(day5.disabled).toBe(true);

            // Clicar no dia 5 não deve alterar a data
            day5.click();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).internalDate.getDate()).toBe(15);

            // Procura dia 12 de Maio de 2024 (deve estar habilitado)
            const day12 = Array.from(dayButtons).find((btn) => btn.getAttribute('aria-label') === '12 de Maio de 2024') as HTMLButtonElement;
            expect(day12).toBeTruthy();
            expect(day12.classList.contains('is-disabled')).toBe(false);
            expect(day12.disabled).toBe(false);

            day12.click();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).internalDate.getDate()).toBe(12);
        });

        it('desabilita dias posteriores a maxDate e bloqueia seleção', async () => {
            const wrapper = mountDatePicker({
                modelValue: '2024-05-15',
                maxDate: '2024-05-20'
            });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const dayButtons = document.body.querySelectorAll('.max-datepicker-day');
            const day25 = Array.from(dayButtons).find((btn) => btn.getAttribute('aria-label') === '25 de Maio de 2024') as HTMLButtonElement;
            expect(day25).toBeTruthy();
            expect(day25.classList.contains('is-disabled')).toBe(true);
            expect(day25.disabled).toBe(true);

            day25.click();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).internalDate.getDate()).toBe(15);
        });

        it('rejeita digitação manual de data fora do range minDate/maxDate', async () => {
            const wrapper = mountDatePicker({
                modelValue: '2024-05-15',
                minDate: '2024-05-10',
                maxDate: '2024-05-20'
            });
            const input = wrapper.find('input');

            input.element.value = '01/05/2024';
            await input.trigger('input');
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).internalDate).toBeNull();
        });
    });

    describe('3. Barra de Ações (Rodapé)', () => {
        it('exibe botões Hoje e Limpar por padrão', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const footer = document.body.querySelector('.max-datepicker-footer');
            expect(footer).toBeTruthy();

            const todayBtn = footer?.querySelector('.max-datepicker-action-btn.today') as HTMLButtonElement;
            const clearBtn = footer?.querySelector('.max-datepicker-action-btn.clear') as HTMLButtonElement;
            expect(todayBtn).toBeTruthy();
            expect(clearBtn).toBeTruthy();
            expect(todayBtn.textContent?.trim()).toBe('Hoje');
            expect(clearBtn.textContent?.trim()).toBe('Limpar');
        });

        it('botão Limpar reseta o valor e fecha o calendário', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const clearBtn = document.body.querySelector('.max-datepicker-action-btn.clear') as HTMLButtonElement;
            clearBtn.click();
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).internalDate).toBeNull();
            expect((wrapper.vm as any).displayValue).toBe('');
            expect((wrapper.vm as any).isOpen).toBe(false);
        });

        it('botão Hoje preenche a data atual se não estiver desabilitada', async () => {
            const wrapper = mountDatePicker({ modelValue: '2020-01-01' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const todayBtn = document.body.querySelector('.max-datepicker-action-btn.today') as HTMLButtonElement;
            todayBtn.click();
            await wrapper.vm.$nextTick();

            const today = new Date();
            expect((wrapper.vm as any).internalDate.getDate()).toBe(today.getDate());
            expect((wrapper.vm as any).internalDate.getMonth()).toBe(today.getMonth());
            expect((wrapper.vm as any).internalDate.getFullYear()).toBe(today.getFullYear());
            expect((wrapper.vm as any).isOpen).toBe(false);
        });

        it('oculta o rodapé quando showButtonBar=false', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15', showButtonBar: false });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            expect(document.body.querySelector('.max-datepicker-footer')).toBeNull();
        });
    });

    describe('4. Acessibilidade WAI-ARIA Grid e Teclado', () => {
        it('expõe estrutura semântica ARIA para grid, linhas e células de data', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const grid = document.body.querySelector('.max-datepicker-grid');
            expect(grid?.getAttribute('role')).toBe('grid');
            expect(grid?.getAttribute('aria-label')).toBe('Maio de 2024');

            const weekdaysRow = document.body.querySelector('.max-datepicker-weekdays');
            expect(weekdaysRow?.getAttribute('role')).toBe('row');

            const columnHeaders = weekdaysRow?.querySelectorAll('[role="columnheader"]');
            expect(columnHeaders?.length).toBe(7);
            expect(columnHeaders?.[0].getAttribute('aria-label')).toBe('Domingo');

            const daysRowgroup = document.body.querySelector('.max-datepicker-days');
            expect(daysRowgroup?.getAttribute('role')).toBe('rowgroup');

            const day15 = Array.from(daysRowgroup?.querySelectorAll('.max-datepicker-day') || []).find(
                (btn) => btn.getAttribute('aria-label') === '15 de Maio de 2024'
            );
            expect(day15).toBeTruthy();
            expect(day15?.getAttribute('role')).toBe('gridcell');
            expect(day15?.getAttribute('aria-selected')).toBe('true');
        });

        it('navegação por teclado na grade move o foco com setas e seleciona com Enter', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const grid = document.body.querySelector('.max-datepicker-grid') as HTMLElement;
            expect(grid).toBeTruthy();

            const initialIndex = (wrapper.vm as any).focusedCellIndex;

            // ArrowRight (+1)
            grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).focusedCellIndex).toBe(initialIndex + 1);

            // ArrowDown (+7)
            grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).focusedCellIndex).toBe(initialIndex + 8);

            // ArrowLeft (-1)
            grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).focusedCellIndex).toBe(initialIndex + 7);

            // ArrowUp (-7)
            grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).focusedCellIndex).toBe(initialIndex);

            // Enter seleciona o dia focado e fecha
            grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).isOpen).toBe(false);
        });

        it('Escape fecha o calendário aberto', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(true);

            const grid = document.body.querySelector('.max-datepicker-grid') as HTMLElement;
            grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
        });
    });

    describe('5. Listener Global Condicional', () => {
        it('anexa listener no window somente com popup aberto e remove ao fechar', async () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            const removeSpy = vi.spyOn(window, 'removeEventListener');

            const wrapper = mountDatePicker();
            expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

            // Abre o painel
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

            // Pressiona Escape no window
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).isOpen).toBe(false);
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        it('remove listener ao desmontar o componente aberto', async () => {
            const removeSpy = vi.spyOn(window, 'removeEventListener');
            const wrapper = mountDatePicker();

            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            wrapper.unmount();
            expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        });
    });

    describe('6. Zero PrimeVue', () => {
        it('não renderiza nenhuma classe legada p-datepicker*', async () => {
            const wrapper = mountDatePicker({ modelValue: '2024-05-15' });
            await wrapper.find('input').trigger('click');
            await wrapper.vm.$nextTick();

            const panel = document.body.querySelector('.max-datepicker-panel');
            expect(panel).toBeTruthy();
            expect(panel?.classList.contains('p-datepicker-panel')).toBe(false);

            const allPElements = document.body.querySelectorAll('[class*="p-datepicker"]');
            expect(allPElements.length).toBe(0);
        });
    });
});
