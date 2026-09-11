import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import MaxInputFileUploadBig from '../../src/components/MaxInputFileUploadBig.vue';

const openMock = vi.fn();
const resetMock = vi.fn();

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
        ...actual,
        useFileDialog: () => ({
            open: openMock,
            reset: resetMock,
            onChange: vi.fn()
        }),
        useDropZone: () => ({ isOverDropZone: ref(false) })
    };
});

describe('MaxInputFileUploadBig (Keyboard Navigation & Accessibility)', () => {
    it('possui role=button, tabindex=0 e aria-label padrão quando habilitado', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const root = wrapper.find('.input-upload-file-big-main-div');
        expect(root.exists()).toBe(true);
        expect(root.attributes('role')).toBe('button');
        expect(root.attributes('tabindex')).toBe('0');
        expect(root.attributes('aria-label')).toBe('Área de envio de arquivos. Pressione Enter ou Espaço para escolher arquivos para upload');
        expect(root.attributes('aria-disabled')).toBeUndefined();
    });

    it('inclui o label customizado no aria-label', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            props: { label: 'Envie seu comprovante' },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const root = wrapper.find('.input-upload-file-big-main-div');
        expect(root.attributes('aria-label')).toBe('Envie seu comprovante. Pressione Enter ou Espaço para escolher arquivos');
    });

    it('aplica tabindex=-1 e aria-disabled=true quando disabled=true', () => {
        const wrapper = mount(MaxInputFileUploadBig, {
            props: { disabled: true },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const root = wrapper.find('.input-upload-file-big-main-div');
        expect(root.attributes('tabindex')).toBe('-1');
        expect(root.attributes('aria-disabled')).toBe('true');
        expect(root.classes()).toContain('is-disabled');
    });

    it('aciona o seletor de arquivos ao pressionar Enter ou Espaço', async () => {
        openMock.mockClear();
        const wrapper = mount(MaxInputFileUploadBig, {
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const root = wrapper.find('.input-upload-file-big-main-div');
        await root.trigger('keydown.enter');
        expect(openMock).toHaveBeenCalledTimes(1);

        await root.trigger('keydown.space');
        expect(openMock).toHaveBeenCalledTimes(2);
    });

    it('não abre seletor ao pressionar tecla quando disabled=true', async () => {
        openMock.mockClear();
        const wrapper = mount(MaxInputFileUploadBig, {
            props: { disabled: true },
            global: {
                stubs: { Icon: true, DotLottieVue: true }
            }
        });

        const root = wrapper.find('.input-upload-file-big-main-div');
        await root.trigger('keydown.enter');
        await root.trigger('keydown.space');
        expect(openMock).not.toHaveBeenCalled();
    });
});
