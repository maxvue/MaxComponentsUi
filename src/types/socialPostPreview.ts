export interface MaxSocialPostMedia {
    id: string;
    src: string;
    alt: string;
}

export interface MaxSocialPostPreviewProps {
    author: string;
    caption?: string;
    media: readonly MaxSocialPostMedia[];
    activeMediaId?: string;
    emptyLabel?: string;
}
