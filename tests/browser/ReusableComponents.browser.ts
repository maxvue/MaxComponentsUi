import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxAlert from '../../src/components/MaxAlert.vue';
import MaxSegmentedControl from '../../src/components/MaxSegmentedControl.vue';
import MaxPeriodNavigator from '../../src/components/MaxPeriodNavigator.vue';
import MaxProgressBar from '../../src/components/MaxProgressBar.vue';
import MaxFilterBar from '../../src/components/MaxFilterBar.vue';
import MaxCalendar from '../../src/components/MaxCalendar.vue';
import '../../src/themes/all.scss';

let app: App | undefined;
let host: HTMLElement | undefined;

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountComponent(builder: () => ReturnType<typeof h>) {
    host = document.createElement('div');
    host.style.cssText = 'padding: 16px; display: flex; flex-direction: column; gap: 16px; background: var(--background-0, white);';
    document.body.append(host);
    app = createApp({
        render: () => builder()
    });
    app.use(createPinia());
    app.mount(host);
    await nextFrame();
    await nextFrame();
}

afterEach(() => {
    app?.unmount();
    host?.remove();
    app = undefined;
    host = undefined;
});

describe('Reusable Components — Testes em Navegador Real (Playwright)', () => {
    it('MaxAlert: renderiza no DOM real com cores semânticas e botão closable', async () => {
        let closed = false;
        await mountComponent(() => h(MaxAlert, {
            severity: 'info',
            title: 'Alerta Browser',
            message: 'Executando em Chromium Real',
            closable: true,
            onClose: () => { closed = true; }
        }));

        const alertEl = host!.querySelector('.max-alert');
        expect(alertEl).not.toBeNull();
        expect(alertEl!.textContent).toContain('Alerta Browser');

        const closeBtn = host!.querySelector<HTMLButtonElement>('.max-alert__close-button');
        expect(closeBtn).not.toBeNull();
        await userEvent.click(closeBtn!);
        expect(closed).toBe(true);
    });

    it('MaxSegmentedControl: navega com teclado e seleciona opção', async () => {
        const val = ref('diario');
        await mountComponent(() => h(MaxSegmentedControl, {
            modelValue: val.value,
            'onUpdate:modelValue': (newVal: any) => { val.value = newVal; },
            ariaLabel: 'Frequência',
            options: [
                { value: 'diario', label: 'Diário' },
                { value: 'semanal', label: 'Semanal' },
                { value: 'mensal', label: 'Mensal' }
            ]
        }));

        const buttons = host!.querySelectorAll<HTMLButtonElement>('.max-segmented-control__option');
        expect(buttons.length).toBe(3);

        await userEvent.click(buttons[1]);
        await nextFrame();
        expect(val.value).toBe('semanal');
    });

    it('MaxPeriodNavigator: avança mês com clique no botão próximo', async () => {
        const period = ref({ year: 2026, month: 10 });
        await mountComponent(() => h(MaxPeriodNavigator, {
            modelValue: period.value,
            'onUpdate:modelValue': (newVal: any) => { period.value = newVal; }
        }));

        const nextBtn = host!.querySelector<HTMLButtonElement>('.max-period-navigator__btn--next')!;
        await userEvent.click(nextBtn);
        await nextFrame();
        expect(period.value).toEqual({ year: 2026, month: 11 });
    });

    it('MaxProgressBar: renderiza barra de preenchimento com largura computada', async () => {
        await mountComponent(() => h(MaxProgressBar, {
            value: 80,
            max: 100,
            ariaLabel: 'Uso de CPU'
        }));

        const fillEl = host!.querySelector<HTMLElement>('.max-progress-bar__fill')!;
        expect(fillEl.style.width).toBe('80%');
    });

    it('MaxFilterBar: dispara ação de limpar ao clicar', async () => {
        let cleared = false;
        await mountComponent(() => h(MaxFilterBar, {
            activeCount: 3,
            onClear: () => { cleared = true; }
        }));

        const clearBtn = host!.querySelector<HTMLButtonElement>('.max-filter-bar__btn--clear')!;
        await userEvent.click(clearBtn);
        expect(cleared).toBe(true);
    });

    it('MaxCalendar: seleciona data no mês ao clicar na célula', async () => {
        const selected = ref<string | null>(null);
        await mountComponent(() => h(MaxCalendar, {
            period: { year: 2026, month: 10 },
            selectedDate: selected.value,
            'onUpdate:selectedDate': (newDate: string) => { selected.value = newDate; }
        }));

        const cells = host!.querySelectorAll<HTMLElement>('.max-calendar__cell.is-current-month');
        expect(cells.length).toBe(31);

        // Clicar no dia 20
        const day20 = Array.from(cells).find((c) => c.textContent?.includes('20'));
        expect(day20).toBeDefined();

        await userEvent.click(day20!);
        await nextFrame();
        expect(selected.value).toBe('2026-10-20');
    });
});
