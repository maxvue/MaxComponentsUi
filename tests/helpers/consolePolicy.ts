import { expect, vi, beforeEach, afterEach } from 'vitest';

export interface SpyTracker {
    method: 'warn' | 'error';
    spy: any;
    assertedCount: number;
    negated?: boolean;
}

export type AllowPattern = string | RegExp | ((msg: string) => boolean);

let activeSpyTrackers: SpyTracker[] = [];
let unhandledWarnings: string[] = [];
let unhandledErrors: string[] = [];
let unhandledAsyncErrors: string[] = [];
let testAllowlist: Array<{ method: 'warn' | 'error'; pattern: AllowPattern }> = [];

let policyConsoleWarn: (...args: any[]) => void = (...args: any[]) => {
    const msg = formatArgs(...args);
    unhandledWarnings.push(msg);
};
let policyConsoleError: (...args: any[]) => void = (...args: any[]) => {
    const msg = formatArgs(...args);
    unhandledErrors.push(msg);
};

export function allowConsoleWarn(pattern: AllowPattern) {
    testAllowlist.push({ method: 'warn', pattern });
}

export function allowConsoleError(pattern: AllowPattern) {
    testAllowlist.push({ method: 'error', pattern });
}

(globalThis as any).allowConsoleWarn = allowConsoleWarn;
(globalThis as any).allowConsoleError = allowConsoleError;

export function matchesAllowlist(method: 'warn' | 'error', msg: string): boolean {
    return testAllowlist.some((item) => {
        if (item.method !== method) return false;
        if (typeof item.pattern === 'string') return msg.includes(item.pattern);
        if (item.pattern instanceof RegExp) return item.pattern.test(msg);
        if (typeof item.pattern === 'function') return item.pattern(msg);
        return false;
    });
}

export function formatArgs(...args: any[]): string {
    return args.map((a) => {
        if (typeof a === 'object' && a !== null) try {
            return JSON.stringify(a);
        } catch {
            return String(a);
        }

        return String(a);
    }).join(' ');
}

export function verifyConsoleClean() {
    const asyncErrors = [...unhandledAsyncErrors];
    unhandledAsyncErrors = [];

    const directWarnings = unhandledWarnings.filter((msg) => !matchesAllowlist('warn', msg));
    const directErrors = unhandledErrors.filter((msg) => !matchesAllowlist('error', msg));
    unhandledWarnings = [];
    unhandledErrors = [];

    const unassertedSpyWarnings: string[] = [];
    const unassertedSpyErrors: string[] = [];

    // Captura também se console.warn / console.error for atualmente uma mock function não registrada
    if (vi.isMockFunction(console.warn) && !activeSpyTrackers.some((t) => t.spy === console.warn)) activeSpyTrackers.push({ method: 'warn', spy: console.warn, assertedCount: 0 });

    if (vi.isMockFunction(console.error) && !activeSpyTrackers.some((t) => t.spy === console.error)) activeSpyTrackers.push({ method: 'error', spy: console.error, assertedCount: 0 });


    for (const tracker of activeSpyTrackers) {
        const calls = tracker.spy.mock?.calls || [];
        const asserted = tracker.assertedCount;
        for (let i = asserted; i < calls.length; i++) {
            const msg = formatArgs(...calls[i]);
            if (!matchesAllowlist(tracker.method, msg)) if (tracker.method === 'warn') unassertedSpyWarnings.push(msg);
            else unassertedSpyErrors.push(msg);

        }
    }

    for (const tracker of activeSpyTrackers) try {
        tracker.spy.mockRestore?.();
    } catch {
        // no-op
    }

    activeSpyTrackers = [];
    testAllowlist = [];

    console.warn = policyConsoleWarn;
    console.error = policyConsoleError;

    if (asyncErrors.length > 0) throw new Error(`[tests/setup] Teste disparou erro/rejeição assíncrona não tratada no teardown:\n${asyncErrors.join('\n')}`);


    if (directWarnings.length > 0) throw new Error(`[tests/setup] Teste emitiu console.warn inesperado:\n${directWarnings.join('\n')}`);


    if (unassertedSpyWarnings.length > 0) throw new Error(`[tests/setup] Teste interceptou console.warn via spy mas não consumiu/assertou todas as chamadas (${unassertedSpyWarnings.length} chamada(s) inesperada(s)):\n${unassertedSpyWarnings.join('\n')}`);


    if (directErrors.length > 0) throw new Error(`[tests/setup] Teste emitiu console.error inesperado:\n${directErrors.join('\n')}`);


    if (unassertedSpyErrors.length > 0) throw new Error(`[tests/setup] Teste interceptou console.error via spy mas não consumiu/assertou todas as chamadas (${unassertedSpyErrors.length} chamada(s) inesperada(s)):\n${unassertedSpyErrors.join('\n')}`);

}

