import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import MaxTitle1 from '../../src/components/MaxTitle1.vue';
import MaxTitle2 from '../../src/components/MaxTitle2.vue';

describe('Validação de Hierarquia DOM e Aninhamento SCSS', () => {
    const readComponent = (filename: string) => {
        const filePath = resolve(__dirname, '../../src/components', filename);
        return readFileSync(filePath, 'utf-8');
    };

    describe('MaxTitle1.vue', () => {
        const source = readComponent('MaxTitle1.vue');

        it('template possui a tag intermediária com classe semântica title-text-group', () => {
            expect(source).toContain('class="title-text-group"');
            expect(source).toMatch(/<div class="title-text-group">\s*<div [^>]*class="t1-main-text"/);
        });

        it('bloco SCSS aninha .title-text-group e suas classes filhas', () => {
            expect(source).toMatch(/\.title-text-group\s*\{[\s\S]*?\.t1-main-text[\s\S]*?\.t2-main-text[\s\S]*?\}/);
        });

        it('renderiza árvore DOM com .title-text-group envolvendo títulos', () => {
            const wrapper = mount(MaxTitle1, {
                props: { title: 'Principal', subtitle: 'Secundário' },
                global: {
                    stubs: {
                        MaxIcon: { template: '<div class="max-icon"></div>' }
                    }
                }
            });

            const group = wrapper.find('.title-text-group');
            expect(group.exists()).toBe(true);
            expect(group.find('.t1-main-text').text()).toBe('Principal');
            expect(group.find('.t2-main-text').text()).toBe('Secundário');
        });
    });

    describe('MaxTitle2.vue', () => {
        const source = readComponent('MaxTitle2.vue');

        it('template possui div intermediário com classe semântica title-text-group', () => {
            expect(source).toContain('class="title-text-group"');
            expect(source).toMatch(/<div class="title-text-group">\s*<div [^>]*class="text-h1"/);
        });

        it('bloco SCSS aninha .title-text-group e suas classes filhas', () => {
            expect(source).toMatch(/\.title-text-group\s*\{[\s\S]*?\.text-h1[\s\S]*?\.text-h2[\s\S]*?\}/);
        });

        it('renderiza árvore DOM com .title-text-group envolvendo títulos', () => {
            const wrapper = mount(MaxTitle2, {
                props: { title: 'Título 2', subtitle: 'Sub 2' },
                global: {
                    stubs: {
                        MaxIcon: { template: '<div class="max-icon"></div>' }
                    }
                }
            });

            const group = wrapper.find('.title-text-group');
            expect(group.exists()).toBe(true);
            expect(group.find('.text-h1').text()).toBe('Título 2');
            expect(group.find('.text-h2').text()).toBe('Sub 2');
        });
    });

    describe('MaxTopMenuSearchBar.vue', () => {
        const source = readComponent('MaxTopMenuSearchBar.vue');

        it('não possui seletores legados ou órfãos do PrimeVue no SCSS', () => {
            expect(source).not.toContain('p-checkbox-box');
            expect(source).not.toContain('p-checkbox-input');
            expect(source).not.toContain('p-checkbox-checked');
        });

        it('aninha a hierarquia do painel mobile espelhando a árvore do template', () => {
            expect(source).toMatch(/\.mobile-search-panel\s*\{[\s\S]*?\.mobile-search-content\s*\{[\s\S]*?\.mobile-input[\s\S]*?\.btn-close-search[\s\S]*?\}[\s\S]*?\}/);
        });

        it('aninha classes de transição dentro de seus respectivos elementos', () => {
            expect(source).toMatch(/\.mobile-search-overlay\s*\{[\s\S]*?&amp;\.search-fade-enter-active|&amp;\.search-fade|\.search-fade/);
            expect(source).toMatch(/\.mobile-search-panel\s*\{[\s\S]*?&amp;\.search-slide-down-enter-active|&amp;\.search-slide-down|\.search-slide-down/);
        });
    });

    describe('MaxButton.vue', () => {
        const source = readComponent('MaxButton.vue');

        it('não contém o seletor órfão .icon-button-b no template nem no SCSS', () => {
            expect(source).not.toContain('icon-button-b');
        });
    });
});
