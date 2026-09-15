/**
 * Utilitários canônicos para resolução e cálculo de nomes acessíveis (Accessible Name Computation - W3C WAI-ARIA)
 * e validação rigorosa de múltiplos IDREFs em `aria-labelledby`.
 */

export interface DialogA11yViolation {
    id: string;
    message: string;
}

export interface DialogA11yResult {
    passes: boolean;
    violations: DialogA11yViolation[];
    accessibleName: string;
}

/**
 * Verifica se um elemento está visível e acessível na árvore de acessibilidade,
 * inspecionando atributos próprios e de ancestrais (`hidden`, `aria-hidden="true"`, `inert`),
 * além de estilos CSS computados (`display: none` e `visibility: hidden`).
 */
export function isElementAccessible(el: HTMLElement | null | undefined): boolean {
    if (!el) return false;

    const doc = el.ownerDocument;
    if (!doc || !doc.contains(el)) return false;

    // Checagem direta de atributos no próprio elemento
    if (el.hasAttribute('hidden') || (el as any).hidden === true) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.hasAttribute('inert') || (el as any).inert === true) return false;

    if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;

    const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
    if (win && typeof win.getComputedStyle === 'function') try {
        const cs = win.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    } catch {
        // Fallback seguro em ambientes headless/sem estilo computado
    }


    // Checagem hierárquica em toda a cadeia de ancestrais
    let parent = el.parentElement;
    while (parent && parent !== doc.documentElement) {
        if (parent.hasAttribute('hidden') || (parent as any).hidden === true) return false;
        if (parent.getAttribute('aria-hidden') === 'true') return false;
        if (parent.hasAttribute('inert') || (parent as any).inert === true) return false;
        if (parent.style.display === 'none') return false;

        if (win && typeof win.getComputedStyle === 'function') try {
            const parentCs = win.getComputedStyle(parent);
            if (parentCs.display === 'none') return false;
            if (parentCs.visibility === 'hidden') {
                // Se o elemento filho não declarar expressamente visibility: visible
                const elCs = win.getComputedStyle(el);
                if (elCs.visibility !== 'visible') return false;
            }
        } catch {
            // Fallback seguro
        }


        parent = parent.parentElement;
    }

    return true;
}

/**
 * Extrai o texto acessível fornecido por um elemento referenciado por IDREF.
 * Prioriza `aria-label` e faz fallback para o texto visível normalizado.
 */
export function getElementAccessibleText(el: HTMLElement): string {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim().length > 0) return ariaLabel.trim();

    const rawText = el.innerText || el.textContent || '';
    return rawText.replace(/\s+/g, ' ').trim();
}

/**
 * Valida rigorosamente múltiplos IDREFs passados em `aria-labelledby`.
 * Descarta referências inexistentes (órfãs), elementos ocultos (CSS computado ou ancestrais aria-hidden/inert)
 * e nós com texto vazio.
 *
 * @param ids Cadeia com um ou múltiplos IDs separados por whitespace
 * @param doc Documento no qual os IDs devem ser pesquisados (padrão: document global)
 * @returns String com os IDs válidos separados por espaço simples, ou `undefined` se nenhum for válido
 */
export function resolveAriaLabelledby(ids: string | undefined, doc?: Document): string | undefined {
    if (!ids || typeof ids !== 'string') return undefined;

    const documentRef = doc || (typeof document !== 'undefined' ? document : undefined);
    if (!documentRef) return undefined;

    const parts = ids.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return undefined;

    const validIds = parts.filter((id) => {
        const el = documentRef.getElementById(id);
        if (!el) return false;

        if (!isElementAccessible(el)) return false;

        const text = getElementAccessibleText(el);
        return text.length > 0;
    });

    return validIds.length > 0 ? validIds.join(' ') : undefined;
}

/**
 * Concatena o texto acessível resultante de múltiplos IDREFs válidos.
 */
export function computeAccessibleNameFromIdrefs(ids: string | undefined, doc?: Document): string {
    const resolvedIds = resolveAriaLabelledby(ids, doc);
    if (!resolvedIds) return '';

    const documentRef = doc || (typeof document !== 'undefined' ? document : undefined);
    if (!documentRef) return '';

    return resolvedIds
        .split(' ')
        .map((id) => {
            const el = documentRef.getElementById(id);
            return el ? getElementAccessibleText(el) : '';
        })
        .filter(Boolean)
        .join(' ')
        .trim();
}