export function initConsolePolicy() {
    // Rastreamento de spies instalados via vi.spyOn
    const originalSpyOn = vi.spyOn;
    vi.spyOn = function (this: unknown, obj: any, method: any, ...rest: any[]) {
        const spy = (originalSpyOn as any).call(this, obj, method, ...rest);
        if (obj === console && (method === 'warn' || method === 'error')) {
            let tracker = activeSpyTrackers.find((t) => t.spy === spy);
            if (!tracker) {
                tracker = { method, spy, assertedCount: 0, negated: false };
                activeSpyTrackers.push(tracker);

                let rawCalls = spy.mock.calls || [];
                const wrapCalls = (arr: any[]) => {
                    return new Proxy(arr, {
                        get(target, prop, receiver) {
                            if (typeof prop === 'string' && prop !== 'constructor' && prop !== 'prototype') {
                                const stack = new Error().stack || '';
                                if (
                                    !stack.includes('registerCalls') &&
                                    !stack.includes('@vitest/spy') &&
                                    !stack.includes('verifyConsoleClean')
                                ) {
                                    const isNegated = !!tracker!.negated;
                                    if (prop === 'some') {
                                        tracker!.negated = false;
                                        if (!isNegated && stack.includes('@vitest/expect')) tracker!.assertedCount = Math.min(target.length, tracker!.assertedCount + 1);
                                    } else if (prop === 'length') {
                                        if (stack.includes('Proxy.some') || stack.includes('.some (')) {
                                            // Iteração interna do Array.prototype.some no toHaveBeenCalledWith: ignora
                                        } else if (stack.includes('@vitest/expect')) {
                                            tracker!.negated = false;
                                            if (!isNegated) tracker!.assertedCount = target.length;
                                        } else if (!stack.includes('chai')) tracker!.assertedCount = target.length;

                                    } else if (!stack.includes('@vitest/expect') && !stack.includes('chai')) tracker!.assertedCount = target.length;


                                }
                            }
                            return Reflect.get(target, prop, receiver);
                        }
                    });
                };

                try {
                    Object.defineProperty(spy.mock, 'calls', {
                        get() { return wrapCalls(rawCalls); },
                        set(v) { rawCalls = v; },
                        configurable: true,
                        enumerable: true
                    });

                    const origLastCallDesc = Object.getOwnPropertyDescriptor(spy.mock, 'lastCall');
                    if (origLastCallDesc?.get) Object.defineProperty(spy.mock, 'lastCall', {
                        get() {
                            const stack = new Error().stack || '';
                            if (!stack.includes('verifyConsoleClean')) if (tracker!.negated) tracker!.negated = false;
                            else tracker!.assertedCount = Math.min(rawCalls.length, tracker!.assertedCount + 1);


                            return origLastCallDesc.get!.call(this);
                        },
                        configurable: true,
                        enumerable: true
                    });

                } catch {
                    // no-op se não puder redefinir
                }
            }
        }
        return spy;
    } as any;

    // Interceptação da propriedade 'not' e matchers do Chai/Vitest
    try {
        const dummyFn = vi.fn();
        const assertionProto = Object.getPrototypeOf(expect(dummyFn));

        const origNotDesc = Object.getOwnPropertyDescriptor(assertionProto, 'not');
        if (origNotDesc?.get) Object.defineProperty(assertionProto, 'not', {
            get() {
                const actual = this._obj;
                const tracker = activeSpyTrackers.find((t) => t.spy === actual);
                if (tracker) tracker.negated = true;

                return origNotDesc.get!.call(this);
            },
            configurable: true
        });

    } catch {
        // no-op se prototype não puder ser interceptado
    }

    console.warn = (...args: any[]) => {
        const msg = formatArgs(...args);
        unhandledWarnings.push(msg);
    };

    console.error = (...args: any[]) => {
        const msg = formatArgs(...args);
        unhandledErrors.push(msg);
    };

    // Monitoramento de rejeições assíncronas não tratadas
    if (typeof process !== 'undefined') {
        process.on('unhandledRejection', (reason: any) => {
            const msg = reason?.stack || reason?.message || String(reason);
            if (!matchesAllowlist('error', msg)) unhandledAsyncErrors.push(`[unhandledRejection] ${msg}`);

        });
        process.on('uncaughtException', (err: any) => {
            const msg = err?.stack || err?.message || String(err);
            if (!matchesAllowlist('error', msg)) unhandledAsyncErrors.push(`[uncaughtException] ${msg}`);

        });
    }

    if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', (event: any) => {
            const msg = event?.reason?.stack || event?.reason?.message || String(event?.reason);
            if (!matchesAllowlist('error', msg)) unhandledAsyncErrors.push(`[window.unhandledrejection] ${msg}`);

        });
        window.addEventListener('error', (event: any) => {
            const msg = event?.error?.stack || event?.message || String(event?.error);
            if (!matchesAllowlist('error', msg)) unhandledAsyncErrors.push(`[window.error] ${msg}`);

        });
    }

    beforeEach(() => {
        unhandledWarnings = [];
        unhandledErrors = [];
        unhandledAsyncErrors = [];
        activeSpyTrackers = [];
        testAllowlist = [];
    });

    afterEach(() => {
        verifyConsoleClean();
    });
}
