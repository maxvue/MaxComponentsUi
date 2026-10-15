import { describe, it, expect } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useCardListLayout } from '../../src/helpers/useCardListLayout';

describe('useCardListLayout - Medição contextual e ciclo de vida', () => {
    it('detecta corretamente cards comuns como não sendo grupos de subcards', () => {
        let layoutApi: ReturnType<typeof useCardListLayout> | null = null;

        const TestComp = defineComponent({
            setup() {
                const api = useCardListLayout({ fallbackSubcardWidth: 300 });
                layoutApi = api;
                return () => h('div');
            }
        });

        const wrapper = mount(TestComp);

        const cardEl = document.createElement('div');
        cardEl.className = 'max-card';
        cardEl.innerHTML = '<div class="max-card-content">Texto comum</div>';
        document.body.appendChild(cardEl);

        layoutApi!.registerCellElement('c1', cardEl);
        layoutApi!.measureAll();

        expect(layoutApi!.isGroupMap.value.get('c1')).toBe(false);
        expect(layoutApi!.preferredWidths.value.get('c1')).toBeUndefined();

        cardEl.remove();
        wrapper.unmount();
    });

    it('calcula a largura desejada de um card com subcards usando fallbackSubcardWidth', () => {
        let layoutApi: ReturnType<typeof useCardListLayout> | null = null;

        const TestComp = defineComponent({
            setup() {
                const api = useCardListLayout({ fallbackSubcardWidth: 320 });
                layoutApi = api;
                return () => h('div');
            }
        });

        const wrapper = mount(TestComp);

        const cardEl = document.createElement('div');
        cardEl.className = 'max-card';
        cardEl.innerHTML = `
            <div class="max-card-content">
                <div class="max-subcard">Sub 1</div>
                <div class="max-subcard">Sub 2</div>
            </div>
        `;
        document.body.appendChild(cardEl);

        layoutApi!.registerCellElement('group-2', cardEl);
        layoutApi!.measureAll();

        expect(layoutApi!.isGroupMap.value.get('group-2')).toBe(true);

        // 2 * 320 + (2-1)*12 + 34 = 640 + 12 + 34 = 686px
        const measured = layoutApi!.preferredWidths.value.get('group-2');
        expect(measured).toBe(686);

        cardEl.remove();
        wrapper.unmount();
    });

    it('respeita a variável CSS contextual --max-card-list-subcard-width', () => {
        let layoutApi: ReturnType<typeof useCardListLayout> | null = null;

        const TestComp = defineComponent({
            setup() {
                const api = useCardListLayout({ fallbackSubcardWidth: 320 });
                layoutApi = api;
                return () => h('div');
            }
        });

        const wrapper = mount(TestComp);

        const cardEl = document.createElement('div');
        cardEl.className = 'max-card';
        cardEl.style.setProperty('--max-card-list-subcard-width', '250px');
        cardEl.innerHTML = `
            <div class="max-card-content">
                <div class="max-subcard">Sub A</div>
            </div>
        `;
        document.body.appendChild(cardEl);

        layoutApi!.registerCellElement('custom-subcard', cardEl);
        layoutApi!.measureAll();

        expect(layoutApi!.isGroupMap.value.get('custom-subcard')).toBe(true);

        // 1 * 250 + 0 + 34 = 284px
        const measured = layoutApi!.preferredWidths.value.get('custom-subcard');
        expect(measured).toBe(284);

        cardEl.remove();
        wrapper.unmount();
    });

    it('remove chaves excluídas da coleção via cleanRemovedKeys', () => {
        let layoutApi: ReturnType<typeof useCardListLayout> | null = null;

        const TestComp = defineComponent({
            setup() {
                const api = useCardListLayout();
                layoutApi = api;
                return () => h('div');
            }
        });

        const wrapper = mount(TestComp);

        const card1 = document.createElement('div');
        card1.className = 'max-card';
        card1.innerHTML = '<div class="max-card-content"><div class="max-subcard">1</div></div>';
        document.body.appendChild(card1);

        const card2 = document.createElement('div');
        card2.className = 'max-card';
        card2.innerHTML = '<div class="max-card-content"><div class="max-subcard">2</div></div>';
        document.body.appendChild(card2);

        layoutApi!.registerCellElement('item-1', card1);
        layoutApi!.registerCellElement('item-2', card2);
        layoutApi!.measureAll();

        expect(layoutApi!.preferredWidths.value.has('item-1')).toBe(true);
        expect(layoutApi!.preferredWidths.value.has('item-2')).toBe(true);

        // Remove item-1 da coleção mantida
        layoutApi!.cleanRemovedKeys(new Set(['item-2']));

        expect(layoutApi!.preferredWidths.value.has('item-1')).toBe(false);
        expect(layoutApi!.preferredWidths.value.has('item-2')).toBe(true);

        card1.remove();
        card2.remove();
        wrapper.unmount();
    });

    it('descarta observadores no unmount sem disparar avisos ou loops', async () => {
        let layoutApi: ReturnType<typeof useCardListLayout> | null = null;

        const TestComp = defineComponent({
            setup() {
                const api = useCardListLayout();
                layoutApi = api;
                return () => h('div');
            }
        });

        const wrapper = mount(TestComp);

        const cardEl = document.createElement('div');
        cardEl.className = 'max-card';
        cardEl.innerHTML = '<div class="max-card-content"><div class="max-subcard">1</div></div>';
        document.body.appendChild(cardEl);

        layoutApi!.registerCellElement('k1', cardEl);

        wrapper.unmount();
        await nextTick();

        // Após desmontagem, não deve lançar erro
        expect(() => layoutApi!.measureAll()).not.toThrow();

        cardEl.remove();
    });
});
