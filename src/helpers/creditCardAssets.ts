import { svgToDataUri } from './svgToDataUri';

export type CanonicalCardBrand =
    | 'amex'
    | 'diners'
    | 'discover'
    | 'elo'
    | 'hipercard'
    | 'jcb'
    | 'maestro'
    | 'mastercard'
    | 'visa';

export type CardBackgroundSide = 'front' | 'rear' | 'back';

type SvgModuleLoader = () => Promise<{ default: string }>;

const BRAND_ALIAS_MAP: Record<string, CanonicalCardBrand> = {
    // Nomes canônicos
    amex: 'amex',
    diners: 'diners',
    discover: 'discover',
    elo: 'elo',
    hipercard: 'hipercard',
    jcb: 'jcb',
    maestro: 'maestro',
    mastercard: 'mastercard',
    visa: 'visa',

    // Aliases de bandeira
    'american-express': 'amex',
    'diners-club': 'diners',
    discovery: 'discover',
    hiper: 'hipercard',

    // Aliases com prefixo 'card-'
    'card-amex': 'amex',
    'card-american-express': 'amex',
    'card-diners': 'diners',
    'card-diners-club': 'diners',
    'card-discover': 'discover',
    'card-discovery': 'discover',
    'card-elo': 'elo',
    'card-hiper': 'hipercard',
    'card-hipercard': 'hipercard',
    'card-jcb': 'jcb',
    'card-maestro': 'maestro',
    'card-mastercard': 'mastercard',
    'card-visa': 'visa'
};

const CANONICAL_ASSET_KEYS: Record<CanonicalCardBrand, string> = {
    amex: 'card-amex',
    diners: 'card-diners',
    discover: 'card-discovery',
    elo: 'card-elo',
    hipercard: 'card-hipercard',
    jcb: 'card-jcb',
    maestro: 'card-maestro',
    mastercard: 'card-mastercard',
    visa: 'card-visa'
};

/** Loaders dinâmicos explícitos com caminhos literais para permitir code-splitting em chunks. */
const BRAND_LOADERS: Record<CanonicalCardBrand, SvgModuleLoader> = {
    amex: () => import('../assets/credit-card/card-amex.svg?raw'),
    diners: () => import('../assets/credit-card/card-diners.svg?raw'),
    discover: () => import('../assets/credit-card/card-discovery.svg?raw'),
    elo: () => import('../assets/credit-card/card-elo.svg?raw'),
    hipercard: () => import('../assets/credit-card/card-hipercard.svg?raw'),
    jcb: () => import('../assets/credit-card/card-jcb.svg?raw'),
    maestro: () => import('../assets/credit-card/card-maestro.svg?raw'),
    mastercard: () => import('../assets/credit-card/card-mastercard.svg?raw'),
    visa: () => import('../assets/credit-card/card-visa.svg?raw')
};

const BACKGROUND_LOADERS: Record<'front' | 'rear', SvgModuleLoader> = {
    front: () => import('../assets/credit-card/credit-card.svg?raw'),
    rear: () => import('../assets/credit-card/credit-card-rear.svg?raw')
};

const brandUriCache = new Map<CanonicalCardBrand, Promise<string | null>>();
const backgroundUriCache = new Map<'front' | 'rear', Promise<string | null>>();

let customBrandLoaders: Partial<Record<CanonicalCardBrand, SvgModuleLoader>> = {};
let customBackgroundLoaders: Partial<Record<'front' | 'rear', SvgModuleLoader>> = {};

/**
 * Resolve qualquer alias de bandeira para a chave canônica correspondente.
 */
export function resolveCanonicalCardBrand(brand: string | null | undefined): CanonicalCardBrand | null {
    if (!brand || typeof brand !== 'string') return null;
    const normalized = brand.trim().toLowerCase();
    return BRAND_ALIAS_MAP[normalized] ?? null;
}

/** Alias para compatibilidade. */
export const resolveCanonicalCardType = resolveCanonicalCardBrand;

/**
 * Resolve qualquer alias para o nome canônico do arquivo/asset SVG (ex.: 'card-amex').
 */
export function resolveCanonicalAssetKey(brandOrAsset: string | null | undefined): string | null {
    const canonical = resolveCanonicalCardBrand(brandOrAsset);
    return canonical ? CANONICAL_ASSET_KEYS[canonical] : null;
}

/**
 * Carrega sob demanda a Data URI da bandeira solicitada (usando import dinâmico e cache de Promise).
 * Se a bandeira for desconhecida ou o carregamento falhar, resolve com `null` graciosamente.
 */
export function loadCardBrandUri(brand: string | null | undefined): Promise<string | null> {
    const canonical = resolveCanonicalCardBrand(brand);
    if (!canonical) return Promise.resolve(null);

    const cached = brandUriCache.get(canonical);
    if (cached) return cached;

    const loader = customBrandLoaders[canonical] ?? BRAND_LOADERS[canonical];
    if (!loader) return Promise.resolve(null);

    const promise = loader()
        .then((module) => {
            const rawSvg = module.default;
            return svgToDataUri(rawSvg) || null;
        })
        .catch(() => {
            brandUriCache.delete(canonical);
            return null;
        });

    brandUriCache.set(canonical, promise);
    return promise;
}

/**
 * Carrega sob demanda a Data URI do fundo do cartão ('front' ou 'rear'/'back').
 */
export function loadCardBackgroundUri(side: CardBackgroundSide = 'front'): Promise<string | null> {
    const canonicalSide: 'front' | 'rear' = (side === 'back' || side === 'rear') ? 'rear' : 'front';

    const cached = backgroundUriCache.get(canonicalSide);
    if (cached) return cached;

    const loader = customBackgroundLoaders[canonicalSide] ?? BACKGROUND_LOADERS[canonicalSide];
    const promise = loader()
        .then((module) => {
            const rawSvg = module.default;
            return svgToDataUri(rawSvg) || null;
        })
        .catch(() => {
            backgroundUriCache.delete(canonicalSide);
            return null;
        });

    backgroundUriCache.set(canonicalSide, promise);
    return promise;
}

/**
 * Verifica se a bandeira já está com promessa em cache.
 */
export function isCardBrandCached(brand: string | null | undefined): boolean {
    const canonical = resolveCanonicalCardBrand(brand);
    return canonical ? brandUriCache.has(canonical) : false;
}

/**
 * Verifica se o fundo já está com promessa em cache.
 */
export function isCardBackgroundCached(side: CardBackgroundSide = 'front'): boolean {
    const canonicalSide: 'front' | 'rear' = (side === 'back' || side === 'rear') ? 'rear' : 'front';
    return backgroundUriCache.has(canonicalSide);
}

/**
 * Limpa todo o cache de Data URIs e restaura loaders padrão (para testes unitários).
 */
export function clearCardAssetsCache(): void {
    brandUriCache.clear();
    backgroundUriCache.clear();
    customBrandLoaders = {};
    customBackgroundLoaders = {};
}

/**
 * Injeta loader de bandeira para testes.
 * @internal
 */
export function _setBrandLoaderForTest(brand: CanonicalCardBrand, loader: SvgModuleLoader | null): void {
    if (!loader) delete customBrandLoaders[brand];
    else customBrandLoaders[brand] = loader;
}

/**
 * Injeta loader de fundo para testes.
 * @internal
 */
export function _setBackgroundLoaderForTest(side: 'front' | 'rear', loader: SvgModuleLoader | null): void {
    if (!loader) delete customBackgroundLoaders[side];
    else customBackgroundLoaders[side] = loader;
}
