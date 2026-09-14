import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(__dirname, '../../src');

describe('E10-09: Política Sistêmica de Movimento Reduzido (prefers-reduced-motion)', () => {
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

        it('gera inventário de todos os SFCs com animações ou transições e garante conformidade', () => {
            const componentsDir = path.resolve(SRC_DIR, 'components');
            const allFiles = getVueFiles(componentsDir);

            const motionComponents: { file: string; hasKeyframes: boolean; hasExplicitReduced: boolean }[] = [];

            for (const file of allFiles) {
                const content = fs.readFileSync(file, 'utf-8');
                const styles = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
                const hasKeyframes = /@keyframes/i.test(styles);
                const hasTransition = /transition(?:\s*:\s*|-duration|-delay)/i.test(styles);
                const hasAnimation = /animation(?:\s*:\s*|-name|-duration)/i.test(styles);

                if (hasKeyframes || hasTransition || hasAnimation) {
                    const hasExplicitReduced = /prefers-reduced-motion/i.test(styles);
                    motionComponents.push({
                        file: path.basename(file),
                        hasKeyframes,
                        hasExplicitReduced
                    });
                }
            }

            expect(motionComponents.length).toBeGreaterThan(0);

            // Todos os componentes com keyframes explícitos devem ter redução específica ou documentada
            const keyframeComponents = motionComponents.filter((c) => c.hasKeyframes);
            for (const comp of keyframeComponents) {
                const msg = `Componente com keyframes ${comp.file} deve possuir regra específica de prefers-reduced-motion`;
                expect(comp.hasExplicitReduced, msg).toBe(true);
            }


        });

        it('src/themes/_motion.scss define cobertura universal para *, *::before e *::after', () => {
            const motionScssPath = path.resolve(SRC_DIR, 'themes/_motion.scss');
            const content = fs.readFileSync(motionScssPath, 'utf-8');

            expect(content).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\*,\s*\*::before,\s*\*::after\s*\{/);
            expect(content).toContain('animation-duration: 0.01ms !important');
            expect(content).toContain('transition-duration: 0.01ms !important');
        });
    });
});
