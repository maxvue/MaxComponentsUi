import {
    cloneVNode,
    Comment,
    Fragment,
    h,
    normalizeClass,
    Text,
    type FunctionalComponent,
    type VNode,
    type VNodeChild
} from 'vue';

/**
 * Expressão regular canônica para identificação de tokens de dimensionamento e quebra.
 * Padrão: s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end))?
 */
const S_TOKEN_REGEX = /^s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end))?$/;

/**
 * Expressão regular estrita para identificação de encerramento mobile (end-mobile e mobile-end).
 * Padrão: s-?(\d+)(?:-(full|max|\d+))?-(?:end-mobile|mobile-end)
 */
const S_MOBILE_END_REGEX = /^s-?(\d+)(?:-(full|max|\d+))?-(?:end-mobile|mobile-end)$/;

/**
 * Identifica se um nó VNode possui conteúdo visível (elementos, componentes ou texto não-vazio).
 * Comentários e strings vazias/espaços em branco não são considerados conteúdo visível.
 */
function isVisibleNode(node: VNode): boolean {
    if (node.type === Comment) return false;
    if (node.type === Text) return typeof node.children === 'string' && node.children.trim().length > 0;

    return true;
}

/**
 * Verifica se uma lista de nós contém pelo menos um elemento visível.
 */
function hasVisibleContent(nodes: VNode[]): boolean {
    return nodes.some(isVisibleNode);
}

/**
 * Expande recursivamente nós Fragment (incluindo template e v-for), compondo keys
 * para preservar a identidade dos nós filhos sem mutar os VNodes originais.
 */
function flattenFragments(nodes: VNode[], parentKeyPrefix = ''): VNode[] {
    const result: VNode[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node) continue;

        if (node.type === Fragment && Array.isArray(node.children)) {
            const fragmentKey = node.key != null ? String(node.key) : '';
            const nextPrefix = parentKeyPrefix
                ? (fragmentKey ? `${parentKeyPrefix}_${fragmentKey}` : `${parentKeyPrefix}_${i}`)
                : fragmentKey;

            const flattenedChildren = flattenFragments(node.children as VNode[], nextPrefix);
            result.push(...flattenedChildren);
        } else if (parentKeyPrefix) {
            const existingKey = node.key != null ? String(node.key) : `${i}`;
            result.push(cloneVNode(node, { key: `${parentKeyPrefix}:${existingKey}` }));
        } else result.push(node);

    }

    return result;
}

/**
 * Extrai marcadores de quebra explícita (`start` e/ou `end`) presentes em classes e atributos do nó.
 * O encerramento mobile (`end-mobile` ou `mobile-end`) só é ativado se isMobile for verdadeiro.
 */
function extractMarkers(node: VNode, isMobile = false): { hasStart: boolean; hasEnd: boolean } {
    let hasStart = false;
    let hasEnd = false;

    const props = node.props;
    if (!props) return { hasStart, hasEnd };


    // 1. Extração via classes (usando a normalização nativa do Vue)
    if (props.class) {
        const normalized = normalizeClass(props.class);
        if (normalized) {
            const classes = normalized.trim().split(/\s+/);
            for (const cls of classes) {
                const match = cls.match(S_TOKEN_REGEX);
                if (match && match[3]) {
                    if (match[3] === 'start') hasStart = true;
                    if (match[3] === 'end') hasEnd = true;
                }
                if (isMobile && S_MOBILE_END_REGEX.test(cls)) hasEnd = true;
            }
        }
    }

    // 2. Extração via atributos valueless ou booleanos
    for (const key of Object.keys(props)) {
        if (key === 'class' || key === 'style' || key === 'key' || key === 'ref') continue;
        if (key.startsWith('on')) continue;

        const val = props[key];
        const isActive = val === '' || val === true || val === 'true';
        if (!isActive) continue;

        const match = key.match(S_TOKEN_REGEX);
        if (match && match[3]) {
            if (match[3] === 'start') hasStart = true;
            if (match[3] === 'end') hasEnd = true;
        }

        if (isMobile && S_MOBILE_END_REGEX.test(key)) hasEnd = true;
    }

    return { hasStart, hasEnd };
}

/**
 * Processa os nós lógicos do slot do MaxGrid e organiza em segmentos de linha (`div.max-grid-row`)
 * somente quando houver marcadores de quebra explícita ativos.
 * Grids sem marcadores retornam os nós originais sem nenhuma div intermediária.
 */
export function renderGridSlotRows(nodes: VNode[] | undefined, context?: { isMobile?: boolean }): VNodeChild {
    if (!nodes || nodes.length === 0) return nodes;

    const isMobile = Boolean(context?.isMobile);
    const flatNodes = flattenFragments(nodes);

    let hasAnyMarker = false;
    for (const node of flatNodes) {
        const { hasStart, hasEnd } = extractMarkers(node, isMobile);
        if (hasStart || hasEnd) {
            hasAnyMarker = true;
            break;
        }
    }

    // Sem nenhum marcador ativo, preserva o comportamento original sem wrappers intermediários
    if (!hasAnyMarker) return nodes;


    const segments: VNode[][] = [];
    let currentSegment: VNode[] = [];

    for (const node of flatNodes) {
        const { hasStart, hasEnd } = extractMarkers(node, isMobile);

        if (hasStart && hasVisibleContent(currentSegment)) {
            segments.push(currentSegment);
            currentSegment = [];
        }


        currentSegment.push(node);

        if (hasEnd && hasVisibleContent(currentSegment)) {
            segments.push(currentSegment);
            currentSegment = [];
        }

    }

    if (currentSegment.length > 0) if (hasVisibleContent(currentSegment)) segments.push(currentSegment);
    else if (segments.length > 0) segments[segments.length - 1].push(...currentSegment);
    else segments.push(currentSegment);


    return segments.map((segment, index) => h('div', {
        class: 'max-grid-row',
        key: `max-grid-row-${index}`
    }, segment));
}

export interface GridSlotRowsProps {
    isMobile?: boolean;
}

/**
 * Componente funcional interno para organizar linhas do slot default do MaxGrid.
 */
export const GridSlotRows: FunctionalComponent<GridSlotRowsProps> = (props, { slots }) => {
    const rawNodes = slots.default ? slots.default() : [];
    return renderGridSlotRows(rawNodes, { isMobile: props.isMobile });
};

GridSlotRows.props = {
    isMobile: {
        type: Boolean,
        default: false
    }
};
GridSlotRows.inheritAttrs = false;
