import type { StyleValue } from 'vue';

export interface MaxImageEditPayload {
    /** Data URL em base64 da imagem resultante (opcional quando includeDataUrl for false) */
    dataUrl?: string;
    /** Objeto Blob pronto para envio via FormData/API */
    blob: Blob;
    /** Objeto File gerado pronto para envio multipart/form-data */
    file: File;
    /** Largura da imagem recortada */
    width: number;
    /** Altura da imagem recortada */
    height: number;
    /** Tipo MIME (ex: 'image/png' ou 'image/jpeg') */
    mimeType: string;
}

export interface MaxImageProps {
    /** URL ou Data URI da imagem */
    src?: string;
    /** URL opcional em alta resolução para exibição no modal de visualização ampliada (se omitido, utiliza src) */
    previewSrc?: string;
    /** Texto alternativo da imagem */
    alt?: string;
    /** Largura da imagem inline */
    width?: string | number;
    /** Altura da imagem inline */
    height?: string | number;
    /** Ajuste da imagem no contêiner */
    fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    /** Se permite abrir visualização ampliada em tela cheia ao clicar */
    preview?: boolean;
    /** Se permite edição/recorte da imagem na barra de ferramentas */
    allowEdit?: boolean;
    /** Classes CSS adicionais para a tag img */
    imageClass?: string | string[] | Record<string, boolean>;
    /** Estilos inline para a tag img */
    imageStyle?: StyleValue;
    /** Largura máxima permitida para a imagem de recorte */
    maxCropWidth?: number;
    /** Altura máxima permitida para a imagem de recorte */
    maxCropHeight?: number;
    /** Total máximo de pixels permitidos para a imagem de recorte */
    maxCropPixels?: number;
    /** Qualidade de compressão da imagem de saída (0 a 1) */
    cropQuality?: number;
    /** Tipo MIME forçado para o recorte (ex: 'image/jpeg', 'image/png') */
    cropMimeType?: string;
    /** Se deve incluir dataUrl em base64 no payload */
    includeDataUrl?: boolean;
    /** Função assíncrona ou síncrona executada ao salvar a edição para envio ao backend */
    onEdit?: (payload: MaxImageEditPayload) => void | Promise<void>;
}
