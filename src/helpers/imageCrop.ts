/**
 * Utilitários para cálculo de dimensões e restrições de recorte de imagem.
 */

export interface CropDimensions {
    width: number;
    height: number;
}

/**
 * Calcula as dimensões finais de saída para recorte mantendo proporção original e sem upscale.
 */
export function calculateTargetCropDimensions(
    sourceWidth: number,
    sourceHeight: number,
    maxWidth = 4096,
    maxHeight = 4096,
    maxPixels = 16777216
): CropDimensions {
    if (sourceWidth <= 0 || sourceHeight <= 0) return { width: 0, height: 0 };

    let scale = 1;
    if (sourceWidth > maxWidth) scale = Math.min(scale, maxWidth / sourceWidth);
    if (sourceHeight > maxHeight) scale = Math.min(scale, maxHeight / sourceHeight);

    const scaledW = sourceWidth * scale;
    const scaledH = sourceHeight * scale;
    if (scaledW * scaledH > maxPixels) scale = Math.min(scale, Math.sqrt(maxPixels / (sourceWidth * sourceHeight)));

    scale = Math.min(scale, 1);
    return {
        width: Math.max(1, Math.round(sourceWidth * scale)),
        height: Math.max(1, Math.round(sourceHeight * scale))
    };
}
