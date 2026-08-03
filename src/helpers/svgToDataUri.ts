/**
 * Converte o conteúdo bruto de um SVG (string) em uma Data URI base64,
 * utilizável diretamente em atributos `href`/`src` (ex.: `<image :href="...">`).
 *
 * Usado para embutir SVGs importados via `?raw` no bundle da lib, sem depender
 * de resolução de caminho de arquivo em tempo de execução na aplicação consumidora.
 *
 * @param svg Conteúdo bruto do arquivo SVG.
 * @returns Data URI no formato `data:image/svg+xml;base64,...`.
 */
export function svgToDataUri(svg: string): string {
    const base64 = typeof window !== 'undefined' && typeof window.btoa === 'function' ? window.btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg, 'utf-8').toString('base64');

    return `data:image/svg+xml;base64,${base64}`;
}
