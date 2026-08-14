import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('prime/index.ts — depreciação', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('avisa uma única vez em desenvolvimento', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.stubEnv('DEV', true);

        await import('../../src/prime/index');

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/@maxvue\/max-components-ui\/prime/);
        expect(warn.mock.calls[0][0]).toMatch(/depreciad/i);

        vi.unstubAllEnvs();
    });

    it('mantém os re-exports funcionando', async () => {
        const mod = await import('../../src/prime/index');

        expect(mod.Dialog).toBeDefined();
        expect(mod.Card).toBeDefined();
        expect(mod.DataTable).toBeDefined();
    });
});
