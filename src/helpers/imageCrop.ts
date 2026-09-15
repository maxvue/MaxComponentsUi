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
    if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight)) return { width: 0, height: 0 };

    let scale = 1;
    if (maxWidth > 0 && sourceWidth > maxWidth) scale = Math.min(scale, maxWidth / sourceWidth);
    if (maxHeight > 0 && sourceHeight > maxHeight) scale = Math.min(scale, maxHeight / sourceHeight);

    const scaledW = sourceWidth * scale;
    const scaledH = sourceHeight * scale;
    if (maxPixels > 0 && scaledW * scaledH > maxPixels) scale = Math.min(scale, Math.sqrt(maxPixels / (sourceWidth * sourceHeight)));

    scale = Math.min(scale, 1);
    let width = Math.max(1, Math.round(sourceWidth * scale));
    let height = Math.max(1, Math.round(sourceHeight * scale));

    if (maxPixels > 0 && width * height > maxPixels) while (width * height > maxPixels && (width > 1 || height > 1)) if (width >= height && width > 1) width -= 1;
    else if (height > 1) height -= 1;


    if (maxWidth > 0 && width > maxWidth) width = maxWidth;
    if (maxHeight > 0 && height > maxHeight) height = maxHeight;

    return {
        width,
        height
    };
}
