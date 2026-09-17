import { inject, provide, type InjectionKey, type MaybeRefOrGetter, toValue } from 'vue';

export interface ModalContext {
    zIndex: MaybeRefOrGetter<string | number | undefined | null>;
    modalDepth?: MaybeRefOrGetter<number | undefined | null>;
}

export const MODAL_CONTEXT_KEY: InjectionKey<ModalContext> = Symbol('MaxModalContext');

export function provideModalContext(context: ModalContext): void {
    provide(MODAL_CONTEXT_KEY, context);
}

export function useModalContext(): ModalContext | null {
    return inject(MODAL_CONTEXT_KEY, null);
}

export function resolveModalZIndex(context: ModalContext | null): string | number | null {
    if (!context) return null;
    return toValue(context.zIndex) ?? null;
}