/**
 * Calcula o nome acessível efetivo de um elemento conforme W3C Accessible Name Computation:
 * 1. Resolução e concatenação de múltiplos nós em `aria-labelledby`
 * 2. Fallback para `aria-label`
 * 3. Fallback para texto visível/conteúdo interno
 */
export function computeAccessibleName(el: Element, doc?: Document): string {
    const labelledby = el.getAttribute('aria-labelledby');
    if (labelledby) {
        const nameFromLabelledby = computeAccessibleNameFromIdrefs(labelledby, doc || el.ownerDocument);
        if (nameFromLabelledby.length > 0) return nameFromLabelledby;
    }

    const label = el.getAttribute('aria-label');
    if (label && label.trim().length > 0) return label.trim();

    const rawText = el.textContent || '';
    return rawText.replace(/\s+/g, ' ').trim();
}

/**
 * Extrai texto recursivamente de nós virtuais Vue (VNodes) de slots, tratando fragments,
 * arrays aninhados e ignorando comentários ou tags puramente vazias.
 */
const getTextFromVNodes = (vnodes: any): string => {
    if (!vnodes) return '';
    if (typeof vnodes === 'string') return vnodes.trim();
    if (typeof vnodes === 'number') return String(vnodes);
    if (Array.isArray(vnodes)) return vnodes.map(getTextFromVNodes).filter(Boolean).join(' ').trim();

    if (typeof vnodes === 'object') {
        // Ignora nós de comentários Vue
        if (typeof vnodes.type === 'symbol' && String(vnodes.type).includes('Comment')) return '';

        if (typeof vnodes.children === 'string') return vnodes.children.trim();
        if (Array.isArray(vnodes.children)) return getTextFromVNodes(vnodes.children);
        if (typeof vnodes.children === 'object' && vnodes.children !== null) {
            if (typeof vnodes.children.default === 'function') return getTextFromVNodes(vnodes.children.default());

            const slotValues = Object.values(vnodes.children)
                .filter((fn): fn is (props?: any) => any => typeof fn === 'function')
                .map((fn) => getTextFromVNodes(fn()));
            if (slotValues.length > 0) return slotValues.filter(Boolean).join(' ').trim();
        }
    }
    return '';
};

/**
 * Obtém o texto visível retornado por uma função de slot Vue.
 */
export const getSlotText = (slotFn?: ((props?: any) => any) | null): string => {
    if (!slotFn || typeof slotFn !== 'function') return '';
    try {
        const rendered = slotFn({});
        return getTextFromVNodes(rendered).replace(/\s+/g, ' ').trim();
    } catch {
        return '';
    }
};

/**
 * Validador de acessibilidade baseado nas regras do axe-core para elementos com papel `dialog` / `alertdialog`:
 * - `aria-dialog-name`: diálogo deve possuir nome acessível não vazio.
 * - `aria-valid-attr-value`: `aria-labelledby` deve referenciar exclusivamente IDs existentes e válidos.
 */
export function validateDialogA11y(dialogEl: Element): DialogA11yResult {
    const violations: DialogA11yViolation[] = [];
    const role = dialogEl.getAttribute('role');

    if (role !== 'dialog' && role !== 'alertdialog') violations.push({
        id: 'aria-role',
        message: `Elemento avaliado possui role "${role}", esperado "dialog" ou "alertdialog".`
    });


    const rawLabelledby = dialogEl.getAttribute('aria-labelledby');
    if (rawLabelledby !== null) {
        const ids = rawLabelledby.trim().split(/\s+/).filter(Boolean);
        if (ids.length === 0) violations.push({
            id: 'aria-valid-attr-value',
            message: 'Atributo aria-labelledby está vazio ou contém apenas espaços em branco.'
        });
        else {
            const doc = dialogEl.ownerDocument;
            for (const id of ids) {
                const target = doc.getElementById(id);
                if (!target) violations.push({
                    id: 'aria-valid-attr-value',
                    message: `Atributo aria-labelledby referencia ID inexistente ou órfão: "${id}".`
                });
                else if (!isElementAccessible(target)) violations.push({
                    id: 'aria-valid-attr-value',
                    message: `Elemento referenciado por ID "${id}" está oculto ou inerte.`
                });

            }
        }
    }

    const accessibleName = computeAccessibleName(dialogEl);
    if (!accessibleName || accessibleName.length === 0) violations.push({
        id: 'aria-dialog-name',
        message: 'O diálogo não possui nome acessível (aria-labelledby ou aria-label válidos).'
    });


    return {
        passes: violations.length === 0,
        violations,
        accessibleName
    };
}
