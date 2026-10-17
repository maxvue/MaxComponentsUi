export interface MaxKanbanItem {
    id: string;
    title: string;
    description?: string;
    disabled?: boolean;
}

export interface MaxKanbanColumn {
    id: string;
    title: string;
    items: readonly MaxKanbanItem[];
    total?: number;
}

export interface MaxKanbanBoardProps {
    columns: readonly MaxKanbanColumn[];
    collapsedColumnIds?: readonly string[];
    label?: string;
}
