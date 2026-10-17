export interface MaxDescriptionItem {
    id: string;
    label: string;
    value?: string | number | boolean | null;
}

export interface MaxDescriptionListProps {
    items: readonly MaxDescriptionItem[];
    columns?: 1 | 2 | 3;
    emptyValue?: string;
}
