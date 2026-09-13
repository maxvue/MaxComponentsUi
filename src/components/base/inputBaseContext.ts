import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue';

export interface InputAttrs {
    id: string;
    'aria-invalid'?: 'true' | undefined;
    'aria-required'?: 'true' | undefined;
    'aria-describedby'?: string | undefined;
}

export interface InputBaseContext {
    inputId: ComputedRef<string> | Ref<string>;
    messageId: ComputedRef<string> | Ref<string>;
    hasMessage: ComputedRef<boolean>;
    isError: ComputedRef<boolean>;
    isRequired: ComputedRef<boolean>;
    displayMessage: ComputedRef<string>;
    ariaDescribedby?: ComputedRef<string | undefined>;
    inputAttrs?: ComputedRef<InputAttrs>;
}

export const INPUT_BASE_CONTEXT_KEY: InjectionKey<InputBaseContext> = Symbol('MaxInputBaseContext');

export function provideInputBaseContext(context: InputBaseContext): void {
    provide(INPUT_BASE_CONTEXT_KEY, context);
}

export function useInputBaseContext(): InputBaseContext | null {
    return inject(INPUT_BASE_CONTEXT_KEY, null);
}
