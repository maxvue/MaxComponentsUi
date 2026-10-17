export interface MaxCopyButtonProps {
    text: string;
    label?: string;
    copiedLabel?: string;
    iconOnly?: boolean;
    disabled?: boolean;
    copiedDuration?: number;
}

export type MaxCopyButtonErrorReason = 'unsupported' | 'denied' | 'failed';
