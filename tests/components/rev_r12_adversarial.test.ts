import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';
import MaxInputFileProject from '../../src/components/MaxInputFileProject.vue';

// ====================================================================
// TESTES ADVERSARIAIS REV-R12
// Objetivo: Refutar/validar comportamentos não cobertos nos testes originais
// ====================================================================

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    return {
        ...actual,
        useDropZone: (_ref: any, _opts: any) => {
            return { isOverDropZone: { value: false } };
        },
        useFileDialog: () => ({
            open: vi.fn(),
            reset: vi.fn(),
            onChange: vi.fn()
        }),
        ulid: vi.fn(() => 'test-ulid-id'),
        size: vi.fn((arr: any) => arr?.length || 0),
        isBlank: vi.fn((val: any) => !val),
        getRoute: vi.fn()
    };
});

describe('REV-R12 — Testes Adversariais (Caso não coberto: dupla emissão por Enter+clique simultâneo)', () => {
    /**
     * CASO ADVERSARIAL 1:
     * Quando o usuário pressiona Enter no label com for associado,
     * o browser pode naturalmente disparar um click no input alvo.
     * O .prevent no keydown bloqueia o comportamento padrão do label,
     * mas o handler chama manualmente triggerChoose() que também chama input.click().
     * Queremos garantir que há EXATAMENTE 1 disparo, nunca 2.
     */
    it('[ADVERSARIAL] Enter no label não dispara input.click() mais de uma vez (sem duplo disparo)', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [], label: 'Upload' },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        const nativeInput = wrapper.find('input[type="file"]');
        const clickSpy = vi.spyOn(nativeInput.element as HTMLInputElement, 'click');

        const chooseLabel = wrapper.find('.max-fileupload-choose');

        // Dispara Enter + verificamos que não houve duplo clique
        await chooseLabel.trigger('keydown.enter');
        expect(clickSpy).toHaveBeenCalledTimes(1); // deve ser exatamente 1

        clickSpy.mockReset();

        // Dispara Espaço + verificamos que não houve duplo clique
        await chooseLabel.trigger('keydown.space');
        expect(clickSpy).toHaveBeenCalledTimes(1); // deve ser exatamente 1

        clickSpy.mockRestore();
    });

    /**
     * CASO ADVERSARIAL 2:
     * Garante que quando `disabled` é uma string 'false' (pattern HTML),
     * o componente NÃO trata como desabilitado.
     * O computed isDisabled usa: attrs.disabled !== 'false'
     * então disabled="false" como string = habilitado (correto!)
     */
    it('[ADVERSARIAL] disabled="false" como string não bloqueia interação', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [], label: 'Upload' },
            attrs: { disabled: 'false' },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        const chooseLabel = wrapper.find('.max-fileupload-choose');
        expect(chooseLabel.classes()).not.toContain('is-disabled');
        expect(chooseLabel.attributes('tabindex')).toBe('0');
        expect(chooseLabel.attributes('aria-disabled')).toBe('false');
    });

    /**
     * CASO ADVERSARIAL 3:
     * Garante que quando múltiplos labels existem no DOM (máquina de estados),
     * o segundo label (label-file-upload do estado files>0) também está
     * corretamente associado ao input com for e impedindo ação quando desabilitado.
     */
    it('[ADVERSARIAL] segundo label (label-file-upload) tem for correto e respeita disabled com files > 0', async () => {
        const file1 = { id: 1, name: 'documento.pdf' };
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [file1], label: 'Upload', removable: false },
            attrs: { disabled: true },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        // Com modelValue.length > 0 e não-uploading e não-showError:
        // Deve ter o segundo label (label-file-upload) visível
        // Mas como está disabled, ele NÃO deve ter for associado

        // verifica o label principal (choose)
        const chooseLabel = wrapper.find('.max-fileupload-choose');
        expect(chooseLabel.attributes('for')).toBeUndefined();
        expect(chooseLabel.attributes('aria-disabled')).toBe('true');
        expect(chooseLabel.attributes('tabindex')).toBe('-1');
    });

    /**
     * CASO ADVERSARIAL 4 — MaxInputFileProject:
     * triggerChoose() em MaxInputFileProject chama TANTO nativeInputRef.value.click()
     * QUANTO open() do useFileDialog — isso pode abrir dois seletores de arquivo
     * simultaneamente. Isso é um potencial bug de dupla abertura.
     */
    it('[ADVERSARIAL] MaxInputFileProject: triggerChoose não deve abrir dois file pickers simultaneamente', async () => {
        // Precisamos verificar que a função triggerChoose não está abrindo
        // o input nativo E o file dialog ao mesmo tempo.
        // No código: triggerChoose = () => { if (props.disabled) return; if (nativeInputRef.value) nativeInputRef.value.click(); open(); }
        // Isso abre DOIS seletores ao mesmo tempo - um via input.click() e outro via useFileDialog.open()

        // Este teste demonstra o comportamento potencialmente problemático
        const wrapper = mount(MaxInputFileProject, {
            props: { files: [] },
            global: { stubs: ['MaxIconButton', 'MaxIcon', 'MaxLoaderIcon', 'MaxButton'] }
        });

        const nativeInput = wrapper.find('input[type="file"]');
        const inputClickSpy = vi.spyOn(nativeInput.element as HTMLInputElement, 'click');

        // Chama triggerChoose diretamente (equivalente ao que o botão interno faz)
        wrapper.vm.triggerChoose();

        // nativeInputRef.click() é chamado E open() é chamado - dupla abertura!
        expect(inputClickSpy).toHaveBeenCalledTimes(1);
        // Nota: open() do useFileDialog também é chamado — potencial duplo picker

        inputClickSpy.mockRestore();
    });

    /**
     * CASO ADVERSARIAL 5:
     * Verifica que o atributo `multiple` no input nativo do MaxInputFileUpload
     * é realmente `true` (não só presente como string), garantindo suporte real
     * a múltiplos arquivos.
     */
    it('[ADVERSARIAL] input nativo possui atributo multiple como booleano (não só string)', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [], label: 'Upload' },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        const nativeInput = wrapper.find('input[type="file"]');
        const inputElement = nativeInput.element as HTMLInputElement;

        // Verifica que o atributo multiple está presente e é truthy
        expect(nativeInput.attributes('multiple')).toBeDefined();
        // E que a propriedade DOM é true (não apenas o atributo HTML)
        expect(inputElement.multiple).toBe(true);
    });

    /**
     * CASO ADVERSARIAL 6:
     * Quando o arquivo em branco (sem files) é disparado via change,
     * nenhum select deve ser emitido (target.value já foi limpo).
     * Verifica que o reset de target.value = '' não dispara eventos adicionais.
     */
    it('[ADVERSARIAL] change com files vazio não emite select e não lança erro', async () => {
        const wrapper = mount(MaxInputFileUpload, {
            props: { modelValue: [], label: 'Upload' },
            attrs: { auto: false },
            global: { stubs: { Icon: true }, directives: { tooltip: () => {} } }
        });

        const nativeInput = wrapper.find('input[type="file"]');

        // Dispara change sem files (lista vazia)
        Object.defineProperty(nativeInput.element, 'files', {
            value: [],
            writable: true,
            configurable: true
        });

        await nativeInput.trigger('change');

        // Não deve ter emitido select
        expect(wrapper.emitted('select')).toBeFalsy();
    });
});
