import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import fs from 'fs';
import path from 'path';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';

const COMPONENTS_DIR = path.resolve(__dirname, '../../src/components');

function getComponentsUsingInputBase(): string[] {
    const results: string[] = [];
    const files = fs.readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.vue'));

    for (const file of files) {
        const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8');
        if (/<InputBase\b/.test(content)) results.push(file);
    }

    return results;
}

describe('Auditoria Arquitetural: Acessibilidade de InputBase e Consumidores', () => {
    it('as 25 famílias de componentes de entrada devem conectar atributos ao controle nativo ou ao proxy de formulário', () => {
        const consumers = getComponentsUsingInputBase();
        expect(consumers.length).toBe(25);

        const unmigrated: string[] = [];
        for (const file of consumers) {
            const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8');
            // Controles nativos usam `inputAttrs`; controles ARIA compostos usam
            // `formAttrs` (owner nativo) e `triggerAttrs` (gatilho operável).
            const hasNativeControl = /<template\s+#default=["']\{[^}]*inputAttrs[^}]*\}["']/.test(content);
            const hasCompositeControl = /<template\s+#default=["']\{[^}]*formAttrs[^}]*triggerAttrs[^}]*\}["']/.test(content);
            if (!hasNativeControl && !hasCompositeControl) unmigrated.push(file);
        }

        expect(unmigrated).toEqual([]);

        // A última família de entrada é MaxInputToggle (componente especializado com input checkbox nativo)
        const toggleContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'MaxInputToggle.vue'), 'utf-8');
        expect(toggleContent).toMatch(/<input[^>]*type="checkbox"[^>]*class="max-toggleswitch-input"/);
        expect(toggleContent).toMatch(/v-bind="controlAttrs"/);
        expect(toggleContent).toMatch(/:id="toggleInputId"/);

        const allFamilies = [...consumers, 'MaxInputToggle.vue'];
        expect(allFamilies.length).toBe(26);
    });

    describe('Conexão acessível de controles representativos', () => {
        it('MaxInputText conecta id, label, aria-required, aria-invalid e aria-describedby', () => {
            const wrapper = mount(MaxInputText, {
                props: {
                    modelValue: '',
                    label: 'Nome completo',
                    required: true,
                    error: 'Campo obrigatório'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(label.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputNumber conecta id, label, aria-required e aria-describedby', () => {
            const wrapper = mount(MaxInputNumber, {
                props: {
                    modelValue: 0,
                    label: 'Quantidade',
                    required: true,
                    msg: 'Informe a quantidade'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputTextArea conecta id, label e aria-required no elemento textarea', () => {
            const wrapper = mount(MaxInputTextArea, {
                props: {
                    modelValue: '',
                    label: 'Observações',
                    required: true,
                    error: 'Texto obrigatório'
                }
            });

            const textarea = wrapper.find('textarea');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(textarea.exists()).toBe(true);
            expect(textarea.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(textarea.attributes('id'));
            expect(textarea.attributes('aria-required')).toBe('true');
            expect(textarea.attributes('aria-invalid')).toBe('true');
            expect(textarea.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputSelect mantém ARIA no combobox e associa label ao owner nativo', () => {
            const wrapper = mount(MaxInputSelect, {
                props: {
                    modelValue: null,
                    options: [{ id: 1, name: 'Opção 1' }],
                    label: 'Categoria',
                    required: true,
                    error: 'Selecione uma categoria'
                }
            });

            const combobox = wrapper.find('.max-select[role="combobox"]');
            const formOwner = wrapper.find('.max-native-form-proxy');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(combobox.exists()).toBe(true);
            expect(formOwner.exists()).toBe(true);
            expect(formOwner.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(formOwner.attributes('id'));
            expect(combobox.attributes('aria-required')).toBe('true');
            expect(combobox.attributes('aria-invalid')).toBe('true');
            expect(combobox.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxChips conecta inputAttrs no input de digitação de tags', () => {
            const wrapper = mount(MaxChips, {
                props: {
                    modelValue: ['vue'],
                    label: 'Tags',
                    required: true
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
        });

        it('MaxInputDatePicker conecta inputAttrs no input nativo mascarado', () => {
            const wrapper = mount(MaxInputDatePicker, {
                props: {
                    modelValue: '',
                    label: 'Data de Nascimento',
                    required: true,
                    error: 'Data obrigatória'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputCpfCnpj conecta inputAttrs no input de documento', () => {
            const wrapper = mount(MaxInputCpfCnpj, {
                props: {
                    modelValue: '',
                    label: 'CPF/CNPJ',
                    required: true,
                    error: 'Documento inválido'
                }
            });

            const input = wrapper.find('input');
            const label = wrapper.find('label');
            const message = wrapper.find('.input-message');

            expect(input.exists()).toBe(true);
            expect(input.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(input.attributes('id'));
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-describedby')).toBe(message.attributes('id'));
        });

        it('MaxInputSwitch mantém ARIA no switch e associa label ao owner nativo', () => {
            const wrapper = mount(MaxInputSwitch, {
                props: {
                    modelValue: false,
                    label: 'Notificações',
                    required: true
                }
            });

            const toggle = wrapper.find('[role="switch"]');
            const formOwner = wrapper.find('.max-native-form-proxy');
            const label = wrapper.find('label');

            expect(toggle.exists()).toBe(true);
            expect(formOwner.exists()).toBe(true);
            expect(formOwner.attributes('id')).toBeTruthy();
            expect(label.attributes('for')).toBe(formOwner.attributes('id'));
            expect(toggle.attributes('aria-required')).toBe('true');
        });

        it('instâncias múltiplas no mesmo contexto geram IDs únicos garantindo que labels não colidam', () => {
            const TestContainer = {
                components: { MaxInputText },
                template: '<div><MaxInputText model-value="" label="Campo 1" /><MaxInputText model-value="" label="Campo 2" /></div>'
            };
            const wrapper = mount(TestContainer);
            const inputs = wrapper.findAll('input');

            expect(inputs.length).toBe(2);
            const id1 = inputs[0].attributes('id');
            const id2 = inputs[1].attributes('id');

            expect(id1).toBeTruthy();
            expect(id2).toBeTruthy();
            expect(id1).not.toBe(id2);
        });

        it('garante que o wrapper raiz e a div intermediária NÃO retêm atributos de controle (aria-invalid, aria-describedby, form attrs)', () => {
            const wrapper = mount(MaxInputText, {
                props: {
                    modelValue: '',
                    label: 'Documento',
                    required: true,
                    error: 'Campo obrigatório',
                    disabled: true
                },
                attrs: {
                    id: 'custom-input-id',
                    name: 'documento_usuario',
                    autocomplete: 'off',
                    'aria-label': 'Documento Oficial',
                    'aria-describedby': 'external-help-id',
                    'aria-errormessage': 'external-error-id',
                    'data-testid': 'documento-wrapper-root'
                }
            });

            const rootDiv = wrapper.find('.max-input-base');
            const fieldDiv = wrapper.find('.max-input-field-div');
            const input = wrapper.find('input');

            // 1. Wrapper raiz retém class, style e data-*
            expect(rootDiv.attributes('data-testid')).toBe('documento-wrapper-root');
            expect(rootDiv.classes()).toContain('max-input-base');

            // 2. Wrapper raiz NÃO pode reter atributos de controle
            expect(rootDiv.attributes('aria-invalid')).toBeUndefined();
            expect(rootDiv.attributes('aria-describedby')).toBeUndefined();
            expect(rootDiv.attributes('aria-required')).toBeUndefined();
            expect(rootDiv.attributes('aria-label')).toBeUndefined();
            expect(rootDiv.attributes('aria-errormessage')).toBeUndefined();
            expect(rootDiv.attributes('name')).toBeUndefined();
            expect(rootDiv.attributes('disabled')).toBeUndefined();
            expect(rootDiv.attributes('autocomplete')).toBeUndefined();

            // 3. Div intermediária do campo NÃO pode reter aria-invalid nem aria-describedby
            expect(fieldDiv.attributes('aria-invalid')).toBeUndefined();
            expect(fieldDiv.attributes('aria-describedby')).toBeUndefined();

            // 4. Controle nativo recebe os atributos de controle e acessibilidade
            expect(input.attributes('id')).toBe('custom-input-id');
            expect(input.attributes('name')).toBe('documento_usuario');
            expect(input.attributes('aria-invalid')).toBe('true');
            expect(input.attributes('aria-required')).toBe('true');
            expect(input.attributes('aria-disabled')).toBe('true');
            expect(input.attributes('disabled')).toBeDefined();
            expect(input.attributes('aria-label')).toBe('Documento Oficial');
            expect(input.attributes('aria-errormessage')).toBe('external-error-id');
            expect(input.attributes('autocomplete')).toBe('off');

            // 5. aria-describedby no controle compõe dica externa e ID da mensagem
            const describedby = input.attributes('aria-describedby');
            expect(describedby).toContain('external-help-id');
            expect(describedby).toContain('custom-input-id-message');
        });

        it('label click: associação semântica garante foco correto no controle através do ID', async () => {
            const wrapper = mount(MaxInputText, {
                attachTo: document.body,
                props: {
                    modelValue: '',
                    label: 'Clique aqui'
                }
            });

            const label = wrapper.find('label');
            const input = wrapper.find('input');

            expect(label.exists()).toBe(true);
            expect(input.exists()).toBe(true);
            expect(label.attributes('for')).toBe(input.attributes('id'));

            // O happy-dom não executa a ação padrão nativa de foco do label.
            // Aqui verificamos a associação semântica; a interação real é coberta
            // pela suíte Chromium.
            await label.trigger('click');
            expect(label.attributes('for')).toBe(input.attributes('id'));

            wrapper.unmount();
        });

        it('disabled e required: repasse estrito ao controle sem vazamento para wrappers', () => {
            const wrapper = mount(MaxInputText, {
                props: {
                    modelValue: 'Texto',
                    disabled: true,
                    required: true
                }
            });

            const root = wrapper.find('.max-input-base');
            const input = wrapper.find('input');

            expect(root.attributes('disabled')).toBeUndefined();
            expect(root.attributes('required')).toBeUndefined();
            expect(root.attributes('aria-disabled')).toBeUndefined();
            expect(root.attributes('aria-required')).toBeUndefined();

            expect(input.attributes('disabled')).toBeDefined();
            expect(input.attributes('aria-disabled')).toBe('true');
            expect(input.attributes('aria-required')).toBe('true');
        });
    });
});
