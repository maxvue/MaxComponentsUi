export interface MaxChatMessageProps {
    id: string;
    direction?: 'incoming' | 'outgoing';
    author: string;
    text?: string;
    timestamp?: string;
    timeLabel?: string;
    status?: 'pending' | 'sent' | 'error';
    renderMarkdown?: (text: string) => string;
}
