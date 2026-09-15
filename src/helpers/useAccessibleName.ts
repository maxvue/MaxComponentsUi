import { computed, type Ref, type Slots } from 'vue';

export function resolveAriaLabelledby(ids: string | undefined): string | undefined {
    if (!ids || typeof document === 'undefined') return undefined;
    const parts = ids.split(/\s+/).filter(Boolean);
    const validIds = parts.filter((id) => {
        const el = document.getElementById(id);
        if (!el) return false;

        if (el.hasAttribute('hidden')) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;

        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return false;
        if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;

        const text = el.textContent || '';
        return text.trim().length > 0;
    });
    return validIds.length > 0 ? validIds.join(' ') : undefined;
}

const getTextFromVNodes = (vnodes: any): string => {
    if (!vnodes) return '';
    if (typeof vnodes === 'string') return vnodes.trim();
    if (typeof vnodes === 'number') return String(vnodes);
    if (Array.isArray(vnodes)) return vnodes.map(getTextFromVNodes).join('').trim();
    if (typeof vnodes === 'object') {
        if (typeof vnodes.children === 'string') return vnodes.children.trim();
        if (Array.isArray(vnodes.children)) return getTextFromVNodes(vnodes.children);
        if (typeof vnodes.children === 'object' && vnodes.children !== null) if (typeof vnodes.children.default === 'function') return getTextFromVNodes(vnodes.children.default());

    }
    return '';
};

export const getSlotText = (slotFn?: (props: any) => any): string => {
    if (!slotFn) return '';
    try {
        return getTextFromVNodes(slotFn({}));
    } catch {
        return '';
    }
};
