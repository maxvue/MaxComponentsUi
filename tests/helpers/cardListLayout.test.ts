import { describe, it, expect } from 'vitest';
import { calculateCardListLayout, type CardListLayoutInput } from '../../src/helpers/cardListLayout';

describe('cardListLayout - Cálculo puro de empacotamento linear', () => {
    const defaultGetItemKey = (item: any, idx: number) => item?.id ?? idx;

    it('retorna linhas vazias quando não há itens nem add card', () => {
        const input: CardListLayoutInput = {
            items: [],
            hasAddCard: false,
            availableWidth: 1200,
            columns: 3,
            gap: 16,
            getItemKey: defaultGetItemKey
        };

        const result = calculateCardListLayout(input);
        expect(result.rows).toEqual([]);
        expect(result.totalRows).toBe(0);
        expect(result.originalIndexToRow.size).toBe(0);
        expect(result.baseCardWidth).toBeCloseTo((1200 - 2 * 16) / 3, 2);
    });

    it('empacota cards comuns perfeitamente em colunas fixas no desktop', () => {
        // 3 colunas em 960px com gap 20px: baseCardWidth = (960 - 2*20) / 3 = 920 / 3 = 306.666...
        const items = Array.from({ length: 7 }, (_, i) => ({ id: `card-${i + 1}`, title: `Card ${i + 1}` }));
        const input: CardListLayoutInput = {
            items,
            hasAddCard: false,
            availableWidth: 960,
            columns: 3,
            gap: 20,
            getItemKey: defaultGetItemKey
        };

        const result = calculateCardListLayout(input);
        // 7 itens em 3 colunas = 3 linhas (3 + 3 + 1)
        expect(result.totalRows).toBe(3);
        expect(result.rows[0].cells.length).toBe(3);
        expect(result.rows[1].cells.length).toBe(3);
        expect(result.rows[2].cells.length).toBe(1);

        // Verifica mapa de índices originais
        for (let i = 0; i < 7; i++) {
            const expectedRow = Math.floor(i / 3);
            expect(result.originalIndexToRow.get(i)).toBe(expectedRow);
        }
    });

    it('acompanha a largura necessária de grupo de subcards sem esticar desnecessariamente', () => {
        const items = [
            { id: 'group-1', title: 'Grupo 1' },
            { id: 'card-1', title: 'Card Comum' },
            { id: 'card-2', title: 'Card Comum 2' }
        ];

        // Área 1200px, 3 colunas, gap 16px -> baseCardWidth = (1200 - 32) / 3 = 389.33px
        // Grupo com largura calculada de 450px
        const input: CardListLayoutInput = {
            items,
            hasAddCard: false,
            availableWidth: 1200,
            columns: 3,
            gap: 16,
            getItemKey: defaultGetItemKey,
            getIsGroup: (key) => key === 'group-1',
            getPreferredWidth: (key) => (key === 'group-1' ? 450 : undefined)
        };

        const result = calculateCardListLayout(input);
        const groupCell = result.rows[0].cells[0];
        expect(groupCell.appliedWidth).toBe(450);
        expect(groupCell.isGroup).toBe(true);

        // Espaço restante na linha 0: 1200 - 450 = 750px.
        // Próximo card: gap (16) + 389.33 = 405.33px <= 750px -> cabe na linha 0!
        expect(result.rows[0].cells.length).toBeGreaterThanOrEqual(2);
    });

    it('quebra para uma nova linha quando o grupo ou próximo card não cabe no espaço restante', () => {
        const items = [
            { id: 'group-wide', title: 'Grupo Largo' },
            { id: 'card-1', title: 'Card 1' }
        ];

        // Área 1000px, 2 colunas, gap 20px -> baseCardWidth = (1000 - 20) / 2 = 490px
        // Grupo largo com 700px. Espaço restante = 300px.
        // Card 1 precisa de 20 + 490 = 510px > 300px -> não cabe na linha 0, vai para a linha 1!
        const input: CardListLayoutInput = {
            items,
            hasAddCard: false,
            availableWidth: 1000,
            columns: 2,
            gap: 20,
            getItemKey: defaultGetItemKey,
            getIsGroup: (key) => key === 'group-wide',
            getPreferredWidth: (key) => (key === 'group-wide' ? 700 : undefined)
        };

        const result = calculateCardListLayout(input);
        expect(result.totalRows).toBe(2);
        expect(result.rows[0].cells.length).toBe(1);
        expect(result.rows[0].cells[0].key).toBe('group-wide');
        expect(result.rows[1].cells.length).toBe(1);
        expect(result.rows[1].cells[0].key).toBe('card-1');
        expect(result.originalIndexToRow.get(0)).toBe(0);
        expect(result.originalIndexToRow.get(1)).toBe(1);
    });

    it('limita a largura do grupo ao teto da lista (availableWidth) quando a soma dos subcards for maior', () => {
        const items = [{ id: 'giant-group', title: 'Grupo Gigante' }];

        // Área 1100px. Grupo deseja 1800px. Deve ser limitado a 1100px.
        const input: CardListLayoutInput = {
            items,
            hasAddCard: false,
            availableWidth: 1100,
            columns: 3,
            gap: 16,
            getItemKey: defaultGetItemKey,
            getIsGroup: (key) => key === 'giant-group',
            getPreferredWidth: (key) => (key === 'giant-group' ? 1800 : undefined)
        };

        const result = calculateCardListLayout(input);
        expect(result.totalRows).toBe(1);
        expect(result.rows[0].cells[0].appliedWidth).toBe(1100);
    });

    it('força 1 card por linha em ambiente mobile (largura <= 768px)', () => {
        const items = [
            { id: 1, title: 'Item 1' },
            { id: 2, title: 'Item 2' },
            { id: 3, title: 'Item 3' }
        ];

        const input: CardListLayoutInput = {
            items,
            hasAddCard: false,
            availableWidth: 600,
            columns: 3,
            gap: 16,
            getItemKey: defaultGetItemKey
        };

        const result = calculateCardListLayout(input);
        expect(result.totalRows).toBe(3);
        expect(result.rows[0].cells[0].appliedWidth).toBe(600);
        expect(result.rows[1].cells[0].appliedWidth).toBe(600);
        expect(result.rows[2].cells[0].appliedWidth).toBe(600);
    });

    it('posiciona o add-card no topo ou no fundo sem desalinhar os índices dos itens de dados', () => {
        const items = [
            { id: 'a', title: 'Item A' },
            { id: 'b', title: 'Item B' }
        ];

        // Com addCardPosition: 'top'
        const topResult = calculateCardListLayout({
            items,
            hasAddCard: true,
            addCardPosition: 'top',
            availableWidth: 1000,
            columns: 3,
            gap: 16,
            getItemKey: defaultGetItemKey
        });

        expect(topResult.rows[0].cells[0].type).toBe('add');
        expect(topResult.rows[0].cells[1].type).toBe('item');
        expect(topResult.rows[0].cells[1].originalIndex).toBe(0);
        expect(topResult.rows[0].cells[2].originalIndex).toBe(1);
        expect(topResult.originalIndexToRow.get(0)).toBe(0);
        expect(topResult.originalIndexToRow.get(1)).toBe(0);

        // Com addCardPosition: 'bottom'
        const bottomResult = calculateCardListLayout({
            items,
            hasAddCard: true,
            addCardPosition: 'bottom',
            availableWidth: 1000,
            columns: 3,
            gap: 16,
            getItemKey: defaultGetItemKey
        });

        expect(bottomResult.rows[0].cells[0].type).toBe('item');
        expect(bottomResult.rows[0].cells[0].originalIndex).toBe(0);
        expect(bottomResult.rows[0].cells[1].originalIndex).toBe(1);
        expect(bottomResult.rows[0].cells[2].type).toBe('add');
    });

    it('tolera pequenas discrepâncias fracionárias de subpixel sem quebrar a linha prematuramente', () => {
        // Se 3 colunas de 333.33px em 1000px com 2 gaps de 0px: 333.33 * 3 = 999.99px.
        const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const input: CardListLayoutInput = {
            items,
            hasAddCard: false,
            availableWidth: 1000,
            columns: 3,
            gap: 0,
            getItemKey: defaultGetItemKey
        };

        const result = calculateCardListLayout(input);
        expect(result.totalRows).toBe(1);
        expect(result.rows[0].cells.length).toBe(3);
    });
});
