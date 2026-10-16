// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxMarkdownViewer from '../../src/components/MaxMarkdownViewer.vue';

describe('MaxMarkdownViewer.vue', () => {
    it('deve chamar renderMarkdown com o texto de source e renderizar a saída sanitizada', () => {
        const mockRenderer = vi.fn((md: string) => `<h1>${md}</h1>`);

        const wrapper = mount(MaxMarkdownViewer, {
            props: {
                source: 'Título Principal',
                renderMarkdown: mockRenderer
            }
        });

        expect(mockRenderer).toHaveBeenCalledWith('Título Principal');
        expect(wrapper.find('h1').text()).toBe('Título Principal');
    });

    it('deve sanitizar tags maliciosas retornadas pelo renderer', () => {
        const mockRenderer = vi.fn(() => '<p>Parágrafo<script>alert("hack")</script></p>');

        const wrapper = mount(MaxMarkdownViewer, {
            props: {
                source: 'qualquer',
                renderMarkdown: mockRenderer
            }
        });

        expect(wrapper.find('script').exists()).toBe(false);
        expect(wrapper.text()).toContain('Parágrafo');
    });

    it('deve degradar para texto puro escapado quando renderMarkdown lançar erro síncrono', () => {
        const brokenRenderer = vi.fn(() => {
            throw new Error('Falha no parser Markdown');
        });

        const wrapper = mount(MaxMarkdownViewer, {
            props: {
                source: '<script>alert(1)</script> Texto puro',
                renderMarkdown: brokenRenderer
            }
        });

        expect(wrapper.find('script').exists()).toBe(false);
        expect(wrapper.text()).toContain('<script>alert(1)</script> Texto puro');
    });

    it('deve emitir image-click ao clicar em imagem sanitizada válida', async () => {
        const mockRenderer = vi.fn(() => '<p><img src="https://example.com/foto.jpg" alt="Foto teste" /></p>');

        const wrapper = mount(MaxMarkdownViewer, {
            props: {
                source: '![Foto teste](https://example.com/foto.jpg)',
                renderMarkdown: mockRenderer
            }
        });

        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);

        await img.trigger('click');

        expect(wrapper.emitted('image-click')).toHaveLength(1);
        expect(wrapper.emitted('image-click')?.[0]).toEqual([{
            src: 'https://example.com/foto.jpg',
            alt: 'Foto teste'
        }]);
    });
});
