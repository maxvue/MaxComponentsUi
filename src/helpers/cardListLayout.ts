export interface CardListCell {
    key: string | number;
    type: 'item' | 'add';
    item?: any;
    originalIndex?: number;
    preferredWidth?: number;
    appliedWidth: number;
    isGroup?: boolean;
}

export interface CardListRow {
    key: string;
    index: number;
    cells: CardListCell[];
}

export interface CardListLayoutInput {
    items: any[];
    hasAddCard: boolean;
    addCardPosition?: 'top' | 'bottom' | 'header' | 'inline' | string;
    availableWidth: number;
    columns: number;
    gap: number;
    minCardWidth?: number;
    getItemKey: (item: any, fallbackIndex: number) => string | number;
    getPreferredWidth?: (key: string | number) => number | undefined;
    getIsGroup?: (key: string | number) => boolean;
}

export interface CardListLayoutResult {
    rows: CardListRow[];
    originalIndexToRow: Map<number, number>;
    baseCardWidth: number;
    totalRows: number;
}

/**
 * Calcula a largura base dos cards comuns e o empacotamento sequencial linear
 * das linhas de cards e grupos no MaxCardList.
 */
export function calculateCardListLayout(input: CardListLayoutInput): CardListLayoutResult {
    const rawItems = input.items ?? [];
    const cols = Math.max(1, Math.floor(input.columns || 1));
    const gap = Math.max(0, input.gap ?? 16);
    const minCardWidth = input.minCardWidth && input.minCardWidth > 0 ? input.minCardWidth : 320;

    let availableWidth = Math.max(0, input.availableWidth);
    if (availableWidth === 0) availableWidth = cols * minCardWidth + (cols - 1) * gap;


    const isMobile = availableWidth > 0 && availableWidth <= 768;

    let baseCardWidth = 0;
    if (isMobile || cols === 1) baseCardWidth = availableWidth;
    else baseCardWidth = Math.max(0, (availableWidth - (cols - 1) * gap) / cols);


    const cells: CardListCell[] = [];

    const addCell: CardListCell = {
        key: '__add_slot__',
        type: 'add',
        appliedWidth: baseCardWidth
    };

    const shouldIncludeAdd = Boolean(input.hasAddCard && input.addCardPosition !== 'header');

    if (shouldIncludeAdd && input.addCardPosition !== 'bottom') cells.push(addCell);


    for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        const cellKey = input.getItemKey(item, i);
        const isGroup = Boolean(input.getIsGroup?.(cellKey));
        const preferredWidth = input.getPreferredWidth?.(cellKey);

        let appliedWidth = baseCardWidth;
        if (isMobile || cols === 1) appliedWidth = availableWidth > 0 ? availableWidth : baseCardWidth;
        else if (isGroup) {
            const desired = preferredWidth !== undefined && preferredWidth > 0
                ? preferredWidth
                : baseCardWidth;
            appliedWidth = availableWidth > 0 ? Math.min(desired, availableWidth) : desired;
        }

        cells.push({
            key: cellKey,
            type: 'item',
            item,
            originalIndex: i,
            preferredWidth,
            appliedWidth,
            isGroup
        });
    }

    if (shouldIncludeAdd && input.addCardPosition === 'bottom') cells.push(addCell);


    const rows: CardListRow[] = [];
    const originalIndexToRow = new Map<number, number>();

    if (cells.length === 0) return {
        rows,
        originalIndexToRow,
        baseCardWidth,
        totalRows: 0
    };


    if (isMobile || cols === 1) {
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const row: CardListRow = {
                key: `row-${i}-${String(cell.key)}`,
                index: i,
                cells: [cell]
            };
            rows.push(row);
            if (cell.type === 'item' && cell.originalIndex !== undefined) originalIndexToRow.set(cell.originalIndex, i);

        }
        return {
            rows,
            originalIndexToRow,
            baseCardWidth,
            totalRows: rows.length
        };
    }

    let currentRowCells: CardListCell[] = [];
    let remainingWidth = availableWidth > 0 ? availableWidth : 0;

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        if (currentRowCells.length === 0) {
            currentRowCells.push(cell);
            remainingWidth = Math.max(0, availableWidth - cell.appliedWidth);
        } else {
            const spaceNeeded = gap + cell.appliedWidth;
            // Tolerância de 0.5px para subpixel rounding em browsers
            if (availableWidth > 0 && remainingWidth - spaceNeeded >= -0.5) {
                currentRowCells.push(cell);
                remainingWidth = Math.max(0, remainingWidth - spaceNeeded);
            } else {
                const rowIndex = rows.length;
                const rowKey = `row-${rowIndex}-${currentRowCells.map((c) => String(c.key)).join('_')}`;
                rows.push({
                    key: rowKey,
                    index: rowIndex,
                    cells: currentRowCells
                });
                currentRowCells = [cell];
                remainingWidth = Math.max(0, availableWidth - cell.appliedWidth);
            }
        }
    }

    if (currentRowCells.length > 0) {
        const rowIndex = rows.length;
        const rowKey = `row-${rowIndex}-${currentRowCells.map((c) => String(c.key)).join('_')}`;
        rows.push({
            key: rowKey,
            index: rowIndex,
            cells: currentRowCells
        });
    }

    for (const row of rows) for (const cell of row.cells) if (cell.type === 'item' && cell.originalIndex !== undefined) originalIndexToRow.set(cell.originalIndex, row.index);


    return {
        rows,
        originalIndexToRow,
        baseCardWidth,
        totalRows: rows.length
    };
}
