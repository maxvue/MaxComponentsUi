export interface MaxUsageMeterProps {
    used: number | null;
    limit: number | null;
    unlimited?: boolean;
    label: string;
    unit?: string;
    warningThreshold?: number;
    actionLabel?: string;
}
