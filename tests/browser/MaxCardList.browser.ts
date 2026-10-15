import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref, type App } from 'vue';
import MaxCardList from '../../src/components/MaxCardList.vue';
import MaxCard from '../../src/components/MaxCard.vue';
import MaxSubCard from '../../src/components/MaxSubCard.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitTicks(count = 5): Promise<void> {
    for (let i = 0; i < count; i++) await nextFrame();
}

async function mountCardListBrowser(props: Record<string, unknown> = {}, slots: Record<string, any> = {}, hostWidth = 1200) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    hostElement = document.createElement('div');
    hostElement.id = 'card-list-test-host';
    hostElement.style.width = `${hostWidth}px`;
    hostElement.style.boxSizing = 'border-box';
    document.body.appendChild(hostElement);

    const reactiveProps = ref({ ...props });

    const app = createApp({
        render() {
            return h(MaxCardList, reactiveProps.value, slots);
        }
    });

    activeApp = app;
    app.mount(hostElement);

    await waitTicks(10);

    return {
        host: hostElement,
        props: reactiveProps,
        app
    };
}

afterEach(() => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
    document.body.innerHTML = '';
});

describe('MaxCardList - Prova Geométrica em Chromium Real (R1-R6)', () => {
    it('centraliza o elemento de adicionar nos dois eixos da região de conteúdo quando vazio (R1)', async () => {
        const { host } = await mountCardListBrowser({
            items: [],
            showAddCard: true,
            addCardLabel: 'Criar Primeiro Item',
            height: '400px',
            virtualScroll: true
        });

        const emptyStatus = host.querySelector('.max-card-list-empty-add') as HTMLElement;
        expect(emptyStatus).not.toBeNull();

        const addCard = emptyStatus.querySelector('.max-card--add') as HTMLElement;
        expect(addCard).not.toBeNull();

        const statusRect = emptyStatus.getBoundingClientRect();
        const addRect = addCard.getBoundingClientRect();

        const statusCenterX = statusRect.left + statusRect.width / 2;
        const addCenterX = addRect.left + addRect.width / 2;
        const statusCenterY = statusRect.top + statusRect.height / 2;
        const addCenterY = addRect.top + addRect.height / 2;

        // Tolerância geométrica de até 2px para subpixel rounding
        expect(Math.abs(statusCenterX - addCenterX)).toBeLessThanOrEqual(2);
        expect(Math.abs(statusCenterY - addCenterY)).toBeLessThanOrEqual(2);
    });

    it('faz o card com subcards acompanhar a largura necessária sem preencher a coluna inteira no desktop (R2)', async () => {
        const { host } = await mountCardListBrowser(
            {
                items: [{ id: 1, title: 'Grupo Único' }],
                columns: 1,
                minCardWidth: 280,
                virtualScroll: false
            },
            {
                card: () => h(
                    MaxCard,
                    { title: 'Card com 1 Subcard' },
                    () => [
                        h(MaxSubCard, { title: 'Subcard 1', style: { width: '280px' } })
                    ]
                )
            },
            1200
        );

        const card = host.querySelector('.max-card') as HTMLElement;
        expect(card).not.toBeNull();

        const cardRect = card.getBoundingClientRect();
        // Em vez de ocupar os 1200px da coluna inteira, deve acompanhar os 280px + padding/border (aprox 314px)
        expect(cardRect.width).toBeLessThan(500);
        expect(cardRect.width).toBeGreaterThanOrEqual(280);
    });

    it('permite que o grupo cresça até o teto da lista e quebre os subcards em novas linhas sem overflow (R3)', async () => {
        const { host } = await mountCardListBrowser(
            {
                items: [{ id: 1, title: 'Grupo Multilinha' }],
                columns: 3,
                minCardWidth: 260,
                virtualScroll: false
            },
            {
                card: () => h(
                    MaxCard,
                    { title: 'Card com Vários Subcards' },
                    () => [
                        h(MaxSubCard, { title: 'Sub 1', style: { width: '260px' } }),
                        h(MaxSubCard, { title: 'Sub 2', style: { width: '260px' } }),
                        h(MaxSubCard, { title: 'Sub 3', style: { width: '260px' } }),
                        h(MaxSubCard, { title: 'Sub 4', style: { width: '260px' } }),
                        h(MaxSubCard, { title: 'Sub 5', style: { width: '260px' } }),
                        h(MaxSubCard, { title: 'Sub 6', style: { width: '260px' } })
                    ]
                )
            },
            900
        );

        const card = host.querySelector('.max-card') as HTMLElement;
        expect(card).not.toBeNull();

        const cardRect = card.getBoundingClientRect();
        // A largura do card não deve exceder a largura do host de 900px
        expect(cardRect.width).toBeLessThanOrEqual(902);

        // Os subcards devem ter quebrado em linhas diferentes
        const subcards = Array.from(host.querySelectorAll('.max-subcard'));
        expect(subcards.length).toBe(6);

        const topFirst = subcards[0].getBoundingClientRect().top;
        const topLast = subcards[5].getBoundingClientRect().top;
        expect(topLast).toBeGreaterThan(topFirst);

        // Sem overflow horizontal
        const container = host.querySelector('.max-card-list') as HTMLElement;
        expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 2);
    });

    it('mantém uma coluna e subcards empilhados em ambiente mobile (R4)', async () => {
        const { host } = await mountCardListBrowser(
            {
                items: [{ id: 1, title: 'Item Mobile' }],
                columns: 3,
                virtualScroll: false
            },
            {
                card: () => h(
                    MaxCard,
                    { title: 'Mobile Card' },
                    () => [
                        h(MaxSubCard, { title: 'Sub A' }),
                        h(MaxSubCard, { title: 'Sub B' })
                    ]
                )
            },
            500
        );

        const col = host.querySelector('.max-card-list-col') as HTMLElement;
        expect(col).not.toBeNull();
        expect(col.getBoundingClientRect().width).toBeCloseTo(500, -1);

        const subcards = Array.from(host.querySelectorAll('.max-subcard'));
        expect(subcards.length).toBe(2);

        const subATop = subcards[0].getBoundingClientRect().top;
        const subBTop = subcards[1].getBoundingClientRect().top;
        // No mobile, os subcards devem estar empilhados verticalmente
        expect(subBTop).toBeGreaterThan(subATop);
    });

    it('preserva integridade e cardinalidade do DOM virtualizado com coleção grande (R6)', async () => {
        const dataset = Array.from({ length: 200 }, (_, i) => ({
            id: i + 1,
            title: `Item ${i + 1}`,
            subtitle: `Descrição ${i + 1}`
        }));

        const { host } = await mountCardListBrowser({
            items: dataset,
            virtualScroll: true,
            height: '500px',
            columns: 3,
            overscan: 2
        });

        // DOM não deve ter os 200 itens montados ao mesmo tempo
        const renderedRows = host.querySelectorAll('.max-card-list-row');
        expect(renderedRows.length).toBeLessThan(30);
        expect(renderedRows.length).toBeGreaterThan(0);
    });
});
