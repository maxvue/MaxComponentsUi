import type { App } from 'vue';
import MaxComponentsUi from '../../src/index';

/**
 * Cenários Chromium criam aplicações Vue isoladas. Este bootstrap instala o
 * plugin público da biblioteca, inclusive `v-tooltip`, antes da montagem.
 */
export function installBrowserTestApp(app: App): App {
    app.use(MaxComponentsUi);
    return app;
}
