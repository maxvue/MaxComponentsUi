export interface MaxPreviewFileLocal {
    /** Identificador de origem de arquivo local */
    kind: 'local';
    /** Identificador único estável do arquivo */
    id: string;
    /** Objeto File nativo selecionado */
    file: File;
}

export interface MaxPreviewFileRemote {
    /** Identificador de origem de arquivo remoto */
    kind: 'remote';
    /** Identificador único estável do arquivo */
    id: string;
    /** Nome do arquivo com extensão */
    name: string;
    /** Tipo MIME do arquivo */
    mimeType?: string;
    /** Tamanho do arquivo em bytes */
    size?: number;
    /** URL de acesso ao recurso */
    url?: string;
    /** URL da imagem de miniatura */
    thumbnailUrl?: string;
}

export type MaxPreviewFile = MaxPreviewFileLocal | MaxPreviewFileRemote;

export interface MaxFilePreviewProps {
    /** Objeto de arquivo local ou remoto a ser visualizado */
    file: MaxPreviewFile;
    /** Habilita exibição visual de miniatura/ícone */
    preview?: boolean;
    /** Desabilita as ações do arquivo */
    disabled?: boolean;
}

export interface MaxFilePreviewErrorPayload {
    id: string;
    reason: 'invalid-url' | 'load-failed';
}
