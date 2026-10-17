import type { MaxPreviewFile } from './filePreview';

export interface MaxAttachmentListProps {
    files: readonly MaxPreviewFile[];
    disabled?: boolean;
    emptyLabel?: string;
}
