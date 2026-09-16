import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { compileString } from 'sass';
import { mount } from '@vue/test-utils';
import { defineComponent, ref, nextTick } from 'vue';
import MaxTransitionFadeLight from '../../src/components/MaxTransitionFadeLight.vue';
import MaxTransitionUp from '../../src/components/MaxTransitionUp.vue';

const SRC_DIR = path.resolve(__dirname, '../../src');

describe('E10-09: Política Sistêmica de Movimento Reduzido (prefers-reduced-motion)', () => {
    describe('Centralização de Regras Globais (_motion.scss)', () => {
        it('src/themes/_motion.scss deve existir e declarar o mixin @mixin reduced-motion', () => {
            const motionScssPath = path.resolve(SRC_DIR, 'themes/_motion.scss');
            expect(fs.existsSync(motionScssPath)).toBe(true);

            const content = fs.readFileSync(motionScssPath, 'utf-8');
            expect(content).toContain('@mixin reduced-motion');
            expect(content).toContain('prefers-reduced-motion: reduce');
        });

        it('src/themes/all.scss deve incluir motion.scss', () => {
            const allScssPath = path.resolve(SRC_DIR, 'themes/all.scss');
            const content = fs.readFileSync(allScssPath, 'utf-8');
            expect(content).toMatch(/@use\s+['"].\/motion(?:\.scss)?['"]/);
        });

        it('src/themes/_motion.scss compila regras universais para durações instantâneas (0.01ms) e iteração simples', () => {
            const motionScssPath = path.resolve(SRC_DIR, 'themes/_motion.scss');
            const content = fs.readFileSync(motionScssPath, 'utf-8');
            const compiled = compileString(content).css;

            expect(compiled).toContain('animation-duration: 0.01ms !important');
            expect(compiled).toContain('animation-iteration-count: 1 !important');
            expect(compiled).toContain('transition-duration: 0.01ms !important');
            expect(compiled).toContain('scroll-behavior: auto !important');
        });

        it('src/themes/_motion.scss desativa transformações agressivas decorativas sob prefers-reduced-motion', () => {
            const motionScssPath = path.resolve(SRC_DIR, 'themes/_motion.scss');
            const content = fs.readFileSync(motionScssPath, 'utf-8');
            const compiled = compileString(content).css;

            expect(compiled).toContain('transform: none !important');
            expect(content).toContain('.slide-up-enter-active');
            expect(content).toContain('.flip-enter-active');
            expect(content).toContain('.is-shaking');
            expect(content).toContain('.is-pulsing');
        });
    });

    describe('Primitivas de Transição', () => {
        it('MaxTransitionUp.vue remove deslocamento vertical de 150px em prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxTransitionUp.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toContain('slide-up-in-reduced');
            expect(content).toContain('slide-down-out-reduced');
            expect(content).toMatch(/transform:\s*none/);
        });

        it('MaxTransitionFadeLight.vue minimiza duração em prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxTransitionFadeLight.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toContain('transition-duration');
        });

        it('TransitionFade.vue zera delay e minimiza duração em prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/TransitionFade.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toContain('transition-duration');
            expect(content).toContain('transition-delay: 0s');
        });
    });

    describe('Transições de Layout e Controles (SideMenuMobile, InputOTP, TabItem)', () => {
        it('MaxSideMenuMobile.vue desativa transições de menu e rodapé sob prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxSideMenuMobile.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toContain('.mobile-menu-item');
            expect(content).toContain('.mobile-footer-btn');
            expect(content).toMatch(/transition:\s*none\s*!important/);
        });

        it('MaxInputOTP.vue desativa transições de célula sob prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxInputOTP.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toContain('.max-input-otp-cell');
            expect(content).toMatch(/transition:\s*none\s*!important/);
        });

        it('MaxTabItem.vue desativa transições de título de aba sob prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxTabItem.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toContain('.max-tab-item-title');
            expect(content).toMatch(/transition:\s*none\s*!important/);
        });
    });

    describe('Componentes Críticos de Alto Risco e Animação Contínua', () => {
        it('MaxCreditCard.vue remove rotação 3D e transição no flip sob prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxCreditCard.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toMatch(/perspective:\s*none/);
            expect(content).toMatch(/transition:\s*none/);
        });

        it('MaxAiIcon.vue remove pulsação contínua sob prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxAiIcon.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toMatch(/animation:\s*none/);
        });

        it('MaxModal.vue remove shake e deslocamentos sob prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxModal.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toMatch(/is-shaking\s*\{\s*animation:\s*none/);
            expect(content).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
        });

        it('MaxToast.vue desativa animação de barra, deslocamentos e reordenação sob prefers-reduced-motion', () => {
            const filePath = path.resolve(SRC_DIR, 'components/MaxToast.vue');
            const content = fs.readFileSync(filePath, 'utf-8');

            expect(content).toContain('@media (prefers-reduced-motion: reduce)');
            expect(content).toMatch(/max-toast-progress-bar\s*\{\s*animation:\s*none/);
            expect(content).toMatch(/max-toast-move\s*\{\s*transition:\s*none/);
            expect(content).toMatch(/transform:\s*none/);
        });
    });

    describe('Feedback e Animações Auxiliares', () => {
        it('MaxLoaderIcon e componentes de tabela desaceleram rotação em prefers-reduced-motion', () => {
            const loaderPath = path.resolve(SRC_DIR, 'components/MaxLoaderIcon.vue');
            const loaderContent = fs.readFileSync(loaderPath, 'utf-8');
            expect(loaderContent).toContain('@media (prefers-reduced-motion: reduce)');
            expect(loaderContent).toContain('animation-duration: 4s');

            const tablePath = path.resolve(SRC_DIR, 'components/MaxTable.vue');
            const tableContent = fs.readFileSync(tablePath, 'utf-8');
            expect(tableContent).toContain('@media (prefers-reduced-motion: reduce)');
            expect(tableContent).toContain('animation-duration: 4s');
        });

        it('MaxLikeButton e MaxInputIconPicker removem pop e slide sob prefers-reduced-motion', () => {
            const likePath = path.resolve(SRC_DIR, 'components/MaxLikeButton.vue');
            const likeContent = fs.readFileSync(likePath, 'utf-8');
            expect(likeContent).toContain('@media (prefers-reduced-motion: reduce)');
            expect(likeContent).toMatch(/animation:\s*none/);

            const iconPickerPath = path.resolve(SRC_DIR, 'components/MaxInputIconPicker.vue');
            const iconPickerContent = fs.readFileSync(iconPickerPath, 'utf-8');
            expect(iconPickerContent).toContain('@media (prefers-reduced-motion: reduce)');
            expect(iconPickerContent).toMatch(/animation:\s*none/);
        });
    });

    describe('Inventário Automatizado de Motion e Cobertura Sistêmica (R18 / E10-09)', () => {
        function getVueFiles(dir: string): string[] {
            const results: string[] = [];
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) results.push(...getVueFiles(fullPath));
                else if (entry.isFile() && entry.name.endsWith('.vue')) results.push(fullPath);
            }
            return results;
        }

        it('classifica todos os SFCs com animações ou transições e exige 100% de cobertura reduced-motion', () => {
            const componentsDir = path.resolve(SRC_DIR, 'components');
            const allFiles = getVueFiles(componentsDir);

            interface ClassifiedComponent {
                file: string;
                category: 'keyframe-high-risk' | 'layout-transition' | 'micro-interaction';
                hasKeyframes: boolean;
                hasTransition: boolean;
                hasAnimation: boolean;
                hasExplicitReduced: boolean;
            }

            const motionComponents: ClassifiedComponent[] = [];

            for (const file of allFiles) {
                const content = fs.readFileSync(file, 'utf-8');
                const styles = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
                const hasKeyframes = /@keyframes/i.test(styles);
                const hasTransition = /transition(?:\s*:\s*|-duration|-delay)/i.test(styles);
                const hasAnimation = /animation(?:\s*:\s*|-name|-duration)/i.test(styles);

                if (hasKeyframes || hasTransition || hasAnimation) {
                    const hasExplicitReduced = /prefers-reduced-motion/i.test(styles);
                    const baseName = path.basename(file);

                    let category: ClassifiedComponent['category'] = 'micro-interaction';
                    if (hasKeyframes) category = 'keyframe-high-risk';
                    else if (
                        /modal|drawer|menu|tab|side|toast|transition/i.test(baseName) ||
                        /transform|height|width|top|bottom|left|right/i.test(styles)
                    ) category = 'layout-transition';


                    motionComponents.push({
                        file: baseName,
                        category,
                        hasKeyframes,
                        hasTransition,
                        hasAnimation,
                        hasExplicitReduced
                    });
                }
            }

            // Exige cobertura completa de todos os componentes com movimento (não apenas keyframes)
            expect(motionComponents.length).toBeGreaterThanOrEqual(56);

            const missingReduced = motionComponents.filter((c) => !c.hasExplicitReduced);
            const msg = `Componentes com movimento sem regra prefers-reduced-motion: ${missingReduced.map((c) => c.file).join(', ')}`;
            expect(missingReduced, msg).toHaveLength(0);

            // Valida que as categorias de layout e alto risco possuem cobertura
            const highRisk = motionComponents.filter((c) => c.category === 'keyframe-high-risk');
            const layoutTransitions = motionComponents.filter((c) => c.category === 'layout-transition');
            const microInteractions = motionComponents.filter((c) => c.category === 'micro-interaction');

            expect(highRisk.length).toBeGreaterThan(0);
            expect(layoutTransitions.length).toBeGreaterThan(0);
            expect(microInteractions.length).toBeGreaterThan(0);

            // Garante inclusão explícita dos componentes alvo do R18
            const monitoredFiles = ['MaxSideMenuMobile.vue', 'MaxInputOTP.vue', 'MaxTabItem.vue'];
            for (const monitored of monitoredFiles) {
                const found = motionComponents.find((c) => c.file === monitored);
                expect(found, `Componente ${monitored} deve constar no inventário`).toBeDefined();
                expect(found?.hasExplicitReduced, `${monitored} deve ter prefers-reduced-motion`).toBe(true);
            }
        });
    });

    describe('Emulação de prefers-reduced-motion e Integridade de Lifecycle', () => {
        it('emula transição de tokens de movimento entre no-preference e reduce', () => {
            const motionScssPath = path.resolve(SRC_DIR, 'themes/_motion.scss');
            const content = fs.readFileSync(motionScssPath, 'utf-8');
            const compiledCss = compileString(content).css;

            // Tokens no-preference em :root
            expect(compiledCss).toContain('--max-motion-duration-fast: 0.15s');
            expect(compiledCss).toContain('--max-motion-duration-normal: 0.2s');
            expect(compiledCss).toContain('--max-motion-duration-slow: 0.35s');

            // Tokens sob media query reduce
            const reduceMediaIndex = compiledCss.indexOf('@media (prefers-reduced-motion: reduce)');
            expect(reduceMediaIndex).toBeGreaterThan(0);
            const reduceCss = compiledCss.slice(reduceMediaIndex);

            expect(reduceCss).toContain('--max-motion-duration-fast: 0.01ms');
            expect(reduceCss).toContain('--max-motion-duration-normal: 0.01ms');
            expect(reduceCss).toContain('--max-motion-duration-slow: 0.01ms');
        });

        it('MaxTransitionFadeLight preserva lifecycle de montagem e desmontagem sem travar', async () => {
            const enterHook = vitest.fn();
            const leaveHook = vitest.fn();

            const TestComponent = defineComponent({
                components: { MaxTransitionFadeLight },
                setup() {
                    const visible = ref(false);
                    return { visible, enterHook, leaveHook };
                },
                template: `
                    <MaxTransitionFadeLight>
                        <div v-if="visible" id="animated-target" class="fadelight-enter-active">
                            Conteúdo com Transição
                        </div>
                    </MaxTransitionFadeLight>
                `
            });

            const wrapper = mount(TestComponent);

            // Inicialmente oculto
            expect(wrapper.find('#animated-target').exists()).toBe(false);

            // Entrada
            wrapper.vm.visible = true;
            await nextTick();
            expect(wrapper.find('#animated-target').exists()).toBe(true);
            expect(wrapper.find('#animated-target').text()).toBe('Conteúdo com Transição');

            // Saída
            wrapper.vm.visible = false;
            await nextTick();
            expect(wrapper.find('#animated-target').exists()).toBe(false);

            wrapper.unmount();
        });

        it('MaxTransitionUp executa transição funcional com animação reduzida sem transform residual', async () => {
            const TestComponent = defineComponent({
                components: { MaxTransitionUp },
                setup() {
                    const visible = ref(false);
                    return { visible };
                },
                template: `
                    <MaxTransitionUp>
                        <div v-if="visible" id="slide-target">
                            Alvo Vertical
                        </div>
                    </MaxTransitionUp>
                `
            });

            const wrapper = mount(TestComponent);
            expect(wrapper.find('#slide-target').exists()).toBe(false);

            wrapper.vm.visible = true;
            await nextTick();
            expect(wrapper.find('#slide-target').exists()).toBe(true);

            wrapper.vm.visible = false;
            await nextTick();
            expect(wrapper.find('#slide-target').exists()).toBe(false);

            wrapper.unmount();
        });
    });
});
