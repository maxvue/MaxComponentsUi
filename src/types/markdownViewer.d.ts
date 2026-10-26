export interface MaxMarkdownViewerProps {
    /** Conteúdo em formato Markdown a ser renderizado */
    source?: string | null;
    /** Função obrigatória de renderização Markdown fornecida pelo consumidor */
    renderMarkdown: (source: string) => string;
}
export interface MaxMarkdownImageClickPayload {
    src: string;
    alt: string;
}
//# sourceMappingURL=markdownViewer.d.ts.map