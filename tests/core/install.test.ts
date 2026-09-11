import { describe, it, expect } from 'vitest';
import { createApp, defineComponent, inject } from 'vue';
import MaxComponentsUi, { install, MaxStyle } from '../../src/index';

describe('Plugin MaxComponentsUi (Core Install)', () => {
    it('deve instalar o plugin na aplicação Vue sem invocar PrimeVue', () => {
        const app = createApp(defineComponent({ template: '<div>App</div>' }));
        app.use(MaxComponentsUi);

        // Verifica registro da diretiva nativa tooltip
        expect(app.directive('tooltip')).toBeDefined();
    });

    it('deve disponibilizar as opções fornecidas via injeção', () => {
        let injectedOptions: unknown = null;
        const TestComponent = defineComponent({
            setup() {
                injectedOptions = inject('maxComponentsOptions');
                return () => null;
            }
        });

        const app = createApp(TestComponent);
        app.use(install, { ripple: false, customSetting: 'teste' });

        const mountPoint = document.createElement('div');
        app.mount(mountPoint);

        expect(injectedOptions).toEqual({ ripple: false, customSetting: 'teste' });
        app.unmount();
    });

    it('deve exportar MaxStyle como objeto de tokens semânticos sem dependência externa', () => {
        expect(MaxStyle).toBeDefined();
        expect(MaxStyle.semantic.primary[500]).toBe('#00768E');
        expect(MaxStyle.semantic.danger[500]).toBe('#EF4444');
    });
});
